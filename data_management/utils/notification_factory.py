import logging
from datetime import date, timedelta
from django.conf import settings
from data_management.models import Notification
from data_management.utils import sms_messages

logger = logging.getLogger(__name__)


def _build_event_body(event):
    order = event.order
    return (
        f"Upcoming Bloom Print delivery requires ordering.\n\n"
        f"Recipient: {order.recipient_first_name} {order.recipient_last_name}\n"
        f"Address: {order.recipient_street_address}, {order.recipient_suburb}, "
        f"{order.recipient_city}, {order.recipient_state} {order.recipient_postcode}, "
        f"{order.recipient_country}\n"
        f"Delivery Date: {event.delivery_date}\n"
        f"Budget: ${order.budget}\n"
        f"Brief: {order.flower_notes or 'Not specified'}\n"
    )


def create_admin_event_notifications(event):
    """
    Creates 4 pending admin notifications for a newly created event:
    - email at delivery_date - 7 days
    - sms at delivery_date - 7 days
    - email at delivery_date - 3 days
    - sms at delivery_date - 3 days

    Skips creating a notification if the scheduled_for date is in the past.
    """
    today = date.today()
    body = _build_event_body(event)

    schedule_offsets = [7, 3]
    channels = ['email', 'sms']

    email_body = body
    sms_body = sms_messages.admin_event_reminder(event)

    notifications_to_create = []
    for days_before in schedule_offsets:
        scheduled_for = event.delivery_date - timedelta(days=days_before)
        if scheduled_for < today:
            continue
        for channel in channels:
            notifications_to_create.append(
                Notification(
                    recipient_type='admin',
                    channel=channel,
                    subject=f"Action Required: Order flowers for delivery on {event.delivery_date}",
                    body=email_body if channel == 'email' else sms_body,
                    scheduled_for=scheduled_for,
                    related_event=event,
                )
            )

    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)


def notify_florists_of_new_delivery(event):
    """
    Announces a newly paid-for delivery to every florist who can claim it.

    Rows are created first and sent immediately afterwards, rather than left for
    the send_notifications cron: the whole point of the claim board is that the
    fastest florist wins, and a queue that drains once a day would decide that
    race by cron schedule. Sends that fail stay 'pending' so the cron still
    picks them up — a Mailgun outage delays the announcement instead of losing
    it. The board itself is live the moment the event exists, independent of
    any of this.

    Returns the notifications created, for the caller to log or assert on.
    """
    from data_management.utils.send_notification import send_notification
    from partners.utils.matching import eligible_florists_for_event

    florists = eligible_florists_for_event(event)
    if not florists:
        return []

    order = event.order
    where = ', '.join(part for part in [order.recipient_suburb, order.recipient_state] if part)
    subject = f"New delivery available in {where or 'your area'} — {event.delivery_date}"
    body = (
        f"A new Bloom Print delivery is available to claim.\n\n"
        f"Reference: {event.reference}\n"
        f"Area: {where or 'Not specified'}\n"
        f"Delivery date: {event.delivery_date}\n"
        f"Occasion: {order.occasion or 'Not specified'}\n"
        f"Brief: {order.flower_notes or 'Not specified'}\n"
        f"You would be paid: ${event.florist_total}\n\n"
        f"Deliveries are first come, first served. Claim it from your dashboard:\n"
        f"{settings.SITE_URL}/dashboard/florist\n"
    )

    notifications = [
        Notification(
            recipient_type='business_account',
            recipient_business_account=florist,
            channel='email',
            subject=subject,
            body=body,
            scheduled_for=date.today(),
            related_event=event,
        )
        for florist in florists
    ]
    Notification.objects.bulk_create(notifications)

    # bulk_create does not populate PKs on every backend, and send_notification
    # saves the row it is given. Re-read so each has an identity to update.
    created = list(
        Notification.objects.filter(
            related_event=event,
            recipient_type='business_account',
            status='pending',
        )
    )

    # Built once and reused for every recipient — it is the same document, and
    # rendering a PDF per florist would be wasteful. The request variant carries
    # no recipient PII, which matters because this reaches florists who will
    # never claim it and cannot be unsent.
    attachments = _brief_attachment(event, 'request')
    for notification in created:
        send_notification(notification, attachments=attachments)

    return created


