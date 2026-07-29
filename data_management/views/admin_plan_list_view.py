from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from config.pagination import DashboardPagination
from events.models import Order
from data_management.serializers.admin_plan_serializer import AdminPlanSerializer


ORDERING_MAP = {
    'created_at': ('created_at',), 'customer_name': ('customer_last_name', 'customer_first_name'),
    'recipient': ('recipient_last_name', 'recipient_first_name'), 'type': ('billing_mode',),
    'budget': ('budget',), 'total': ('total_amount',), 'status': ('status',),
}


class AdminPlanListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminPlanSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        queryset = Order.objects.all()
        status_filter = params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])
        plan_type = params.get('plan_type', '').strip()
        if plan_type:
            queryset = queryset.filter(billing_mode=plan_type)
        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(customer_first_name__icontains=search) | Q(customer_last_name__icontains=search)
                | Q(customer_email__icontains=search) | Q(recipient_first_name__icontains=search)
                | Q(recipient_last_name__icontains=search)
            )
        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')
