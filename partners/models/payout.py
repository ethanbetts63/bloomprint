from django.db import models


class Payout(models.Model):
    PAYOUT_TYPE_CHOICES = (
        ('fulfillment', 'Fulfillment'),
        ('commission', 'Commission'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    business_account = models.ForeignKey(
        'partners.BusinessAccount',
        on_delete=models.CASCADE,
        related_name='payouts'
    )
    payout_type = models.CharField(max_length=20, choices=PAYOUT_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='AUD')
    stripe_transfer_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout {self.id} - {self.payout_type} ${self.amount} to {self.business_account}"
