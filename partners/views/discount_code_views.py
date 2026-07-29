from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.exceptions import NotFound, PermissionDenied
from django.db.models import Count

from partners.models import BusinessAccount, DiscountCode
from config.pagination import DashboardPagination
from partners.serializers.business_account_dashboard_serializer import DiscountCodeSerializer


class AffiliateDiscountCodeListCreateView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DiscountCodeSerializer
    pagination_class = DashboardPagination

    def get_account(self):
        try:
            account = BusinessAccount.objects.get(user=self.request.user)
        except BusinessAccount.DoesNotExist:
            raise NotFound('No affiliate account was found.')
        if account.account_type != 'affiliate':
            raise PermissionDenied('Discount codes are only available to affiliates.')
        return account

    def get_queryset(self):
        account = self.get_account()
        params = self.request.query_params
        queryset = account.discount_codes.annotate(usage_count=Count('usages'))
        status_filter = params.get('status', '').strip()
        if status_filter in ('active', 'inactive'):
            queryset = queryset.filter(is_active=status_filter == 'active')
        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(code__icontains=search)
        ordering = params.get('ordering', '').strip() or '-created_at'
        ordering_map = {
            'code': 'code', 'discount_amount': 'discount_amount', 'total_uses': 'usage_count',
            'status': 'is_active', 'created_at': 'created_at',
        }
        field = ordering_map.get(ordering.lstrip('-'), 'created_at')
        return queryset.order_by(f'-{field}' if ordering.startswith('-') else field, '-id')

    def post(self, request):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response({'error': 'No affiliate account was found.'}, status=status.HTTP_404_NOT_FOUND)

        if account.account_type != 'affiliate':
            return Response(
                {'error': 'Discount codes are only available to affiliates.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        name = request.data.get('name', '').strip() or account.business_name
        code = DiscountCode.generate_code(name)
        dc = DiscountCode.objects.create(business_account=account, code=code, discount_amount=5)

        return Response({
            'id': dc.id,
            'code': dc.code,
            'discount_amount': str(dc.discount_amount),
            'is_active': dc.is_active,
            'total_uses': 0,
            'created_at': dc.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
