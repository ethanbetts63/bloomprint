import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from partners.models import BusinessAccount

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeConnectStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response({"error": "Not a account."}, status=404)

        if not account.stripe_connect_account_id:
            return Response({
                'onboarding_complete': False,
                'has_account': False,
            })

        account = stripe.Account.retrieve(account.stripe_connect_account_id)
        is_complete = account.charges_enabled and account.payouts_enabled

        if is_complete and not account.stripe_connect_onboarding_complete:
            account.stripe_connect_onboarding_complete = True
            account.save()

        return Response({
            'onboarding_complete': account.stripe_connect_onboarding_complete,
            'has_account': True,
            'charges_enabled': account.charges_enabled,
            'payouts_enabled': account.payouts_enabled,
        })
