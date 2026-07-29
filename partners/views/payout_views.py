from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from partners.models import BusinessAccount, Payout, PayoutLineItem
from config.pagination import DashboardPagination
from partners.serializers.payout_list_serializer import PayoutListSerializer


PAYOUT_ORDERING_MAP = {
    'id': ('id',),
    'payout_type': ('payout_type',),
    'amount': ('amount',),
    'status': ('status',),
    'created_at': ('created_at',),
}


class PayoutListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PayoutListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        try:
            account = BusinessAccount.objects.get(user=self.request.user)
        except BusinessAccount.DoesNotExist:
            raise NotFound('No florist or affiliate account was found.')

        params = self.request.query_params
        queryset = Payout.objects.filter(business_account=account)

        status_filter = params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status__in=[value.strip() for value in status_filter.split(',') if value.strip()])

        payout_type = params.get('payout_type', '').strip()
        if payout_type:
            queryset = queryset.filter(payout_type=payout_type)

        search = params.get('search', '').strip()
        if search:
            query = Q(currency__icontains=search) | Q(note__icontains=search)
            if search.isdigit():
                query |= Q(id=int(search))
            queryset = queryset.filter(query)

        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = PAYOUT_ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')


class PayoutDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payout_id):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response({"error": "No florist or affiliate account was found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            payout = Payout.objects.get(id=payout_id, business_account=account)
        except Payout.DoesNotExist:
            return Response({"error": "Payout not found."}, status=status.HTTP_404_NOT_FOUND)

        line_items = PayoutLineItem.objects.filter(payout=payout)

        return Response({
            'id': payout.id,
            'payout_type': payout.payout_type,
            'amount': str(payout.amount),
            'currency': payout.currency,
            'status': payout.status,
            'stripe_transfer_id': payout.stripe_transfer_id,
            'period_start': payout.period_start,
            'period_end': payout.period_end,
            'note': payout.note,
            'created_at': payout.created_at,
            'line_items': [{
                'id': li.id,
                'amount': str(li.amount),
                'description': li.description,
                'created_at': li.created_at,
            } for li in line_items],
        })
