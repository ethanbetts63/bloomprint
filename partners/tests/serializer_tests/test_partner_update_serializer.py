import pytest
from partners.serializers.business_account_update_serializer import BusinessAccountUpdateSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory


@pytest.mark.django_db
class TestBusinessAccountUpdateSerializer:

    def test_valid_update_for_affiliate(self):
        partner = BusinessAccountFactory(account_type='affiliate')
        serializer = BusinessAccountUpdateSerializer(
            instance=partner, data={'business_name': 'New Name'}, partial=True
        )
        assert serializer.is_valid(), serializer.errors

    def test_delivery_partner_update_with_lat_lng_is_valid(self):
        partner = BusinessAccountFactory(account_type='florist', latitude=40.0, longitude=-74.0)
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'business_name': 'Updated Shop', 'latitude': 40.1, 'longitude': -74.1},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors

    def test_delivery_partner_clearing_lat_fails(self):
        partner = BusinessAccountFactory(account_type='florist', latitude=40.0, longitude=-74.0)
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'latitude': None},
            partial=True,
        )
        assert not serializer.is_valid()
        assert 'latitude' in serializer.errors

    def test_delivery_partner_inherits_existing_lat_when_not_updating(self):
        partner = BusinessAccountFactory(account_type='florist', latitude=40.0, longitude=-74.0)
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'phone': '+15551234567'},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors

    def test_affiliate_update_without_location_is_valid(self):
        partner = BusinessAccountFactory(account_type='affiliate')
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'phone': '+15551234567'},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors

    def test_update_saves_business_name(self):
        partner = BusinessAccountFactory(account_type='affiliate', business_name='Old Name')
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'business_name': 'New Name'},
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.business_name == 'New Name'

    def test_update_saves_phone(self):
        partner = BusinessAccountFactory(account_type='affiliate')
        serializer = BusinessAccountUpdateSerializer(
            instance=partner,
            data={'phone': '+15559876543'},
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.phone == '+15559876543'
