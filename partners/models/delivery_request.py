import secrets
from django.db import models


class DeliveryRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    )

    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='delivery_requests'
    )
    business_account = models.ForeignKey(
        'partners.BusinessAccount',
        on_delete=models.CASCADE,
        related_name='delivery_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    first_notified_at = models.DateTimeField(null=True, blank=True)
    second_notified_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"DeliveryRequest {self.id} for Event {self.event_id} → {self.business_account}"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
