from django.db import migrations

GUEST_SUFFIX = '@checkout.invalid'


def backfill_referred_by_partner(apps, schema_editor):
    """
    Move the referral attribution from guest Users onto their Orders, so
    commissions keep resolving after the guest User rows are deleted.
    """
    Order = apps.get_model('events', 'Order')

    guest_orders = Order.objects.filter(
        user__username__endswith=GUEST_SUFFIX,
        user__referred_by_partner__isnull=False,
        referred_by_partner__isnull=True,
    ).select_related('user')
    for order in guest_orders:
        Order.objects.filter(pk=order.pk).update(
            referred_by_partner_id=order.user.referred_by_partner_id
        )


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0006_order_referred_by_partner'),
    ]

    operations = [
        migrations.RunPython(backfill_referred_by_partner, migrations.RunPython.noop),
    ]
