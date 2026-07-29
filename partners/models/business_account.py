from django.db import models
from django.conf import settings


class BusinessAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('affiliate', 'Affiliate'),
        ('florist', 'Florist'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('denied', 'Denied'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_account'
    )
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default='affiliate'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    business_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    street_address = models.CharField(max_length=255, blank=True)
    suburb = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    service_radius_km = models.PositiveIntegerField(default=10)

    stripe_connect_account_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_connect_onboarding_complete = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name or self.user.email} ({self.account_type})"
