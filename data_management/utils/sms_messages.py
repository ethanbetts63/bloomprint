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
            f"New Bloom Print order: {order.recipient_first_name} {order.recipient_last_name}, "
            f"delivery {order.start_date}, ${order.budget}. "
            f"Payment ID: {payment_id}"
        )
    return f"New Bloom Print payment received. Payment ID: {payment_id}"


def admin_event_reminder(event):
    """Sent to admin at T-7 and T-3 days before a delivery. Action needed: order the flowers."""
    order = event.order
    return (
        f"Action needed: order flowers for {order.recipient_first_name} {order.recipient_last_name} "
        f"— delivery {event.delivery_date}, ${order.budget}."
    )


def admin_delivery_day(event):
    """Sent to admin on delivery day once the event has been marked as ordered."""
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
    return f"Bloom Print plan cancelled. Events needing florist contact:\n{ordered_event_descriptions}"
