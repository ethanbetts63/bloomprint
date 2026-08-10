from rest_framework import serializers
from django.contrib.auth import get_user_model
from partners.models import BusinessAccount, DiscountCode

User = get_user_model()


class BusinessAccountRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    business_name = serializers.CharField(max_length=255, required=False, default='', allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, default='', allow_blank=True)
    account_type = serializers.ChoiceField(
        choices=['affiliate', 'florist'],
        default='affiliate'
    )

    street_address = serializers.CharField(max_length=255, required=False, default='', allow_blank=True)
    suburb = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    postcode = serializers.CharField(max_length=20, required=False, default='', allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)

    latitude = serializers.FloatField(required=False, allow_null=True, default=None)
    longitude = serializers.FloatField(required=False, allow_null=True, default=None)
    service_radius_km = serializers.IntegerField(required=False, default=10, min_value=1, max_value=500)

    def validate_email(self, value):
        lower_email = value.lower()
        if User.objects.real().filter(email__iexact=lower_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return lower_email

    def validate(self, data):
        if data.get('account_type') == 'florist':
            if data.get('latitude') is None or data.get('longitude') is None:
                raise serializers.ValidationError({
                    'latitude': 'Please set your delivery location on the map.'
                })
        return data

    def create(self, validated_data):
        email = validated_data['email'].lower()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        account_fields = {
            'user': user,
            'account_type': validated_data.get('account_type', 'affiliate'),
            'business_name': validated_data.get('business_name', ''),
            'phone': validated_data.get('phone', ''),
            'country': validated_data.get('country', ''),
        }

        if validated_data.get('account_type') == 'florist':
            account_fields.update({
                'street_address': validated_data.get('street_address', ''),
                'suburb': validated_data.get('suburb', ''),
                'city': validated_data.get('city', ''),
                'state': validated_data.get('state', ''),
                'postcode': validated_data.get('postcode', ''),
                'latitude': validated_data.get('latitude'),
                'longitude': validated_data.get('longitude'),
                'service_radius_km': validated_data.get('service_radius_km', 10),
            })

        account = BusinessAccount.objects.create(**account_fields)

        # Only affiliates deal in discount codes. Florists earn from fulfilment,
        # not referrals, so they get no code at registration.
        if account.account_type == 'affiliate':
            code = DiscountCode.generate_code(validated_data.get('business_name', ''))
            DiscountCode.objects.create(business_account=account, code=code, discount_amount=5)

        return user
