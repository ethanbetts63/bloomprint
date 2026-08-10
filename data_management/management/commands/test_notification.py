from datetime import date
from django.core.management.base import BaseCommand
from django.conf import settings
from data_management.models import Notification
from data_management.utils.send_notification import send_notification


class Command(BaseCommand):
    help = 'Creates and immediately sends a test Notification to the admin via email or SMS.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--channel',
            default='email',
            choices=['email', 'sms'],
            help='Channel to test: email or sms. Defaults to email.',
        )
        parser.add_argument(
            '--subject',
            default='Bloomprint Test Notification',
            help='Subject line for email notifications.',
        )
        parser.add_argument(
            '--body',
            default='This is a test notification from the Bloomprint application.',
            help='Body text of the notification.',
        )

    def handle(self, *args, **options):
        channel = options['channel']
        subject = options['subject']
        body = options['body']

        self.stdout.write(f"Creating test {channel} notification for admin...")

        notification = Notification.objects.create(
            recipient_type='admin',
            channel=channel,
            subject=subject,
            body=body,
            scheduled_for=date.today(),
        )

        self.stdout.write(f"Notification created (PK: {notification.pk}). Sending now...")
        send_notification(notification)

        if notification.status == 'sent':
            self.stdout.write(self.style.SUCCESS(f"Notification sent successfully (PK: {notification.pk})."))
        else:
            self.stderr.write(self.style.ERROR(
                f"Notification failed (PK: {notification.pk}). Error: {notification.error_message}"
            ))
