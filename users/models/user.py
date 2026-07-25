from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

# Guest-checkout accounts are created with a placeholder username of the form
# ``guest-<uuid>@checkout.invalid``. Their email is later set to the buyer's
# real address, so many guest rows can share one email. This suffix is the
# stable marker that identifies such placeholder accounts.
GUEST_USERNAME_SUFFIX = '@checkout.invalid'


class CustomUserManager(UserManager):
    def real(self):
        """
        Accounts a person actually logs into. Excludes guest-checkout
        placeholder rows, which reuse buyers' emails and would otherwise cause
        duplicate-email collisions.
        """
        return self.get_queryset().exclude(username__endswith=GUEST_USERNAME_SUFFIX)


class User(AbstractUser):
    """
    Custom user model that includes fields for various contact methods.
    """
    objects = CustomUserManager()

    password_reset_last_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of when the last password reset email was sent."
    )
    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="The user's Stripe Customer ID."
    )

    referred_by_partner = models.ForeignKey(
        'partners.Partner',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referred_users',
        help_text="The partner who referred this user via discount code."
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        editable=False,
        help_text="Timestamp of when the account was deleted."
    )

    def __str__(self):
        return self.username