import pytest
from decimal import Decimal
from data_management.serializers.admin_user_detail_serializer import AdminUserDetailSerializer
from users.tests.factories.user_factory import UserFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from events.tests.factories.order_factory import OrderFactory

@pytest.mark.django_db
def test_admin_user_detail_serializer_basic():
    """
    Test basic serialization of user fields.
    """
    user = UserFactory()
    serializer = AdminUserDetailSerializer(user)
    data = serializer.data
    assert data['email'] == user.email
    assert data['role'] == 'customer'
    assert data['referred_by'] is None
    assert data['orders'] == []


@pytest.mark.django_db
def test_admin_user_detail_serializer_matches_orders_by_email():
    """
    Orders have no FK to User, so they are matched back to an account on the
    customer_email snapshotted at checkout — case-insensitively.
    """
    user = UserFactory(email='buyer@example.com')
    mine = OrderFactory(customer_email='BUYER@example.com', billing_mode='recurring')
    OrderFactory(customer_email='someone.else@example.com')

    data = AdminUserDetailSerializer(user).data
    assert [o['id'] for o in data['orders']] == [mine.pk]
    assert data['orders'][0]['order_type'] == 'recurring'
    assert data['orders'][0]['status'] == mine.status


@pytest.mark.django_db
def test_admin_user_detail_serializer_orders_newest_first():
    user = UserFactory(email='buyer@example.com')
    older = OrderFactory(customer_email='buyer@example.com')
    newer = OrderFactory(customer_email='buyer@example.com')

    data = AdminUserDetailSerializer(user).data
    assert [o['id'] for o in data['orders']] == [newer.pk, older.pk]

@pytest.mark.django_db
def test_admin_user_detail_serializer_affiliate_role():
    """
    Test that is_partner returns True if user has a partner profile.
    """
    partner = BusinessAccountFactory(account_type='affiliate')
    user = partner.user
    
    serializer = AdminUserDetailSerializer(user)
    data = serializer.data
    assert data['role'] == 'affiliate'

@pytest.mark.django_db
def test_admin_user_detail_serializer_referred_by():
    """
    Test that referred_by returns the partner's business name.
    """
    partner = BusinessAccountFactory(business_name="Test Partner")
    user = UserFactory(referred_by_affiliate=partner)
    
    serializer = AdminUserDetailSerializer(user)
    data = serializer.data
    assert data['referred_by'] == "Test Partner"
