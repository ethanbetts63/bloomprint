from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from partners.models import Commission
from partners.utils.payouts import PayoutError, pay_commission


class AdminApproveCommissionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            commission = Commission.objects.select_related(
                'business_account', 'event', 'event__order'
            ).get(pk=pk)
        except Commission.DoesNotExist:
            return Response({'detail': 'Commission not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            payout = pay_commission(commission)
        except PayoutError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'status': 'processing',
            'stripe_transfer_id': payout.stripe_transfer_id,
            'payout_id': payout.id,
        })
