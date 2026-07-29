from decimal import Decimal
from payments.models import Payment
from partners.models import Commission


REFERRAL_COMMISSION_TIERS = [
    (Decimal('100'), Decimal('5')),
    (Decimal('150'), Decimal('10')),
    (Decimal('200'), Decimal('15')),
    (Decimal('250'), Decimal('20')),
]
REFERRAL_COMMISSION_MAX = Decimal('25')


def get_referral_commission_amount(budget):
    """Return the fixed commission amount for a given bouquet budget."""
    for threshold, amount in REFERRAL_COMMISSION_TIERS:
        if budget < threshold:
            return amount
    return REFERRAL_COMMISSION_MAX


def process_referral_commission(payment):
    order = payment.order
    account = order.referred_by_affiliate
    if not account:
        return

    if account.account_type != 'affiliate':
        return

    # Referral commission is limited to a customer's first few orders. With no
    # customer User, "same customer" is identified by the order's email.
    customer_email = order.customer_email
    succeeded_count = Payment.objects.filter(
        order__customer_email__iexact=customer_email, status='succeeded'
    ).count() if customer_email else 1
    if succeeded_count > 3:
        return

    budget = getattr(order, 'budget', None)
    if not budget:
        return

    commission_amount = get_referral_commission_amount(budget)

    Commission.objects.create(
        business_account=account,
        payment=payment,
        commission_type='referral',
        amount=commission_amount,
        status='pending',
    )
