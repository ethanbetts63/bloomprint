from decimal import Decimal

from django.db import models

from events.utils.fee_calc import (
    calculate_florist_commission,
    calculate_florist_payout,
    commission_rate_label,
)
from events.utils.reference import generate_unique_reference


class Event(models.Model):
    """
    Represents a single flower delivery event within an Order.

    The Event is the unit of florist work and the only record a florist ever
    sees, so it carries its own quotable reference and a snapshot of the money
    involved rather than making callers reach through to the Order.
    """
    reference = models.CharField(
        max_length=16,
        unique=True,
        db_index=True,
        blank=True,
        help_text="Quotable, non-sequential reference shown to florists (e.g. BP-K4F9Q2). "
                  "Generated on first save; the primary key is never exposed externally."
    )
    order = models.ForeignKey(
        'events.Order',
        on_delete=models.CASCADE,
        related_name="events",
        help_text="The order this event belongs to."
    )
    delivery_date = models.DateField(
        help_text="The date the flower delivery will occur."
    )
    message = models.TextField(
        blank=True,
        null=True,
        help_text="Custom message for this specific delivery."
    )
    status = models.CharField(
        max_length=20,
        choices=(
            ('scheduled', 'Scheduled'),
            ('claimed', 'Claimed'),
            ('delivered', 'Delivered'),
            ('cancelled', 'Cancelled'),
        ),
        default='scheduled',
        help_text="Lifecycle of the delivery. 'scheduled' means paid for and on "
                  "the claim board; 'claimed' means a florist has taken it. "
                  "Replaces the old 'ordered', which described Bloom Print "
                  "ordering flowers by hand — the florist does that now."
    )
    ordered_at = models.DateTimeField(null=True, blank=True)
    ordering_evidence_text = models.TextField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_evidence_text = models.TextField(null=True, blank=True)
    florist_budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Snapshot: what the florist has to spend on flowers, after Bloom Print's "
                  "commission. Frozen at creation so a later rate change cannot alter what "
                  "a florist was already promised."
    )
    platform_commission = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Snapshot: Bloom Print's cut of the bouquet budget for this delivery."
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Snapshot: delivery fee for this delivery, passed to the florist in full."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def florist_total(self):
        """What the florist invoices Bloom Print: their flower budget plus delivery."""
        return (self.florist_budget or Decimal('0.00')) + (self.delivery_fee or Decimal('0.00'))

    def money_breakdown(self):
        """
        The full florist-facing money split for this delivery.

        Single source for the brief PDF, the claim board, and the claim detail
        page. They previously each derived this, and disagreed: the PDF fell
        back to a live calculation when the snapshot was null while the
        serializers emitted null, so a pre-snapshot event showed correct figures
        on paper and blanks in the API.

        Snapshots win when present — they are what the florist was promised, and
        a later rate change must not rewrite history.
        """
        budget = self.order.budget or Decimal('0.00')
        commission = self.platform_commission
        flower_spend = self.florist_budget
        if commission is None or flower_spend is None:
            commission = calculate_florist_commission(budget)
            flower_spend = calculate_florist_payout(budget)
        delivery_fee = self.delivery_fee
        if delivery_fee is None:
            delivery_fee = self.order.delivery_fee or Decimal('0.00')

        return {
            'budget': budget,
            'platform_commission': commission,
            'commission_rate': commission_rate_label(),
            'florist_budget': flower_spend,
            'delivery_fee': delivery_fee,
            'florist_total': (flower_spend + delivery_fee).quantize(Decimal('0.01')),
        }

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_unique_reference(Event)
        # Snapshot the money once, at creation, from the order as it stands then.
        if self._state.adding and self.florist_budget is None and self.order_id:
            budget = self.order.budget
            self.platform_commission = calculate_florist_commission(budget)
            self.florist_budget = calculate_florist_payout(budget)
            self.delivery_fee = self.order.delivery_fee or Decimal('0.00')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Delivery {self.reference} on {self.delivery_date} for Order {self.order_id}"

    class Meta:
        ordering = ['delivery_date']

