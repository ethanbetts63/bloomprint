"""Staff-written outbound email that is not tied to a delivery."""
from datetime import date

from data_management.models import Notification


def send_manual_email(*, to, subject, body, attachments=None):
    """Send and retain an audit record of a general admin email."""
    from data_management.utils.send_notification import send_notification

    notification = Notification.objects.create(
        recipient_type='manual',
        recipient_email=to,
        channel='email',
        subject=subject,
        body=body,
        scheduled_for=date.today(),
    )
    send_notification(notification, attachments=attachments)
    notification.refresh_from_db()
    return notification
