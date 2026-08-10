"""
Central definitions for all SMS message copy.

Each function returns a plain string suitable for sending via Twilio.
SMS messages are intentionally concise (targeting single-segment length where possible).
Edit this file to update the wording of any outgoing text message.
"""


def admin_payment_received(order, payment_id):
    """Sent to admin immediately after a successful payment."""
    if order:
        return (
            f"New Bloomprint order: {order.recipient_first_name} {order.recipient_last_name}, "
            f"delivery {order.start_date}, ${order.budget}. "
            f"Payment ID: {payment_id}"
        )
    return f"New Bloomprint payment received. Payment ID: {payment_id}"


def admin_event_reminder(event):
    """
    Sent to admin at T-7 and T-3 when a delivery is still unclaimed.

    Cancelled the moment a florist claims it, so receiving one means nobody has
    taken the job and it needs a hand.
    """
    order = event.order
    return (
        f"Unclaimed: no florist has taken the delivery for "
        f"{order.recipient_first_name} {order.recipient_last_name} "
        f"— {event.delivery_date}, {order.recipient_suburb}."
    )


def admin_delivery_day(event):
    """Sent to admin on delivery day, once a florist has claimed the delivery."""
    order = event.order
    return (
        f"Delivery day: {order.recipient_first_name} {order.recipient_last_name} "
        f"at {order.recipient_street_address}, {order.recipient_suburb}. "
        f"Confirm once delivered."
    )


def admin_cancellation(ordered_event_descriptions):
    """
    Sent to admin when a customer cancels a plan that has already-ordered events.
    ordered_event_descriptions: a string listing the affected events (pre-formatted by caller).
    """
    return f"Bloomprint plan cancelled. Events needing florist contact:\n{ordered_event_descriptions}"
