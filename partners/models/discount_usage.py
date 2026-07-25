from django.db import models
from django.conf import settings


class DiscountUsage(models.Model):
    discount_code = models.ForeignKey(
        'partners.DiscountCode',
        on_delete=models.CASCADE,
        related_name='usages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='discount_usages',
        null=True, blank=True,
    )
    payment = models.OneToOneField(
        'payments.Payment',
        on_delete=models.CASCADE,
        related_name='discount_usage'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        email = self.payment.order.customer_email or 'unknown'
        return f"{self.discount_code.code} used by {email}"