def _brief_attachment(event, variant):
    """
    Renders the florist brief, or returns None if it cannot be built.

    A PDF failure must not stop the email: a florist who gets the message
    without the attachment can still claim the delivery from their dashboard,
    whereas no email at all means they never learn it exists.
    """
    from data_management.utils.florist_brief_pdf import build_florist_brief

    try:
        pdf_bytes = build_florist_brief(event, variant=variant)
    except Exception:
        logger.exception("Could not build %s brief for event %s", variant, event.pk)
        return None

    return [(f'bloomprint-{event.reference}.pdf', pdf_bytes, 'application/pdf')]


def notify_florist_of_claim(delivery_request):
    """
    Confirms a claim to the florist who won it, with the full brief attached.

    This is the moment the recipient's address and card message are released, so
    it is the first document that carries them.
    """
    from data_management.utils.send_notification import send_notification

    event = delivery_request.event
    order = event.order
    where = ', '.join(part for part in [order.recipient_suburb, order.recipient_state] if part)

    notification = Notification.objects.create(
        recipient_type='business_account',
        recipient_business_account=delivery_request.business_account,
        channel='email',
        subject=f"It's yours — {event.reference} on {event.delivery_date}",
        body=(
            f"Congratulations, you claimed this delivery.\n\n"
            f"Reference: {event.reference}\n"
            f"Deliver on: {event.delivery_date}\n"
            f"Area: {where or 'See attached brief'}\n"
            f"You will be paid: ${event.florist_total}\n\n"
            f"The attached brief has the full delivery address, the card message, and "
            f"everything else you need. Quote {event.reference} on your invoice.\n\n"
            f"Mark it delivered when it is done:\n{settings.FLORIST_LOGIN_URL}\n"
        ),
        scheduled_for=date.today(),
        related_event=event,
    )

    send_notification(notification, attachments=_brief_attachment(event, 'claimed'))
    return notification


def cancel_event_notifications(event):
    """
    Called when admin marks an event as 'ordered'.
    Sets status='cancelled' on all pending notifications for this event.
    """
    Notification.objects.filter(related_event=event, status='pending').update(status='cancelled')


def create_customer_delivery_day_notification(event):
    """
    Creates a pending email notification for the customer on the delivery day.
    Includes the next scheduled delivery date if one exists.
    """
    from events.models import Event as EventModel

    order = event.order

    next_event = EventModel.objects.filter(
        order=order,
        delivery_date__gt=event.delivery_date,
    ).order_by('delivery_date').first()

    first_name = order.customer_first_name or 'there'
    recipient_name = f"{order.recipient_first_name} {order.recipient_last_name}".strip()

    body = (
        f"Hi {first_name},\n\n"
        f"Your Bloom Print delivery is today! "
        f"Flowers should be arriving for {recipient_name}.\n"
    )

    if next_event:
        body += f"\nYour next delivery after this one is scheduled for {next_event.delivery_date}.\n"

    body += "\nThank you for choosing Bloom Print!"

    Notification.objects.create(
        recipient_type='customer',
        recipient_email=order.customer_email,
        channel='email',
        subject="Your Bloom Print delivery is today!",
        body=body,
        scheduled_for=event.delivery_date,
        related_event=event,
    )


def create_admin_delivery_day_notifications(event):
    """
    Called when admin marks an event as 'ordered'.
    Creates 2 notifications (email + sms) scheduled for event.delivery_date:
    "Delivery day today — please confirm once delivered."
    """
    order = event.order
    email_body = (
        f"Delivery day today — please confirm once delivered.\n\n"
        f"Recipient: {order.recipient_first_name} {order.recipient_last_name}\n"
        f"Address: {order.recipient_street_address}, {order.recipient_suburb}, "
        f"{order.recipient_city}, {order.recipient_state} {order.recipient_postcode}, "
        f"{order.recipient_country}\n"
        f"Delivery Date: {event.delivery_date}\n"
    )
    sms_body = sms_messages.admin_delivery_day(event)

    notifications = [
        Notification(
            recipient_type='admin',
            channel='email',
            subject=f"Delivery Day: {order.recipient_first_name} {order.recipient_last_name} on {event.delivery_date}",
            body=email_body,
            scheduled_for=event.delivery_date,
            related_event=event,
        ),
        Notification(
            recipient_type='admin',
            channel='sms',
            body=sms_body,
            scheduled_for=event.delivery_date,
            related_event=event,
        ),
    ]
    Notification.objects.bulk_create(notifications)
