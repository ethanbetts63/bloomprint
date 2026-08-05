from decimal import Decimal

from django.conf import settings


def calculate_delivery_fee(budget: Decimal) -> Decimal:
    """
    Returns the delivery fee for a bouquet budget.

    At or above DELIVERY_INCLUDED_THRESHOLD the budget absorbs the delivery
    cost, so nothing is added. Below it the fee is charged on top, which leaves
    the budget intact for flowers.
    """
    if not budget:
        return Decimal('0.00')
    if budget >= Decimal(settings.DELIVERY_INCLUDED_THRESHOLD):
        return Decimal('0.00')
    return Decimal(settings.DELIVERY_FEE).quantize(Decimal('0.01'))


def calculate_florist_commission(budget: Decimal) -> Decimal:
    """
    Returns Bloom Print's commission on a bouquet budget.

    Commission is taken on the budget only. The delivery fee is passed to the
    florist untouched, so it is deliberately not part of this calculation.
    """
    if not budget:
        return Decimal('0.00')
    rate = Decimal(str(settings.FLORIST_COMMISSION_RATE))
    return (Decimal(budget) * rate).quantize(Decimal('0.01'))


def calculate_florist_payout(budget: Decimal) -> Decimal:
    """Returns what the florist has to spend on flowers, after commission."""
    if not budget:
        return Decimal('0.00')
    return (Decimal(budget) - calculate_florist_commission(budget)).quantize(Decimal('0.01'))
