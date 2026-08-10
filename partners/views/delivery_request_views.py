from rest_framework.permissions import IsAuthenticated
from partners.models import DeliveryRequest
from partners.utils.matching import active_florist_for
from django.db.models import Q
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView

from config.pagination import DashboardPagination
from partners.serializers.delivery_request_list_serializer import DeliveryRequestListSerializer


DELIVERY_ORDERING_MAP = {
    'recipient': ('event__order__recipient_last_name', 'event__order__recipient_first_name'),
    'delivery_date': ('event__delivery_date',),
    'budget': ('event__florist_budget',),
    'status': ('status',),
    'created_at': ('created_at',),
}


class DeliveryRequestListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeliveryRequestListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        florist = active_florist_for(self.request.user)
        if florist is None:
            raise NotFound('No active florist account was found.')

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
