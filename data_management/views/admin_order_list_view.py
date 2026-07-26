from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser

from events.models import Order
from data_management.serializers.admin_plan_serializer import AdminPlanSerializer


class AdminOrderPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


# Whitelist of client-facing sort keys -> real Order fields. Keeps `ordering`
# from exposing arbitrary columns and lets "customer_name" span two fields.
ORDERING_MAP = {
    'created_at': ('created_at',),
    'total': ('total_amount',),
    'status': ('status',),
    'customer_name': ('customer_last_name', 'customer_first_name'),
}


class AdminOrderListView(ListAPIView):
    """
    Paginated, filterable, sortable order list backing the admin Orders table.

    Query params:
      status     comma-separated statuses (e.g. "active,pending_payment")
      plan_type  billing_mode ("one_time" | "recurring")
      search     matches customer/recipient name or customer email
      ordering   one of ORDERING_MAP keys, optionally "-" prefixed (default -created_at)
      page       1-based page number
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminPlanSerializer
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        params = self.request.query_params
        qs = Order.objects.all()

        status_filter = params.get('status', '').strip()
        if status_filter:
            statuses = [s for s in (v.strip() for v in status_filter.split(',')) if s]
            if statuses:
                qs = qs.filter(status__in=statuses)

        plan_type = params.get('plan_type', '').strip()
        if plan_type:
            qs = qs.filter(billing_mode=plan_type)

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(customer_first_name__icontains=search)
                | Q(customer_last_name__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(recipient_first_name__icontains=search)
                | Q(recipient_last_name__icontains=search)
            )

        ordering = params.get('ordering', '').strip() or '-created_at'
        desc = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if desc:
            fields = tuple('-' + f for f in fields)
        # '-id' is a stable tiebreaker so pagination never skips/repeats rows.
        return qs.order_by(*fields, '-id')
