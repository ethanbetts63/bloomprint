from rest_framework import serializers
from partners.models import BusinessAccount


class BusinessAccountUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessAccount
        fields = [
            'business_name', 'phone',
            'bsb', 'account_number', 'account_name',
            'street_address', 'suburb', 'city', 'state', 'postcode', 'country',
            'latitude', 'longitude', 'service_radius_km',
        ]

    def validate(self, data):
        account = self.instance
        is_florist = account.account_type == 'florist'

        if is_florist:
            lat = data.get('latitude', account.latitude)
            lng = data.get('longitude', account.longitude)
            if lat is None or lng is None:
                raise serializers.ValidationError({
                    'latitude': 'Florists must set a location on the map.'
                })

        bank_fields = {'bsb', 'account_number', 'account_name'}
        if not is_florist and bank_fields.intersection(data):
            raise serializers.ValidationError({
                'bsb': 'Bank details can only be added to florist accounts.'
            })

        return data
