from django.db import models


class DiscountUsage(models.Model):
    discount_code = models.ForeignKey(
        'partners.DiscountCode',
        on_delete=models.CASCADE,
        related_name='usages'
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
