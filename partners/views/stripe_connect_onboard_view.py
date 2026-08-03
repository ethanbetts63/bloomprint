import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from partners.models import BusinessAccount

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeConnectOnboardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response({"error": "Not a account."}, status=status.HTTP_404_NOT_FOUND)

        if not account.stripe_connect_account_id:
            account_kwargs = {
                'type': 'express',
                'email': request.user.email,
                'country': account.country or None,
                'metadata': {'business_account_id': account.id},
            }

            if account.account_type == 'affiliate':
                account_kwargs['business_profile'] = {
                    'url': settings.SITE_URL,
                    'product_description': (
                        'Referral affiliate earning commissions for referring customers to '
                        'Bloom Print, an online flower subscription and delivery service.'
                    ),
                    'mcc': '7311',
                }

            account = stripe.Account.create(**account_kwargs)
            account.stripe_connect_account_id = account.id
            account.save()

        account_link = stripe.AccountLink.create(
            account=account.stripe_connect_account_id,
            return_url=f"{settings.SITE_URL}/stripe-connect/return",
            refresh_url=f"{settings.SITE_URL}/stripe-connect/onboarding",
            type="account_onboarding",
        )

        return Response({'url': account_link.url})
