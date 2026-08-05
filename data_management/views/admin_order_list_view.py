from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from events.models import Order
from data_management.serializers.admin_order_serializer import AdminOrderSerializer
from config.pagination import DashboardPagination


# Whitelist of client-facing sort keys -> real Order fields. Keeps `ordering`
# from exposing arbitrary columns and lets "customer_name" span two fields.
ORDERING_MAP = {
    'created_at': ('created_at',),
    'total': ('total_amount',),
    'budget': ('budget',),
    'status': ('status',),
    'order_type': ('billing_mode',),
    'customer_name': ('customer_last_name', 'customer_first_name'),
    'recipient': ('recipient_last_name', 'recipient_first_name'),
}


class AdminOrderListView(ListAPIView):
    """
    Paginated, filterable, sortable order list backing the admin Orders table.

    An order is the commercial record — who paid, how much, where it goes. The
    deliveries it schedules are Events, listed separately at admin/events/.

    Query params:
      status      comma-separated statuses (e.g. "active,pending_payment")
      order_type  billing_mode ("one_time" | "recurring")
      search      matches customer/recipient name or customer email
      ordering    one of ORDERING_MAP keys, optionally "-" prefixed (default -created_at)
      page        1-based page number
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        qs = Order.objects.all()

        status_filter = params.get('status', '').strip()
        if status_filter:
            statuses = [s for s in (v.strip() for v in status_filter.split(',')) if s]
            if statuses:
                qs = qs.filter(status__in=statuses)

        order_type = params.get('order_type', '').strip()
        if order_type:
            qs = qs.filter(billing_mode=order_type)

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
