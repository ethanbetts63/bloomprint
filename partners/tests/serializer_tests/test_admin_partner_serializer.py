import pytest
from partners.serializers.admin_business_account_serializer import AdminBusinessAccountSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAdminBusinessAccountSerializer:

    def test_includes_user_email(self):
        user = UserFactory(email='florist@example.com')
        partner = BusinessAccountFactory(user=user)
        data = AdminBusinessAccountSerializer(partner).data
        assert data['email'] == 'florist@example.com'

    def test_includes_user_first_and_last_name(self):
        user = UserFactory(first_name='Alice', last_name='Wonder')
        partner = BusinessAccountFactory(user=user)
        data = AdminBusinessAccountSerializer(partner).data
        assert data['first_name'] == 'Alice'
        assert data['last_name'] == 'Wonder'

    def test_includes_partner_business_name(self):
        partner = BusinessAccountFactory(business_name='Bloom Shop')
        data = AdminBusinessAccountSerializer(partner).data
        assert data['business_name'] == 'Bloom Shop'

    def test_includes_account_type(self):
        partner = BusinessAccountFactory(account_type='florist')
        data = AdminBusinessAccountSerializer(partner).data
        assert data['account_type'] == 'florist'

    def test_includes_status(self):
        partner = BusinessAccountFactory(status='active')
        data = AdminBusinessAccountSerializer(partner).data
        assert data['status'] == 'active'

    def test_includes_phone(self):
        partner = BusinessAccountFactory(phone='+15551234567')
        data = AdminBusinessAccountSerializer(partner).data
        assert data['phone'] == '+15551234567'

    def test_includes_location_fields(self):
        partner = BusinessAccountFactory()
        partner.latitude = 40.7128
        partner.longitude = -74.0060
        partner.service_radius_km = 25
        partner.save()
        data = AdminBusinessAccountSerializer(partner).data
        assert data['latitude'] == 40.7128
        assert data['longitude'] == -74.0060
        assert data['service_radius_km'] == 25

    def test_includes_created_at(self):
        partner = BusinessAccountFactory()
        data = AdminBusinessAccountSerializer(partner).data
        assert 'created_at' in data

    def test_id_is_present(self):
        partner = BusinessAccountFactory()
        data = AdminBusinessAccountSerializer(partner).data
        assert 'id' in data
        assert data['id'] == partner.pk
