from datetime import date, timedelta
from data_management.models import Notification
from data_management.utils import sms_messages


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
