from django.db import models
from django.conf import settings

class Payment(models.Model):
    """
    Represents a payment transaction within the system.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True, blank=True,
    )
    order = models.ForeignKey(
        'events.Order',
        on_delete=models.CASCADE,
        related_name='payments',
        help_text="The order this payment is for."
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255, 
        unique=True, 
        help_text="The unique identifier for the Stripe PaymentIntent."
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="The amount charged. Should match the amount on the flower plan."
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} for {self.user} - {self.status}"
