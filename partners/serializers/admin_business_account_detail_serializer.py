from rest_framework import serializers
from partners.models import BusinessAccount, Commission


class AdminCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = ['id', 'commission_type', 'amount', 'status', 'note', 'created_at', 'event']


class AdminBusinessAccountDetailSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    commissions = AdminCommissionSerializer(many=True, read_only=True)

    class Meta:
        model = BusinessAccount
        fields = [
            'id',
            'business_name',
            'account_type',
            'status',
            'phone',
            'bsb',
            'account_number',
            'account_name',
            'street_address',
            'suburb',
            'city',
            'state',
            'postcode',
            'country',
            'latitude',
            'longitude',
            'service_radius_km',
            'stripe_connect_account_id',
            'stripe_connect_onboarding_complete',
            'created_at',
            'email',
            'first_name',
            'last_name',
            'commissions',
        ]


class AdminBusinessAccountUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    class Meta:
        model = BusinessAccount
        fields = [
            'business_name', 'phone',
            'bsb', 'account_number', 'account_name',
            'street_address', 'suburb', 'city', 'state', 'postcode', 'country',
            'latitude', 'longitude', 'service_radius_km',
            'email', 'first_name', 'last_name',
        ]

    def validate(self, data):
        account = self.instance
        is_florist = account.account_type == 'florist'

        if is_florist:
            latitude = data.get('latitude', account.latitude)
            longitude = data.get('longitude', account.longitude)
            if latitude is None or longitude is None:
                raise serializers.ValidationError({
                    'latitude': 'Florists must set a location on the map.'
                })

        bank_fields = {'bsb', 'account_number', 'account_name'}
        if not is_florist and bank_fields.intersection(data):
            raise serializers.ValidationError({
                'bsb': 'Bank details can only be added to florist accounts.'
            })

        return data

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            for field, value in user_data.items():
                setattr(instance.user, field, value)
            instance.user.save(update_fields=list(user_data))

        return super().update(instance, validated_data)
