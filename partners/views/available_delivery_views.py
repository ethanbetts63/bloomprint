import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import Event
from config.pagination import DashboardPagination
from partners.models import BusinessAccount, DeliveryRequest
from partners.serializers.available_delivery_serializer import AvailableDeliverySerializer
from partners.utils.matching import claimable_events_for_florist, event_is_claimable, florist_covers_event

logger = logging.getLogger(__name__)


def _florist_or_none(user):
    return BusinessAccount.objects.filter(user=user, account_type='florist').first()


class AvailableDeliveryListView(APIView):
    """The claim board: every unclaimed delivery inside this florist's service area."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        florist = _florist_or_none(request.user)
        if florist is None:
            return Response({'detail': 'No florist account was found.'}, status=status.HTTP_404_NOT_FOUND)

        # A florist awaiting approval can see nothing. Returning an empty board
        # rather than a 403 keeps the dashboard renderable while they wait.
        if florist.status != 'active':
            events = []
        else:
            events = claimable_events_for_florist(florist)

        paginator = DashboardPagination()
        page = paginator.paginate_queryset(events, request, view=self)
        serializer = AvailableDeliverySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AvailableDeliveryDetailView(APIView):
    """
    One claimable delivery, in full — same non-PII fields as the board row.

    Scoped exactly like the board: a florist can only read a delivery that is
    still claimable and inside their own service area, so this cannot be used
    to enumerate orders by id.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        florist = _florist_or_none(request.user)
        if florist is None:
            return Response({'detail': 'No florist account was found.'}, status=status.HTTP_404_NOT_FOUND)

        if florist.status != 'active':
            return Response(
                {'detail': 'Your account is not yet approved to view deliveries.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            event = Event.objects.select_related('order').get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

        # A 404 rather than a 403: whether a delivery exists outside your area
        # is not something you get to learn.
        if not florist_covers_event(florist, event):
            return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not event_is_claimable(event):
            return Response(
                {'detail': 'This delivery has already been claimed.'},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(AvailableDeliverySerializer(event).data)


class ClaimDeliveryView(APIView):
    """
    First-come-first-served claim.

    The row lock is the concurrency guarantee: MySQL has no partial unique
    indexes, so "one accepted request per event" cannot be expressed as a
    constraint. Two florists clicking at once serialise on SELECT ... FOR UPDATE
    of the Event, and the loser sees the winner's row on re-check.
    """
    permission_classes = [IsAuthenticated]

    @staticmethod
    def claim_for_florist(florist, event_id, *, assigned_by_admin=False):
        if florist.status != 'active':
            return Response(
                {'detail': 'Your account is not yet approved to claim deliveries.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            try:
                event = Event.objects.select_for_update().select_related('order').get(pk=event_id)
            except Event.DoesNotExist:
                return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Re-check radius server-side. The board is only a suggestion; the
            # client could post any event id.
            if not florist_covers_event(florist, event):
                return Response(
                    {'detail': 'This delivery is outside your service area.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not event_is_claimable(event):
                return Response(
                    {'detail': 'This delivery has already been claimed.'},
                    status=status.HTTP_409_CONFLICT,
                )

            delivery_request = DeliveryRequest.objects.create(
                event=event,
                business_account=florist,
                status='accepted',
                responded_at=timezone.now(),
            )
            # Set inside the same locked transaction as the claim. The event
            # status and the claim row encode the same fact, so they must not be
            # able to disagree — the board reads one and the payout the other.
            event.status = 'claimed'
            event.save(update_fields=['status', 'updated_at'])

        # Outside the transaction: the claim is already committed and must not
        # be rolled back because an email failed. The florist can always read
        # the full brief from their dashboard.
        try:
            from data_management.utils.notification_factory import (
                cancel_event_notifications,
                create_admin_delivery_day_notifications,
                notify_florist_of_claim,
            )
            # The pending admin alerts for this event warn that nobody has taken
            # it. Someone just has.
            cancel_event_notifications(event)
            # Admin still wants a nudge on the day, to watch that the florist
            # actually delivers.
            create_admin_delivery_day_notifications(event)
            notify_florist_of_claim(delivery_request, assigned_by_admin=assigned_by_admin)
        except Exception:
            logger.exception(
                "Claim %s succeeded but its follow-up notifications failed.", delivery_request.pk
            )

        return Response(
            {
                'status': 'claimed',
                'delivery_request_id': delivery_request.id,
                'reference': event.reference,
            },
            status=status.HTTP_201_CREATED,
        )

    def post(self, request, event_id):
        florist = _florist_or_none(request.user)
        if florist is None:
            return Response({'detail': 'No florist account was found.'}, status=status.HTTP_404_NOT_FOUND)

        return self.claim_for_florist(florist, event_id)


class AdminAvailableDeliveryListView(APIView):
    """An admin's view of the same claim board a particular florist sees."""
    permission_classes = [IsAdminUser]

    def get(self, request, account_id):
        try:
            florist = BusinessAccount.objects.get(pk=account_id, account_type='florist')
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Florist not found.'}, status=status.HTTP_404_NOT_FOUND)

        events = claimable_events_for_florist(florist) if florist.status == 'active' else []
        paginator = DashboardPagination()
        page = paginator.paginate_queryset(events, request, view=self)
        return paginator.get_paginated_response(AvailableDeliverySerializer(page, many=True).data)


class AdminClaimDeliveryView(ClaimDeliveryView):
    """Claims a delivery for a florist, using the same guarded claim path."""
    permission_classes = [IsAdminUser]

    def post(self, request, account_id, event_id):
        try:
            florist = BusinessAccount.objects.get(pk=account_id, account_type='florist')
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Florist not found.'}, status=status.HTTP_404_NOT_FOUND)

        return self.claim_for_florist(florist, event_id, assigned_by_admin=True)
