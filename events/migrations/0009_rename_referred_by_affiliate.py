from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('events', '0008_remove_order_user'), ('partners', '0006_business_account_domain_names')]

    operations = [
        migrations.RenameField(model_name='order', old_name='referred_by_partner', new_name='referred_by_affiliate'),
        migrations.AlterField(
            model_name='order', name='referred_by_affiliate',
            field=models.ForeignKey(blank=True, help_text='The affiliate who referred this order via discount code.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referred_orders', to='partners.businessaccount'),
        ),
    ]
