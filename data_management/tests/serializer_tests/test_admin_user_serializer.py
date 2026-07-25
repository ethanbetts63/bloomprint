import pytest
from data_management.serializers.admin_user_serializer import AdminUserSerializer
from users.tests.factories.user_factory import UserFactory
from partners.tests.factories.partner_factory import PartnerFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestAdminUserSerializer:

    def test_basic_fields_present(self):
        user = UserFactory(email='test@example.com', first_name='John', last_name='Doe')
        data = AdminUserSerializer(user).data
        assert data['email'] == 'test@example.com'
        assert data['first_name'] == 'John'
        assert data['last_name'] == 'Doe'
        assert 'id' in data
        assert 'is_staff' in data
        assert 'date_joined' in data

    def test_is_partner_false_for_regular_user(self):
        user = UserFactory()
        data = AdminUserSerializer(user).data
        assert data['is_partner'] is False

    def test_is_partner_true_for_user_with_partner_profile(self):
        partner = PartnerFactory()
        data = AdminUserSerializer(partner.user).data
        assert data['is_partner'] is True

    def test_plan_count_is_zero_users_no_longer_own_orders(self):
        # Orders are no longer owned by a User; customer identity lives on the
        # order. plan_count is always 0 for staff/partner accounts.
        user = UserFactory()
        data = AdminUserSerializer(user).data
        assert data['plan_count'] == 0

    def test_referred_by_none_when_no_referral(self):
        user = UserFactory()
        data = AdminUserSerializer(user).data
        assert data['referred_by'] is None

    def test_referred_by_returns_business_name(self):
        partner = PartnerFactory(business_name='Floral Co')
        user = UserFactory(referred_by_partner=partner)
        data = AdminUserSerializer(user).data
        assert data['referred_by'] == 'Floral Co'

    def test_referred_by_returns_name_when_no_business_name(self):
        partner_user = UserFactory(first_name='Alice', last_name='Smith')
        partner = PartnerFactory(user=partner_user, business_name='')
        user = UserFactory(referred_by_partner=partner)
        data = AdminUserSerializer(user).data
        assert 'Alice' in data['referred_by']
