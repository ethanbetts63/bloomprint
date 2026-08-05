import secrets
from decimal import Decimal

from django.conf import settings
from django.db import migrations, models

# Frozen copies of events.utils.reference as it stood when this migration was
# written. A historical migration must not import live app code, or renaming
# that module later stops the migration replaying on a fresh database.
_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'


def _generate_reference():
    return 'BP-' + ''.join(secrets.choice(_ALPHABET) for _ in range(6))


def backfill_references_and_money(apps, schema_editor):
    """
    Give existing events a reference and a money snapshot.

    References are filled first so the unique constraint added afterwards has
    nothing to trip over. The money snapshot is recomputed from each event's
    order at the rate in force now, which is the only figure available for
    deliveries that predate the snapshot.
    """
    Event = apps.get_model('events', 'Event')

    rate = Decimal(str(getattr(settings, 'FLORIST_COMMISSION_RATE', '0.15')))
    seen = set()

    for event in Event.objects.select_related('order').iterator():
        reference = _generate_reference()
        while reference in seen:
            reference = _generate_reference()
        seen.add(reference)

        budget = event.order.budget if event.order_id else None
        if budget:
            commission = (Decimal(budget) * rate).quantize(Decimal('0.01'))
            florist_budget = (Decimal(budget) - commission).quantize(Decimal('0.01'))
            delivery_fee = event.order.delivery_fee or Decimal('0.00')
        else:
            commission = florist_budget = delivery_fee = Decimal('0.00')

        Event.objects.filter(pk=event.pk).update(
            reference=reference,
            platform_commission=commission,
            florist_budget=florist_budget,
            delivery_fee=delivery_fee,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0009_rename_referred_by_affiliate'),
    ]

    operations = [
        # Added without the unique constraint so existing rows can be filled in.
        migrations.AddField(
            model_name='event',
            name='reference',
            field=models.CharField(blank=True, default='', max_length=16),
        ),
        migrations.AddField(
            model_name='event',
            name='florist_budget',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                help_text="Snapshot: what the florist has to spend on flowers, after Bloom Print's "
                          "commission. Frozen at creation so a later rate change cannot alter what "
                          "a florist was already promised.",
            ),
        ),
        migrations.AddField(
            model_name='event',
            name='platform_commission',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                help_text="Snapshot: Bloom Print's cut of the bouquet budget for this delivery.",
            ),
        ),
        migrations.AddField(
            model_name='event',
            name='delivery_fee',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                help_text="Snapshot: delivery fee for this delivery, passed to the florist in full.",
            ),
        ),
        migrations.RunPython(backfill_references_and_money, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='event',
            name='reference',
            field=models.CharField(
                blank=True, db_index=True, max_length=16, unique=True,
                help_text="Quotable, non-sequential reference shown to florists (e.g. BP-K4F9Q2). "
                          "Generated on first save; the primary key is never exposed externally.",
            ),
        ),
        migrations.AlterField(
            model_name='event',
            name='commission_amount',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                help_text="Snapshotted AFFILIATE REFERRAL commission for this delivery, set at "
                          "creation. Not Bloom Print's own cut — that is platform_commission.",
            ),
        ),
    ]
