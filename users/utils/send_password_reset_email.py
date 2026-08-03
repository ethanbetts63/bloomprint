import logging
import requests
from django.conf import settings
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from users.models import User
from data_management.models import BlockedEmail
from data_management.views.add_to_blocklist_view import signer

logger = logging.getLogger(__name__)


def send_password_reset_email(user: User):
    """
    Sends an email to the user with a link to reset their password using the Mailgun API.
    """
    try:
        if BlockedEmail.objects.filter(email=user.email).exists():
            logger.info("Password reset email to %s suppressed because it is on the blocklist.", user.email)
            return False

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        reset_url = f"{settings.SITE_URL}/reset-password-confirm/{uid}/{token}"

        signed_email = signer.sign(user.email)
        unsubscribe_url = f"{settings.SITE_URL}/api/data/blocklist/block/{signed_email}/"

        context = {
            'user': user,
            'reset_url': reset_url,
            'site_url': settings.SITE_URL,
            'unsubscribe_url': unsubscribe_url,
        }

        subject = "Reset Your Bloom Print Password"
        html_content = render_to_string("users/emails/password_reset_email.html", context)
        text_content = render_to_string("users/emails/password_reset_email.txt", context)

        response = requests.post(
            f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
            auth=("api", settings.MAILGUN_API_KEY),
            data={"from": settings.DEFAULT_FROM_EMAIL,
                  "to": [user.email],
                  "subject": subject,
                  "text": text_content,
                  "html": html_content},
            timeout=10
        )

        if response.status_code == 200:
            return True
        else:
            logger.error("Failed to send password reset email to %s. Mailgun responded with %s: %s", user.email, response.status_code, response.text)
            return False

    except Exception as e:
        logger.error("Failed to send password reset email to %s. Error: %s", user.email, e)
        return False
