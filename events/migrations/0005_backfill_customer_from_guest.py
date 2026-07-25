from django.db import migrations

GUEST_SUFFIX = '@checkout.invalid'


def backfill_customer_data(apps, schema_editor):
    """
    Copy customer identity off guest-checkout placeholder Users onto their
    Orders and Notifications, so the guest User rows can later be deleted.

    Uses QuerySet.update() to bypass model save() side effects and to behave
    identically whether called with the historical app registry (in the
    migration) or the real one (in tests).
    """
    Order = apps.get_model('events', 'Order')
    Notification = apps.get_model('data_management', 'Notification')
    TermsAcceptance = apps.get_model('data_management', 'TermsAcceptance')

    guest_orders = Order.objects.filter(
        user__username__endswith=GUEST_SUFFIX
    ).select_related('user')
    for order in guest_orders:
        user = order.user
        Order.objects.filter(pk=order.pk).update(
            customer_email=user.email,
            customer_first_name=user.first_name or '',
            customer_last_name=user.last_name or '',
            stripe_customer_id=user.stripe_customer_id,
        )

    customer_notes = Notification.objects.filter(
        recipient_type='customer',
        recipient_user__isnull=False,
        recipient_email__isnull=True,
    ).select_related('recipient_user')
    for note in customer_notes:
        Notification.objects.filter(pk=note.pk).update(
            recipient_email=note.recipient_user.email
        )

    guest_acceptances = TermsAcceptance.objects.filter(
        user__username__endswith=GUEST_SUFFIX
    ).select_related('terms')
    for acceptance in guest_acceptances:
        Order.objects.filter(
            user=acceptance.user, terms_accepted_at__isnull=True
        ).update(
            terms_accepted_at=acceptance.accepted_at,
            accepted_terms=acceptance.terms,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0004_order_accepted_terms_order_customer_email_and_more'),
        ('data_management', '0004_notification_recipient_email'),
    ]

    operations = [
        migrations.RunPython(backfill_customer_data, migrations.RunPython.noop),
    ]
