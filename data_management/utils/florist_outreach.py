"""
Hand-written outreach to a florist who is not on the platform yet.

Admin opens a delivery, hits Compose, drops in an address they found, edits the
draft if they want, and sends. The request-variant brief goes with it as a PDF.

Deliberately separate from `notify_florists_of_new_delivery`, which fans out
automatically to florists who have already signed up and can claim from their
dashboard. This is a pitch to a stranger: they cannot claim anything yet, so the
call to action is to sign up or reply.
"""
import logging
from datetime import date

from django.conf import settings

from data_management.models import Notification

logger = logging.getLogger(__name__)


def _area(order):
    return ', '.join(part for part in [order.recipient_suburb, order.recipient_state] if part)


def build_outreach_draft(event):
    """
    The prefilled subject and body. Editable by admin before sending.

    Carries no recipient PII — the reader is a stranger who has not taken the
    job, so this says the same as the request brief attached to it: area, date,
    occasion, preferences, and what they would be paid.
    """
    order = event.order
    area = _area(order)
    money = event.money_breakdown()

    subject = f"Flower delivery in {area or 'your area'} on {event.delivery_date} — ${money['florist_total']}"

    occasion = order.get_occasion_display() if order.occasion else None
    brief_line = (
        f"It's for a {occasion.lower()}." if occasion else ""
    )
    preferences = (
        f"\nThe customer gave the following preferences: {order.flower_notes}\n" if order.flower_notes else ''
    )

    body = (
        "Hi there,\n\n"
        f"We have a custom flower delivery order in {area or 'your area'} on {event.delivery_date} "
        f"and we're looking for a local florist to make it.\n\n"
        f"You would be paid ${money['florist_total']} for it. "
        f"{brief_line}\n"
        f"{preferences}"
        "\nThe rest is up to you. There's no set recipe, no stem count and no vase "
        "requirement — you design it from whatever is good on the day. You deliver "
        "under your own name and branding, with your own card. The customer never "
        "sees ours.\n\n"
        "More details are in the attached brief. Full ad\n\n"
        f"If you'd like to take it, you can sign up at {settings.FLORIST_SIGNUP_URL} "
        "and claim it from your dashboard. Or just reply to this email with any "
        "questions and we'll answer them. There's no fee's or catches. All the "
        "information is on the florist page. We just need someone to delivery "
        "in your area and I liked the look of your site.\n\n"
        "\n\n If you sign up, I'll just send you order offers in your area automatically."
        "Regularly, we pay out of stripe but sometimes for first time florists we can pay,"
        " via a method that suits you if you'd prefer."


        "Kind regards,\n"
        "Ethan Betts\n"
        "Bloomprint\n"
    )

    return {
        'subject': subject,
        'body': body,
        'reference': event.reference,
        'area': area,
        'delivery_date': event.delivery_date,
        'florist_total': str(money['florist_total']),
        # Surfaced so the compose page can warn: an ungeocoded delivery is
        # invisible to the board, so a florist who signs up still won't see it.
        'is_geocoded': order.latitude is not None and order.longitude is not None,
    }


def send_florist_outreach(event, *, to, subject, body):
    """
    Sends the outreach and records exactly what went out.

    Returns the Notification. Its status is 'sent' or 'failed' — send_notification
    swallows transport errors so a failed send is recorded rather than raised.
    """
    from data_management.utils.notification_factory import _brief_attachment
    from data_management.utils.send_notification import send_notification

    notification = Notification.objects.create(
        recipient_type='florist_prospect',
        recipient_email=to,
        channel='email',
        subject=subject,
        body=body,
        scheduled_for=date.today(),
        related_event=event,
    )

    # The request variant: the reader has not committed to this delivery, so it
    # carries no recipient name, address, or card message.
    send_notification(notification, attachments=_brief_attachment(event, 'request'))
    notification.refresh_from_db()
    return notification
