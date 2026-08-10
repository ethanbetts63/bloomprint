from django.contrib.auth import get_user_model
from partners.models.business_account import BusinessAccount
from partners.models.discount_code import DiscountCode

User = get_user_model()

ADMIN_USER = {
    'username': 'admin@bloomprint.com.au',
    'email': 'admin@bloomprint.com.au',
    'first_name': 'Ethan',
    'last_name': 'Betts',
    'is_superuser': True,
    'is_staff': True,
    'is_active': True,
}

ADMIN_BUSINESS_ACCOUNT = {
    'account_type': 'florist',
    'status': 'active',
    'business_name': 'Bloom Print',
    'phone': '0423853830',
    'street_address': '78 Harold Street',
    'suburb': 'Dianella',
    'city': 'Dianella',
    'state': 'WA',
    'postcode': '6059',
    'country': 'Australia',
    'latitude': -32.201181266339276,
    'longitude': 115.78903198242189,
    'service_radius_km': 145,
}

ADMIN_DISCOUNT_CODE = {
    'code': 'owner',
    'discount_amount': 5.00,
    'is_active': True,
}


class AdminUserGenerator:
    def __init__(self, command, password):
        self.command = command
        self.password = password

    def run(self):
        user, created = User.objects.update_or_create(
            username=ADMIN_USER['username'],
            defaults=ADMIN_USER,
        )
        user.set_password(self.password)
        user.save()
        if created:
            self.command.stdout.write(f"Created admin user: {user.email}")
        else:
            self.command.stdout.write(f"Updated admin user: {user.email}")

        account, created = BusinessAccount.objects.update_or_create(
            user=user,
            defaults=ADMIN_BUSINESS_ACCOUNT,
        )
        if created:
            self.command.stdout.write(f"Created business account: {account.business_name}")
        else:
            self.command.stdout.write(f"Updated business account: {account.business_name}")

        discount_code, created = DiscountCode.objects.update_or_create(
            business_account=account,
            defaults=ADMIN_DISCOUNT_CODE,
        )
        if created:
            self.command.stdout.write(f"Created discount code: {discount_code.code}")
        else:
            self.command.stdout.write(f"Updated discount code: {discount_code.code}")

        self.command.stdout.write(self.command.style.SUCCESS("Admin user setup complete."))
