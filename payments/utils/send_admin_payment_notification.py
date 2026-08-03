import logging
import requests
from django.conf import settings
from django.template.loader import render_to_string
from twilio.rest import Client

from data_management.utils import sms_messages

logger = logging.getLogger(__name__)


def send_admin_cancellation_notification(message: str):
    """
    Sends an admin notification for a plan cancellation event (email + SMS).
    """
    subject = "Bloom Print Plan Cancelled — Action May Be Required"
    admin_email = settings.ADMIN_EMAIL
    admin_number = settings.ADMIN_NUMBER

    if not all([admin_email, admin_number]):
        logger.warning(
            "Admin contact details not fully configured. Cannot send cancellation notification."
        )
        return

    try:
        html_body = render_to_string('notifications/emails/admin_cancellation.html', {'message': message})
        response = requests.post(
            f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
            auth=("api", settings.MAILGUN_API_KEY),
            data={
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [admin_email],
                "subject": subject,
                "text": message,
                "html": html_body,
            },
            timeout=10,
        )
        response.raise_for_status()

        if not settings.DEBUG:
            sms_body = sms_messages.admin_cancellation(message)
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=sms_body,
                messaging_service_sid=settings.TWILIO_MESSAGING_SERVICE_SID,
                to=admin_number,
            )

    except Exception as e:
        logger.error(
            "An error occurred while sending admin cancellation notification. Error: %s", e
        )


def send_admin_payment_notification(payment_id: str, order=None):
    """
    Sends an immediate notification to the admin via email and SMS after a successful payment.

    Args:
        payment_id: The ID of the successful payment, for logging purposes.
        order: The Order instance associated with the payment (optional, for order context).
    """
    subject = "New Bloom Print Order Received"
    admin_email = settings.ADMIN_EMAIL
    admin_number = settings.ADMIN_NUMBER

    if not all([admin_email, admin_number]):
        logger.warning(
            "Admin contact details (ADMIN_EMAIL, ADMIN_NUMBER) are not fully configured. "
            "Cannot send payment notification for payment_id: %s.", payment_id
        )
        return

    text_body = sms_messages.admin_payment_received(order, payment_id)

    try:
        html_body = render_to_string('notifications/emails/admin_payment_received.html', {
            'payment_id': payment_id,
            'order': order,
        })
        response = requests.post(
            f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
            auth=("api", settings.MAILGUN_API_KEY),
            data={
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [admin_email],
                "subject": subject,
                "text": text_body,
                "html": html_body,
            },
            timeout=10,
        )
        response.raise_for_status()

        if not settings.DEBUG:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=text_body,
                messaging_service_sid=settings.TWILIO_MESSAGING_SERVICE_SID,
                to=admin_number,
            )

    except Exception as e:
        logger.error(
            "An error occurred while sending admin payment notification for payment_id: %s. Error: %s",
            payment_id, e
        )
