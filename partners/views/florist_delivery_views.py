"""
A florist's own claimed deliveries: the job sheet, and marking one delivered.

These replace the token-addressed views. Those were reachable by anyone holding
the URL, which meant an unauthenticated page exposing the recipient's name,
street address and card message — and, once marking delivered created a payable,
an unauthenticated way to create a financial record. Everything here is scoped
to the requesting florist's own claims.
"""
import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from partners.models import BusinessAccount, DeliveryRequest
from partners.utils.fulfillment import create_fulfillment_payable

logger = logging.getLogger(__name__)


def _active_florist(user):
    return BusinessAccount.objects.filter(
        user=user, account_type='florist', status='active'
    ).first()


def _own_claim_or_none(user, delivery_id):
    florist = _active_florist(user)
    if florist is None:
        return None, None
    claim = DeliveryRequest.objects.filter(
        pk=delivery_id, business_account=florist, status='accepted'
    ).select_related('event', 'event__order', 'business_account').first()
    return florist, claim


class FloristDeliveryDetailView(APIView):
    """The full job sheet for a delivery this florist claimed."""
    permission_classes = [IsAuthenticated]

    def get(self, request, delivery_id):
        florist, claim = _own_claim_or_none(request.user, delivery_id)
        if florist is None:
            return Response({'detail': 'No active florist account was found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if claim is None:
            return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

        event = claim.event
        order = event.order
        recipient_name = (
            f"{order.recipient_first_name or ''} {order.recipient_last_name or ''}".strip()
        )
        return Response({
            'id': claim.id,
            'reference': event.reference,
            'status': claim.status,
            'event_status': event.status,
            'delivery_date': event.delivery_date,
            'delivered_at': event.delivered_at,
            'message': event.message,
            'recipient_name': recipient_name,
            'recipient_street_address': order.recipient_street_address or '',
            'recipient_suburb': order.recipient_suburb or '',
            'recipient_city': order.recipient_city or '',
            'recipient_state': order.recipient_state or '',
            'recipient_postcode': order.recipient_postcode or '',
            'recipient_country': order.recipient_country or '',
            'delivery_notes': order.delivery_notes or '',
            'preferred_delivery_time': order.preferred_delivery_time or '',
            'occasion': order.get_occasion_display() if order.occasion else '',
            'flower_notes': order.flower_notes or '',
            # The buyer's name, so the florist can sign the card. Never their
            # contact details.
            'card_from': f"{order.customer_first_name or ''} {order.customer_last_name or ''}".strip(),
            'money': {key: str(value) for key, value in event.money_breakdown().items()},
        })


class FloristMarkDeliveredView(APIView):
    """
    Marks one of this florist's claimed deliveries as delivered.

    This is what creates the money owed to them, so it is idempotent and scoped
    to the caller's own claims — being an active florist is not enough.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, delivery_id):
        florist, claim = _own_claim_or_none(request.user, delivery_id)
        if florist is None:
            return Response({'detail': 'No active florist account was found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if claim is None:
            return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

        event = claim.event

        if event.status == 'delivered':
            return Response({'status': 'delivered', 'already': True})

        if event.status != 'claimed':
            return Response(
                {'detail': f"This delivery cannot be marked delivered (status: {event.status})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.status = 'delivered'
        event.delivered_at = timezone.now()
        event.save(update_fields=['status', 'delivered_at', 'updated_at'])

        create_fulfillment_payable(event)

        return Response({'status': 'delivered', 'already': False})
