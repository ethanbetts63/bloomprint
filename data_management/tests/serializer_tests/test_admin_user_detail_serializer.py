import pytest
from decimal import Decimal
from data_management.serializers.admin_user_detail_serializer import AdminUserDetailSerializer
from users.tests.factories.user_factory import UserFactory
from partners.tests.factories.partner_factory import PartnerFactory
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
    assert data['is_partner'] is False
    assert data['referred_by'] is None
    assert data['plans'] == []

@pytest.mark.django_db
def test_admin_user_detail_serializer_is_partner():
    """
    Test that is_partner returns True if user has a partner profile.
    """
    partner = PartnerFactory()
    user = partner.user
    
    serializer = AdminUserDetailSerializer(user)
    data = serializer.data
    assert data['is_partner'] is True

@pytest.mark.django_db
def test_admin_user_detail_serializer_referred_by():
    """
    Test that referred_by returns the partner's business name.
    """
    partner = PartnerFactory(business_name="Test Partner")
    user = UserFactory(referred_by_partner=partner)
    
    serializer = AdminUserDetailSerializer(user)
    data = serializer.data
    assert data['referred_by'] == "Test Partner"
