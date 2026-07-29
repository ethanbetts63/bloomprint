from django.db import migrations, models


def forwards(apps, schema_editor):
    Notification = apps.get_model('data_management', 'Notification')
    Notification.objects.filter(recipient_type='partner').update(
        recipient_type='business_account'
    )


def backwards(apps, schema_editor):
    Notification = apps.get_model('data_management', 'Notification')
    Notification.objects.filter(recipient_type='business_account').update(
        recipient_type='partner'
    )


class Migration(migrations.Migration):
    dependencies = [
        ('data_management', '0005_remove_notification_recipient_user'),
        ('partners', '0006_business_account_domain_names'),
    ]

    operations = [
        migrations.RenameField(
            model_name='notification',
            old_name='recipient_partner',
            new_name='recipient_business_account',
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='notification',
            name='recipient_type',
            field=models.CharField(
                choices=[
                    ('admin', 'Admin'),
                    ('business_account', 'Business account'),
                    ('customer', 'Customer'),
                ],
                max_length=20,
            ),
        ),
    ]
