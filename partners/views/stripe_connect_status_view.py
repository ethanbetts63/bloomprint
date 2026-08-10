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

        # Same shadowing trap as the onboard view: the Stripe resource must not
        # be bound to `account`, or the reads below hit the Stripe object (which
        # raises AttributeError for our own fields) instead of the model.
        stripe_account = stripe.Account.retrieve(account.stripe_connect_account_id)
        charges_enabled = bool(stripe_account.charges_enabled)
        payouts_enabled = bool(stripe_account.payouts_enabled)

        if charges_enabled and payouts_enabled and not account.stripe_connect_onboarding_complete:
            account.stripe_connect_onboarding_complete = True
            account.save(update_fields=['stripe_connect_onboarding_complete', 'updated_at'])

        return Response({
            'onboarding_complete': account.stripe_connect_onboarding_complete,
            'has_account': True,
            'charges_enabled': charges_enabled,
            'payouts_enabled': payouts_enabled,
        })
