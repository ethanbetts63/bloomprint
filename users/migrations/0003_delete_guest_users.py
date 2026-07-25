from django.db import migrations

GUEST_SUFFIX = '@checkout.invalid'


def delete_guest_users(apps, schema_editor):
    """
    Remove the guest-checkout placeholder User rows. Runs only after every FK
    that pointed at them (Order.user, Payment.user, DiscountUsage.user,
    Notification.recipient_user) has been dropped, so no cascade can reach real
    data. Customer identity now lives on the Order.
    """
    User = apps.get_model('users', 'User')
    User.objects.filter(username__endswith=GUEST_SUFFIX).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_managers'),
        ('events', '0008_remove_order_user'),
        ('payments', '0004_remove_payment_user'),
        ('data_management', '0005_remove_notification_recipient_user'),
        ('partners', '0005_remove_discountusage_user'),
    ]

    operations = [
        migrations.RunPython(delete_guest_users, migrations.RunPython.noop),
    ]
