from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from config.pagination import DashboardPagination
from data_management.serializers.admin_user_serializer import AdminUserSerializer

User = get_user_model()

ORDERING_MAP = {
    'name': ('last_name', 'first_name'), 'email': ('email',),
    'joined': ('date_joined',),
}


class AdminUserListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        queryset = User.objects.select_related('referred_by_affiliate__user', 'business_account')
        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(email__icontains=search))
        role = params.get('role', '').strip()
        if role == 'admin':
            queryset = queryset.filter(Q(is_staff=True) | Q(is_superuser=True))
        elif role == 'staff':
            queryset = queryset.filter(is_staff=True, is_superuser=False)
        elif role == 'florist':
            queryset = queryset.filter(is_staff=False, is_superuser=False, business_account__account_type='florist')
        elif role == 'affiliate':
            queryset = queryset.filter(is_staff=False, is_superuser=False, business_account__account_type='affiliate')
        elif role == 'inactive':
            queryset = queryset.filter(is_active=False)
        ordering = params.get('ordering', '').strip() or '-joined'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('date_joined',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')
