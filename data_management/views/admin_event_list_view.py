from datetime import date, timedelta

from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from config.pagination import DashboardPagination
from events.models import Event
from data_management.serializers.admin_event_list_serializer import AdminEventListSerializer


# Client-facing sort keys -> real fields. Whitelisted so `ordering` can never
# reach an arbitrary column, and so "recipient" can span two name fields.
ORDERING_MAP = {
    'delivery_date': ('delivery_date',),
    'status': ('status',),
    'budget': ('order__budget',),
    'recipient': ('order__recipient_last_name', 'order__recipient_first_name'),
    'customer_name': ('order__customer_last_name', 'order__customer_first_name'),
    'created_at': ('created_at',),
}


def window_filter(window, today):
    """
    Translate a delivery-date window key into a queryset filter. Returns None
    for an unrecognised key so the caller can leave the queryset untouched.
    """
    windows = {
        'overdue': Q(delivery_date__lt=today),
        'today': Q(delivery_date=today),
        'next_7': Q(delivery_date__gte=today, delivery_date__lte=today + timedelta(days=7)),
        'next_14': Q(delivery_date__gte=today, delivery_date__lte=today + timedelta(days=14)),
        'next_30': Q(delivery_date__gte=today, delivery_date__lte=today + timedelta(days=30)),
        'past': Q(delivery_date__lte=today),
    }
    return windows.get(window)


class AdminEventListView(ListAPIView):
    """
    Paginated, filterable, sortable delivery-event list backing the admin
    Events table. Events are the unit of admin work — every action (place
    order, confirm delivery) happens on one — so this is the primary table.

    Query params:
      status    comma-separated statuses (e.g. "scheduled,ordered")
      window    delivery-date window: overdue|today|next_7|next_14|next_30|past
      search    matches recipient/customer name, customer email, or order id
      ordering  one of ORDERING_MAP keys, optionally "-" prefixed (default delivery_date)
      page      1-based page number
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminEventListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        queryset = Event.objects.select_related('order')

        status_filter = params.get('status', '').strip()
        if status_filter:
            statuses = [s for s in (v.strip() for v in status_filter.split(',')) if s]
            if statuses:
                queryset = queryset.filter(status__in=statuses)

        window = window_filter(params.get('window', '').strip(), date.today())
        if window is not None:
            queryset = queryset.filter(window)

        search = params.get('search', '').strip()
        if search:
            matches = (
                Q(order__recipient_first_name__icontains=search)
                | Q(order__recipient_last_name__icontains=search)
                | Q(order__customer_first_name__icontains=search)
                | Q(order__customer_last_name__icontains=search)
                | Q(order__customer_email__icontains=search)
            )
            # A bare number is almost always someone pasting an order id.
            if search.isdigit():
                matches |= Q(order_id=int(search))
            queryset = queryset.filter(matches)

        ordering = params.get('ordering', '').strip() or 'delivery_date'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('delivery_date',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        # 'id' is a stable tiebreaker so pagination never skips or repeats rows.
        return queryset.order_by(*fields, 'id')
