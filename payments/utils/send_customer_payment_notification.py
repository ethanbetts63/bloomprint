import logging
import requests
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _format_address_lines(order):
    """
    Builds the recipient's delivery address as a list of non-empty display
    lines, so the template/text body can render only what's actually set.
    """
    lines = []
    if order.recipient_street_address:
        lines.append(order.recipient_street_address)

    locality = ", ".join(filter(None, [order.recipient_suburb, order.recipient_city]))
    region = " ".join(filter(None, [order.recipient_state, order.recipient_postcode]))
    locality_line = ", ".join(filter(None, [locality, region]))
    if locality_line:
        lines.append(locality_line)

    if order.recipient_country:
        lines.append(order.recipient_country)

    return lines


def send_customer_payment_notification(order):
    """
    Sends an immediate payment confirmation email to the customer after a successful payment.
    Includes every order detail the customer entered at checkout, so they can
    catch and report any mistakes before the first delivery.
    """
    if not order.customer_email:
        logger.warning("No email on order %s — skipping customer payment notification.", order.pk)
        return

    first_name = order.customer_first_name or 'there'
    recipient_name = f"{order.recipient_first_name} {order.recipient_last_name}".strip()
    address_lines = _format_address_lines(order)

    billing_label = "One-time delivery"
    if order.billing_mode == 'recurring':
        billing_label = f"Recurring — {order.get_frequency_display()}" if order.frequency else "Recurring"

    context = {
        'first_name': first_name,
        'recipient_name': recipient_name,
        'order': order,
        'address_lines': address_lines,
        'occasion_display': order.get_occasion_display() if order.occasion else '',
        'billing_label': billing_label,
    }
    html_body = render_to_string('notifications/emails/customer_payment_confirmation.html', context)

    text_lines = [
        f"Hi {first_name},",
        "",
        "Your FutureFlower order has been confirmed!",
        "",
        f"Recipient: {recipient_name}",
    ]
    if address_lines:
        text_lines.append("Delivery address: " + ", ".join(address_lines))
    text_lines.append(f"First delivery: {order.start_date}")
    if order.preferred_delivery_time:
        text_lines.append(f"Preferred delivery time: {order.preferred_delivery_time}")
    if order.occasion:
        text_lines.append(f"Occasion: {order.get_occasion_display()}")
    text_lines.append(f"Plan: {billing_label}")
    if order.billing_mode == 'one_time' and order.card_message:
        text_lines.append(f"Card message: {order.card_message}")
    if order.flower_notes:
        text_lines.append(f"Flower preferences: {order.flower_notes}")
    if order.delivery_notes:
        text_lines.append(f"Delivery notes: {order.delivery_notes}")
    text_lines.extend([
        "",
        f"Budget per bouquet: ${order.budget}",
        f"Delivery fee: ${order.delivery_fee}",
    ])
    if order.discount_amount:
        text_lines.append(f"Discount: -${order.discount_amount}")
    text_lines.append(f"Total: ${order.total_amount}")
    text_lines.extend([
        "",
        "If anything above looks wrong, reply to this email and we'll fix it before your first delivery.",
        "",
        "Thank you for choosing FutureFlower!",
    ])
    text_body = "\n".join(text_lines)

    try:
        response = requests.post(
            f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
            auth=("api", settings.MAILGUN_API_KEY),
            data={
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [order.customer_email],
                "subject": "Your FutureFlower order is confirmed",
                "text": text_body,
                "html": html_body,
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception as e:
        logger.error("Failed to send customer payment notification for order %s: %s", order.pk, e)
