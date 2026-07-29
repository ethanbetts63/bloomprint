import re

from django.db import models


class DiscountCode(models.Model):
    business_account = models.ForeignKey(
        'partners.BusinessAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='discount_codes'
    )
    code = models.CharField(max_length=30, unique=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} (${self.discount_amount})"

    @staticmethod
    def generate_code(business_name, discount_amount=5):
        base = re.sub(r'[^a-zA-Z0-9]', '', business_name)[:20].upper() if business_name else 'AFFILIATE'
        code = f"{base}{int(discount_amount)}"
        if not DiscountCode.objects.filter(code=code, is_active=True).exists():
            return code
        counter = 2
        while DiscountCode.objects.filter(code=f"{code}-{counter}", is_active=True).exists():
            counter += 1
        return f"{code}-{counter}"
