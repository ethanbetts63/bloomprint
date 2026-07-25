import logging
from datetime import timezone

import requests
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone as django_timezone

logger = logging.getLogger(__name__)


def resolve_recipient(notification):
    """Returns (email, phone) tuple. Either may be None depending on recipient_type."""
    rtype = notification.recipient_type

    if rtype == 'admin':
        return getattr(settings, 'ADMIN_EMAIL', None), getattr(settings, 'ADMIN_NUMBER', None)

    if rtype == 'partner':
        partner = notification.recipient_partner
        if not partner:
            return None, None
        email = getattr(partner.user, 'email', None)
        phone = getattr(partner, 'phone', None)
        return email, phone

    if rtype == 'customer':
        return notification.recipient_email, None

    return None, None


def send_notification(notification):
    """
    Resolves recipient, sends via Mailgun (email) or Twilio (SMS).
    Updates notification.status, notification.sent_at, notification.error_message.
    Saves the notification record.
    Does NOT raise exceptions — logs failures and marks status='failed'.
    """
    email, phone = resolve_recipient(notification)

    try:
        if notification.channel == 'email':
            if not email:
                raise ValueError(f"No email address for notification {notification.pk}")
            context = {'subject': notification.subject, 'body': notification.body}
            html_body = render_to_string('notifications/emails/admin_notification.html', context)
            text_body = render_to_string('notifications/emails/admin_notification.txt', context)
            response = requests.post(
                f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
                auth=("api", settings.MAILGUN_API_KEY),
                data={
                    "from": settings.DEFAULT_FROM_EMAIL,
                    "to": [email],
                    "subject": notification.subject or "FutureFlower Notification",
                    "text": text_body,
                    "html": html_body,
                },
                timeout=10,
            )
            response.raise_for_status()

        elif notification.channel == 'sms':
            if settings.DEBUG:
                logger.info("DEBUG mode: skipping SMS for notification %s", notification.pk)
                notification.status = 'sent'
                notification.sent_at = django_timezone.now()
                notification.error_message = None
                notification.save()
                return
            if not phone:
                raise ValueError(f"No phone number for notification {notification.pk}")
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=notification.body,
                messaging_service_sid=settings.TWILIO_MESSAGING_SERVICE_SID,
                to=phone,
            )

        else:
            raise ValueError(f"Unknown channel '{notification.channel}' for notification {notification.pk}")

        notification.status = 'sent'
        notification.sent_at = django_timezone.now()
        notification.error_message = None

    except Exception as e:
        logger.error("Failed to send notification %s: %s", notification.pk, e)
        notification.status = 'failed'
        notification.error_message = str(e)

    notification.save()
