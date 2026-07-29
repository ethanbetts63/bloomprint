from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated

from partners.models import BusinessAccount
from config.pagination import DashboardPagination
from partners.serializers.business_account_dashboard_serializer import CommissionSerializer


ORDERING_MAP = {
    'id': ('id',),
    'commission_type': ('commission_type',),
    'amount': ('amount',),
    'status': ('status',),
    'created_at': ('created_at',),
}


class CommissionListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommissionSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        try:
            account = BusinessAccount.objects.get(user=self.request.user)
        except BusinessAccount.DoesNotExist:
            raise NotFound('No florist or affiliate account was found.')

        params = self.request.query_params
        queryset = account.commissions.all()

        status_filter = params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])

        commission_type = params.get('commission_type', '').strip()
        if commission_type:
            queryset = queryset.filter(commission_type=commission_type)

        search = params.get('search', '').strip()
        if search:
            query = Q(note__icontains=search) | Q(commission_type__icontains=search)
            if search.isdigit():
                query |= Q(id=int(search))
            queryset = queryset.filter(query)

        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')
