import requests
from django.conf import settings
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Sends a test email using Mailgun.'

    def handle(self, *args, **options):
        api_key = settings.MAILGUN_API_KEY
        domain = settings.MAILGUN_DOMAIN

        if not domain or not api_key:
            self.stderr.write(self.style.ERROR(
                "MAILGUN_DOMAIN and MAILGUN_API_KEY must both be set in the environment."))
            return

        self.stdout.write(f"Sending test email with Mailgun via {domain}...")

        response = requests.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=("api", api_key),
            data={"from": f"Mailgun Sandbox <postmaster@{domain}>",
                  "to": "Ethan Betts-Ingram <ethanbetts63@gmail.com>",
                  "subject": "Hello Ethan Betts-Ingram",
                  "text": "Congratulations Ethan Betts-Ingram, you just sent an email with Mailgun! You are truly awesome!"})
        
        if response.status_code == 200:
            self.stdout.write(self.style.SUCCESS('Successfully sent email!'))
            self.stdout.write(f"Response: {response.text}")
        else:
            self.stderr.write(self.style.ERROR(f"Failed to send email. Status code: {response.status_code}"))
            self.stderr.write(f"Response: {response.text}")
