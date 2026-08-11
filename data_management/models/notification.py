from django.db import models


class Notification(models.Model):
    RECIPIENT_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('business_account', 'Business account'),
        ('customer', 'Customer'),
        # A staff-written email with no linked delivery or existing account.
        ('manual', 'Manual email'),
        # A florist who is not on the platform yet, emailed by hand from the
        # admin event page to pitch them a delivery. There is no account to
        # point at, so the address is all we have.
        ('florist_prospect', 'Florist prospect'),
    )
    CHANNEL_CHOICES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPE_CHOICES)
    recipient_business_account = models.ForeignKey(
        'partners.BusinessAccount',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='notifications',
    )
    recipient_email = models.EmailField(
        null=True, blank=True,
        help_text="Direct email target where there is no account to resolve — "
                  "customer notifications and florist outreach.",
    )

    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    subject = models.CharField(max_length=255, null=True, blank=True)
    body = models.TextField()

    scheduled_for = models.DateField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    related_event = models.ForeignKey(
        'events.Event',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='notifications',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_for']
