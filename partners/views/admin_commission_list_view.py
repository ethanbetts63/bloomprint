from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from config.pagination import DashboardPagination
from partners.models import Commission
from partners.serializers.admin_commission_list_serializer import AdminCommissionListSerializer

ORDERING_MAP = {
    'account': ('business_account__business_name',), 'type': ('commission_type',),
    'amount': ('amount',), 'status': ('status',), 'created_at': ('created_at',),
}


class AdminCommissionListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCommissionListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        queryset = Commission.objects.select_related('business_account', 'business_account__user')
        status_filter = params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])
        commission_type = params.get('commission_type', '').strip()
        if commission_type:
            queryset = queryset.filter(commission_type=commission_type)
        search = params.get('search', '').strip()
        if search:
            query = Q(business_account__business_name__icontains=search) | Q(note__icontains=search)
            if search.isdigit():
                query |= Q(id=int(search)) | Q(event_id=int(search))
            queryset = queryset.filter(query)
        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')
