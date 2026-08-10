from decimal import Decimal
from django.db import models
from django.conf import settings

from events.utils.fee_calc import calculate_delivery_fee

class Order(models.Model):
    """
    The single order model for the system. `billing_mode` distinguishes
    one-time and recurring orders.
    """
    STATUS_CHOICES = (
        ('pending_payment', 'Pending Payment'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )

    BILLING_MODE_CHOICES = (
        ('one_time', 'One-time'),
        ('recurring', 'Recurring'),
    )

    OCCASION_CHOICES = (
        ('birthday', 'Birthday'),
        ('romance', 'Romance'),
        ('sympathy', 'Sympathy'),
        ('thank_you', 'Thank You'),
        ('just_because', 'Just Because'),
        ('other', 'Other'),
    )

    customer_email = models.EmailField(
        null=True, blank=True,
        help_text="The customer's email, captured at checkout (claim)."
    )
    customer_first_name = models.CharField(
        max_length=150, blank=True, default='',
        help_text="The customer's first name."
    )
    customer_last_name = models.CharField(
        max_length=150, blank=True, default='',
        help_text="The customer's last name."
    )
    stripe_customer_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="The Stripe Customer ID for this order's buyer."
    )
    terms_accepted_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the customer accepted the terms during checkout."
    )
    accepted_terms = models.ForeignKey(
        'data_management.TermsAndConditions',
        null=True, blank=True,
        on_delete=models.PROTECT,
        related_name='order_acceptances',
        help_text="The terms version the customer accepted at checkout."
    )
    referred_by_affiliate = models.ForeignKey(
        'partners.BusinessAccount',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='referred_orders',
        help_text="The affiliate who referred this order via discount code."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_payment',
        help_text="The current status of the order."
    )
    currency = models.CharField(
        max_length=3, default='AUD',
        help_text="The three-letter ISO currency code."
    )
    billing_mode = models.CharField(
        max_length=20,
        choices=BILLING_MODE_CHOICES,
        default='one_time',
        help_text="How this order is billed: one-time or recurring."
    )

    FREQUENCY_CHOICES = (
        ('weekly', 'Weekly'),
        ('fortnightly', 'Fortnightly'),
        ('monthly', 'Monthly'),
        ('annually', 'Annually'),
    )

    budget = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="The budget per bouquet."
    )
    delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Delivery fee, auto-computed on save. Zero once the budget "
                  "reaches the threshold, where delivery comes out of the budget."
    )
    subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Output of the pricing formula before discounts."
    )
    discount_code = models.ForeignKey(
        'partners.DiscountCode',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text="The discount code applied to this order."
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="The discount amount applied to this order."
    )
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="The final total amount for the plan, auto-computed on save."
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        null=True, blank=True,
        help_text="How often deliveries are made."
    )
    occasion = models.CharField(
        max_length=20,
        choices=OCCASION_CHOICES,
        null=True, blank=True,
        help_text="The occasion the bouquet is for, used as guidance for the florist."
    )

    recipient_first_name = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's first name.")
    recipient_last_name = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's last name.")
    recipient_street_address = models.CharField(max_length=255, blank=True, null=True, help_text="Recipient's street address.")
    recipient_suburb = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's suburb or neighborhood.")
    recipient_city = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's city.")
    recipient_state = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's state, province, or region.")
    recipient_postcode = models.CharField(max_length=20, blank=True, null=True, help_text="Recipient's postal code.")
    recipient_country = models.CharField(max_length=100, blank=True, null=True, help_text="Recipient's country.")

    # Geocoded from the recipient address. Florist matching is purely a distance
    # test against these, so an order without them can never reach a florist —
    # treat a null pair as an admin flag, not a benign default.
    latitude = models.FloatField(
        null=True, blank=True,
        help_text="Geocoded latitude of the recipient address. Null means the address "
                  "has not been geocoded, and the order cannot be matched to a florist."
    )
    longitude = models.FloatField(
        null=True, blank=True,
        help_text="Geocoded longitude of the recipient address. Null means the address "
                  "has not been geocoded, and the order cannot be matched to a florist."
    )

    delivery_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes to provide more context about the order."
    )
    start_date = models.DateField(
        null=True, blank=True,
        help_text="The date the plan's deliveries begin."
    )
    preferred_delivery_time = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Preferred time window for deliveries (e.g., 'morning', 'afternoon')."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    flower_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about flower preferences."
    )
    stripe_subscription_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="The ID from Stripe for managing a recurring order's subscription."
    )

    card_message = models.TextField(
        blank=True,
        null=True,
        help_text=(
            "Card message for a one-off delivery, staged before payment and copied "
            "onto the Event when it is created. Subscriptions are delivered without "
            "a card message, so this is ignored when billing_mode is 'recurring'."
        )
    )

    def make_recurring(self, frequency):
        """
        Convert this order to a recurring one. Raises ValueError on an unknown
        frequency, so callers must validate input before calling.
        """
        if frequency not in dict(self.FREQUENCY_CHOICES):
            raise ValueError(f'Unknown delivery frequency: {frequency!r}')

        self.billing_mode = 'recurring'
        self.frequency = frequency
        self.save()

    def make_one_time(self):
        """
        Reverts a draft order back to one-time billing. The counterpart to
        make_recurring, for a customer who opted into a subscription and then
        changed their mind before paying.
        """
        self.billing_mode = 'one_time'
        self.frequency = None
        self.save()

    def save(self, *args, **kwargs):
        if self.status == 'pending_payment':
            self._recalculate_price()
        super().save(*args, **kwargs)

    def _recalculate_price(self):
        if self.budget is not None:
            self.budget = self._meta.get_field('budget').to_python(self.budget)
            self.delivery_fee = calculate_delivery_fee(self.budget)
            self.subtotal = (self.budget + self.delivery_fee).quantize(Decimal('0.01'))
        self.total_amount = (
            (self.subtotal or Decimal('0'))
            - (self.discount_amount or Decimal('0'))
        )

    def __str__(self):
        who = self.customer_email or 'unclaimed'
        return f"Order {self.id} ({self.billing_mode}) for {who}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Order"
        verbose_name_plural = "Orders"
