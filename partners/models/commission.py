from django.db import models


class Commission(models.Model):
    COMMISSION_TYPE_CHOICES = (
        ('referral', 'Referral'),
        ('fulfillment', 'Fulfillment'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('denied', 'Denied'),
    )

    business_account = models.ForeignKey(
        'partners.BusinessAccount',
        on_delete=models.CASCADE,
        related_name='commissions'
    )
    payment = models.ForeignKey(
        'payments.Payment',
        on_delete=models.CASCADE,
        null=True,
        related_name='commissions'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commissions'
    )
    commission_type = models.CharField(max_length=20, choices=COMMISSION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.commission_type} commission ${self.amount} for {self.business_account}"
