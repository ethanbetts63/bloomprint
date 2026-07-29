from django.db import models


class Notification(models.Model):
    RECIPIENT_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('business_account', 'Business account'),
        ('customer', 'Customer'),
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
        help_text="Direct email target for customer notifications (no user row).",
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
