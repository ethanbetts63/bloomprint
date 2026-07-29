import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from partners.models import Commission, Payout, PayoutLineItem


class AdminApproveCommissionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            commission = Commission.objects.select_related(
                'business_account', 'event', 'event__order'
            ).get(pk=pk)
        except Commission.DoesNotExist:
            return Response({'detail': 'Commission not found.'}, status=status.HTTP_404_NOT_FOUND)

        if commission.status in ('processing', 'paid', 'denied'):
            return Response(
                {'detail': f'Commission cannot be approved (current status: {commission.status}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account = commission.business_account

        if not account.stripe_connect_onboarding_complete:
            return Response(
                {'detail': 'Business account has not completed Stripe onboarding.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payout_type = 'fulfillment' if commission.commission_type == 'fulfillment' else 'commission'

        currency = 'aud'
        if commission.event:
            raw = getattr(commission.event.order, 'currency', None)
            if raw:
                currency = raw.lower()

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            transfer = stripe.Transfer.create(
                amount=int(commission.amount * 100),
                currency=currency,
                destination=account.stripe_connect_account_id,
                transfer_group=f"commission_{commission.id}",
            )
        except stripe.error.StripeError as e:
            err = getattr(e, 'user_message', None) or str(e)
            return Response({'detail': err}, status=status.HTTP_400_BAD_REQUEST)

        payout = Payout.objects.create(
            business_account=account,
            payout_type=payout_type,
            amount=commission.amount,
            currency=currency.upper(),
            stripe_transfer_id=transfer.id,
            status='processing',
        )

        description = (
            f"Delivery payment for event {commission.event_id}"
            if commission.commission_type == 'fulfillment'
            else f"Commission for event {commission.event_id}"
        )
        PayoutLineItem.objects.create(
            payout=payout,
            commission=commission,
            amount=commission.amount,
            description=description,
        )

        commission.status = 'processing'
        commission.save()

        return Response({
            'status': 'processing',
            'stripe_transfer_id': transfer.id,
            'payout_id': payout.id,
        })
