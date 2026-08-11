from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.generics import ListAPIView
from django.db.models import Q
from config.pagination import DashboardPagination
from partners.models import BusinessAccount
from partners.serializers.admin_business_account_serializer import AdminBusinessAccountSerializer
from partners.serializers.admin_business_account_detail_serializer import (
    AdminBusinessAccountDetailSerializer,
    AdminBusinessAccountUpdateSerializer,
)


ACCOUNT_ORDERING_MAP = {
    'business': ('business_name',), 'contact': ('user__last_name', 'user__first_name'),
    'type': ('account_type',), 'status': ('status',), 'created_at': ('created_at',),
}


class AdminBusinessAccountListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminBusinessAccountSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        qs = BusinessAccount.objects.select_related('user')
        status_filter = params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])
        account_type = params.get('account_type', '').strip()
        if account_type:
            qs = qs.filter(account_type=account_type)
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(business_name__icontains=search) | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search) | Q(user__email__icontains=search)
                | Q(phone__icontains=search)
            )
        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = ACCOUNT_ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return qs.order_by(*fields, '-id')


class AdminBusinessAccountDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            account = (
                BusinessAccount.objects
                .select_related('user')
                .prefetch_related('commissions')
                .get(pk=pk)
            )
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminBusinessAccountDetailSerializer(account).data)

    def patch(self, request, pk):
        try:
            account = BusinessAccount.objects.select_related('user').get(pk=pk)
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminBusinessAccountUpdateSerializer(account, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        account = serializer.save()
        account = (
            BusinessAccount.objects
            .select_related('user')
            .prefetch_related('commissions')
            .get(pk=account.pk)
        )
        return Response(AdminBusinessAccountDetailSerializer(account).data)


class AdminApproveBusinessAccountView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            account = BusinessAccount.objects.select_related('user').get(pk=pk)
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        account.status = 'active'
        account.save()
        return Response(AdminBusinessAccountSerializer(account).data)


class AdminDenyBusinessAccountView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            account = BusinessAccount.objects.select_related('user').get(pk=pk)
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        account.status = 'denied'
        account.save()
        return Response(AdminBusinessAccountSerializer(account).data)
