import secrets
from django.db import models


class DeliveryRequest(models.Model):
    """
    A florist's claim on a delivery.

    Despite the name, this is a record of a delivery already taken, not an offer
    awaiting an answer. It was an offer under the old assignment model, where
    the platform picked one florist and waited for accept or decline; claiming
    is first-come-first-served, so a row only ever exists because a florist took
    the job. Hence the single status.
    """
    STATUS_CHOICES = (
        ('accepted', 'Accepted'),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='accepted')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"DeliveryRequest {self.id} for Event {self.event_id} → {self.business_account}"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
