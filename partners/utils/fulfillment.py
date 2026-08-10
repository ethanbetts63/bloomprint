"""
Turning a delivered event into money owed to the florist who delivered it.

One function, called from both places a delivery can be marked delivered — the
florist's own dashboard and the admin override. Previously only the admin path
created a payable, so a florist marking their own delivery complete (the normal
route) produced nothing to pay.
"""
import logging

from partners.models import Commission, DeliveryRequest

logger = logging.getLogger(__name__)


def create_fulfillment_payable(event):
    """
    Records what the florist is owed for delivering this event.

    The amount is the florist's total from the event's frozen snapshot — the
    flower budget after Bloom Print's commission, plus the delivery fee in full
    where one was charged. It is emphatically not the customer's budget, which
    is what this used to pay: that handed away the whole commission on orders
    above the delivery threshold, and underpaid the florist by the delivery fee
    below it.

    Idempotent, because two people can mark the same delivery delivered.
    Returns the Commission, or None if there is nothing to pay.
    """
    claim = DeliveryRequest.objects.filter(event=event, status='accepted').first()
    if claim is None:
        logger.warning(
            "Event %s marked delivered with no claim — nobody to pay.", event.pk
        )
        return None

    existing = Commission.objects.filter(event=event, commission_type='fulfillment').first()
    if existing is not None:
        return existing

    amount = event.money_breakdown()['florist_total']
    if not amount:
        logger.warning("Event %s has no florist total; no payable created.", event.pk)
        return None

    return Commission.objects.create(
        business_account=claim.business_account,
        event=event,
        commission_type='fulfillment',
        amount=amount,
        status='pending',
        note=f'Delivery payment for {event.reference}',
    )
