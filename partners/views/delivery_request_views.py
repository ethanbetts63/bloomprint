from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from decimal import Decimal
from partners.models import BusinessAccount, DeliveryRequest
from django.db.models import Q
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView

from config.pagination import DashboardPagination
from partners.serializers.delivery_request_list_serializer import DeliveryRequestListSerializer


class DeliveryRequestDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            dr = DeliveryRequest.objects.select_related(
                'event', 'event__order', 'business_account'
            ).get(token=token)
        except DeliveryRequest.DoesNotExist:
            return Response({"error": "Delivery request not found."}, status=status.HTTP_404_NOT_FOUND)

        event = dr.event
        order = event.order
        # These previously read order.recipient_name / order.suburb / order.city,
        # none of which exist on Order, so every one of them silently returned ''
        # and the florist saw a blank recipient and a blank address.
        recipient_name = (
            f"{order.recipient_first_name or ''} {order.recipient_last_name or ''}".strip()
        )
        return Response({
            'id': dr.id,
            'reference': event.reference,
            'status': dr.status,
            'delivery_date': event.delivery_date,
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
            # The brief — a florist cannot judge whether to accept without it.
            'occasion': order.get_occasion_display() if order.occasion else '',
            'flower_notes': order.flower_notes or '',
            # The florist's money, never the customer's budget.
            'florist_budget': str(event.florist_budget or Decimal('0.00')),
            'delivery_fee': str(event.delivery_fee or Decimal('0.00')),
            'florist_total': str(event.florist_total),
            'business_account_name': dr.business_account.business_name,
            'event_status': event.status,
            'expires_at': dr.expires_at,
        })


DELIVERY_ORDERING_MAP = {
    'recipient': ('event__order__recipient_last_name', 'event__order__recipient_first_name'),
    'delivery_date': ('event__delivery_date',),
    'budget': ('event__florist_budget',),
    'status': ('status',),
    'expires_at': ('expires_at',),
    'created_at': ('created_at',),
}


class DeliveryRequestListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeliveryRequestListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        try:
            florist = BusinessAccount.objects.get(user=self.request.user, account_type='florist')
        except BusinessAccount.DoesNotExist:
            raise NotFound('No florist account was found.')

        params = self.request.query_params
        queryset = DeliveryRequest.objects.filter(business_account=florist).select_related('event', 'event__order')

        status_filter = params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])

        search = params.get('search', '').strip()
        if search:
            query = (
                Q(event__order__recipient_first_name__icontains=search)
                | Q(event__order__recipient_last_name__icontains=search)
                # Florists quote the reference, not the internal id.
                | Q(event__reference__icontains=search)
            )
            queryset = queryset.filter(query)

        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = DELIVERY_ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')


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
