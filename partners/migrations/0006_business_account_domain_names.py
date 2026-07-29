from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    BusinessAccount = apps.get_model('partners', 'BusinessAccount')
    BusinessAccount.objects.filter(account_type='delivery').update(account_type='florist')
    BusinessAccount.objects.filter(account_type='non_delivery').update(account_type='affiliate')


def backwards(apps, schema_editor):
    BusinessAccount = apps.get_model('partners', 'BusinessAccount')
    BusinessAccount.objects.filter(account_type='florist').update(account_type='delivery')
    BusinessAccount.objects.filter(account_type='affiliate').update(account_type='non_delivery')


class Migration(migrations.Migration):
    dependencies = [
        ('partners', '0005_remove_discountusage_user'),
        ('events', '0008_remove_order_user'),
        ('users', '0003_delete_guest_users'),
        ('data_management', '0005_remove_notification_recipient_user'),
    ]

    operations = [
        migrations.RenameModel(old_name='Partner', new_name='BusinessAccount'),
        migrations.RenameField(model_name='businessaccount', old_name='partner_type', new_name='account_type'),
        migrations.RenameField(model_name='commission', old_name='partner', new_name='business_account'),
        migrations.RenameField(model_name='discountcode', old_name='partner', new_name='business_account'),
        migrations.RenameField(model_name='deliveryrequest', old_name='partner', new_name='business_account'),
        migrations.RenameField(model_name='payout', old_name='partner', new_name='business_account'),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='businessaccount', name='account_type',
            field=models.CharField(choices=[('affiliate', 'Affiliate'), ('florist', 'Florist')], default='affiliate', max_length=20),
        ),
        migrations.AlterField(
            model_name='businessaccount', name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='business_account', to=settings.AUTH_USER_MODEL),
        ),
    ]
