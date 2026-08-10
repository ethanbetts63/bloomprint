from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from partners.models import BusinessAccount, Commission
from partners.utils.payouts import PayoutError, pay_commission


class AdminPayCommissionView(APIView):
    """
    The Pay Out button on a business account's detail page.

    Same action as AdminApproveCommissionView, reached from the account rather
    than the commission, so the URL carries both ids. Both delegate to
    pay_commission so the two entry points cannot drift.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk, commission_id):
        try:
            account = BusinessAccount.objects.get(pk=pk)
        except BusinessAccount.DoesNotExist:
            return Response({'detail': 'Business account not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            commission = Commission.objects.select_related(
                'business_account', 'event', 'event__order'
            ).get(pk=commission_id, business_account=account)
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
