from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('users', '0003_delete_guest_users'), ('partners', '0006_business_account_domain_names')]

    operations = [
        migrations.RenameField(model_name='user', old_name='referred_by_partner', new_name='referred_by_affiliate'),
        migrations.AlterField(
            model_name='user', name='referred_by_affiliate',
            field=models.ForeignKey(blank=True, help_text='The affiliate who referred this user via discount code.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referred_users', to='partners.businessaccount'),
        ),
    ]
