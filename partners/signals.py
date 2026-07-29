from django.db.models.signals import pre_delete
from django.dispatch import receiver
from partners.models import BusinessAccount


@receiver(pre_delete, sender=BusinessAccount)
def deactivate_discount_code_on_account_delete(sender, instance, **kwargs):
    """When an account is deleted, deactivate its discount code instead of losing it."""
    from partners.models import DiscountCode
    DiscountCode.objects.filter(business_account=instance).update(is_active=False)
