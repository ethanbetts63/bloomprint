"""
Paying a commission out to a partner via Stripe Connect.

Extracted because two admin views did this identically — the approve action on
the payout detail page, and the legacy Pay Out button on the business account
page. Two copies of the code that moves real money is the last place a quiet
divergence should be possible, and they had already drifted apart in their
guard messages.
"""
import stripe
from django.conf import settings

from partners.models import Payout, PayoutLineItem

BLOCKED_STATUSES = ('processing', 'paid', 'denied')


class PayoutError(Exception):
    """Raised when a commission cannot be paid. The message is admin-facing."""


def pay_commission(commission):
    """
    Fires a Stripe Transfer for a commission and records the Payout.

    Nothing is persisted if the Transfer fails, so a failed payout leaves the
    commission exactly as it was and can simply be retried. Confirmation is the
    `transfer.created` webhook's job — this only moves the commission as far as
    'processing'.
    """
    if commission.status in BLOCKED_STATUSES:
        raise PayoutError(f'Commission cannot be paid (current status: {commission.status}).')

    account = commission.business_account
    if not account.stripe_connect_onboarding_complete:
        raise PayoutError('Business account has not completed Stripe onboarding.')

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
    except stripe.error.StripeError as exc:
        raise PayoutError(getattr(exc, 'user_message', None) or str(exc))

    payout = Payout.objects.create(
        business_account=account,
        payout_type=payout_type,
        amount=commission.amount,
        currency=currency.upper(),
        stripe_transfer_id=transfer.id,
        status='processing',
    )

    PayoutLineItem.objects.create(
        payout=payout,
        commission=commission,
        amount=commission.amount,
        description=(
            f"Delivery payment for event {commission.event_id}"
            if commission.commission_type == 'fulfillment'
            else f"Commission for event {commission.event_id}"
        ),
    )

    commission.status = 'processing'
    commission.save(update_fields=['status', 'updated_at'])

    return payout
