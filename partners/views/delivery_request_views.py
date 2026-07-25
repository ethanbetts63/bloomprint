from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from partners.models import Partner, DeliveryRequest, Commission
from partners.utils.commission_utils import get_referral_commission_amount
from decimal import Decimal


class DeliveryRequestDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            dr = DeliveryRequest.objects.select_related(
                'event', 'event__order', 'partner'
            ).get(token=token)
        except DeliveryRequest.DoesNotExist:
            return Response({"error": "Delivery request not found."}, status=status.HTTP_404_NOT_FOUND)

        order = dr.event.order
        return Response({
            'id': dr.id,
            'status': dr.status,
            'delivery_date': dr.event.delivery_date,
            'message': dr.event.message,
            'recipient_name': getattr(order, 'recipient_name', ''),
            'recipient_suburb': getattr(order, 'suburb', ''),
            'recipient_city': getattr(order, 'city', ''),
            'recipient_state': getattr(order, 'state', ''),
            'recipient_postcode': getattr(order, 'postcode', ''),
            'recipient_country': getattr(order, 'country', ''),
            'delivery_notes': getattr(order, 'delivery_notes', ''),
            'budget': str(getattr(order, 'budget', 0)),
            'partner_name': dr.partner.business_name,
            'event_status': dr.event.status,
            'expires_at': dr.expires_at,
        })


class DeliveryRequestRespondView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            dr = DeliveryRequest.objects.select_related(
                'event', 'event__order', 'partner'
            ).get(token=token)
        except DeliveryRequest.DoesNotExist:
            return Response({"error": "Delivery request not found."}, status=status.HTTP_404_NOT_FOUND)

        if dr.status != 'pending':
            return Response(
                {"error": f"This request has already been {dr.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get('action')
        if action not in ('accept', 'decline'):
            return Response(
                {"error": "Action must be 'accept' or 'decline'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        dr.responded_at = timezone.now()

        if action == 'accept':
            dr.status = 'accepted'
            dr.save()
            return Response({"status": "accepted"})

        # Decline
        dr.status = 'declined'
        dr.save()

        # If the order was referred by this partner, create a commission
        order = dr.event.order
        if order.referred_by_partner_id == dr.partner_id:
            budget = getattr(order, 'budget', None)
            if budget:
                # Use snapshotted commission_amount from event if available, else calculate
                commission_amount = dr.event.commission_amount or get_referral_commission_amount(budget)
                Commission.objects.create(
                    partner=dr.partner,
                    event=dr.event,
                    commission_type='referral',
                    amount=commission_amount,
                    status='pending',
                    note='Commission for declined delivery of referred customer',
                )

        # Trigger reassignment
        from partners.utils.reassignment import reassign_delivery_request
        reassign_delivery_request(dr.event, excluded_partner_ids=[dr.partner_id])

        return Response({"status": "declined"})


class DeliveryRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
        except Partner.DoesNotExist:
            return Response({"error": "Not a partner."}, status=status.HTTP_404_NOT_FOUND)

        requests = DeliveryRequest.objects.filter(
            partner=partner
        ).select_related('event', 'event__order').order_by('-created_at')

        data = []
        for dr in requests:
            order = dr.event.order
            data.append({
                'id': dr.id,
                'token': dr.token,
                'status': dr.status,
                'delivery_date': dr.event.delivery_date,
                'recipient_name': getattr(order, 'recipient_name', ''),
                'budget': str(getattr(order, 'budget', 0)),
                'expires_at': dr.expires_at,
                'created_at': dr.created_at,
            })

        return Response(data)


class DeliveryRequestMarkDeliveredView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            dr = DeliveryRequest.objects.select_related('event').get(token=token)
        except DeliveryRequest.DoesNotExist:
            return Response({"error": "Delivery request not found."}, status=status.HTTP_404_NOT_FOUND)

        if dr.status != 'accepted':
            return Response(
                {"error": "Only accepted delivery requests can be marked as delivered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        dr.event.status = 'delivered'
        dr.event.save()

        return Response({"status": "delivered"})
