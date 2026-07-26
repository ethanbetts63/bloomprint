import pytest
from users.serializers.user_profile_serializer import UserProfileSerializer
from users.tests.factories.user_factory import UserFactory

@pytest.mark.django_db
def test_user_profile_serializer():
    """
    Tests that the UserProfileSerializer correctly serializes a User object.
    """
    user = UserFactory()
    serializer = UserProfileSerializer(instance=user)

    expected_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': False,
        'is_superuser': False,
        'is_partner': False,
        'role': 'customer',
        }
    assert serializer.data == expected_data


@pytest.mark.django_db
def test_user_profile_serializer_is_partner_true():
    """
    Tests that is_partner returns True if the user has a partner profile.
    """
    from partners.tests.factories.partner_factory import PartnerFactory
    partner = PartnerFactory()
    user = partner.user

    serializer = UserProfileSerializer(instance=user)
    assert serializer.data['is_partner'] is True


@pytest.mark.django_db
def test_role_is_admin_for_staff():
    user = UserFactory(is_staff=True)
    assert UserProfileSerializer(instance=user).data['role'] == 'admin'


@pytest.mark.django_db
def test_role_is_admin_for_superuser():
    user = UserFactory(is_superuser=True)
    assert UserProfileSerializer(instance=user).data['role'] == 'admin'


@pytest.mark.django_db
def test_role_is_florist_for_delivery_partner():
    from partners.tests.factories.partner_factory import PartnerFactory
    partner = PartnerFactory(partner_type='delivery')
    assert UserProfileSerializer(instance=partner.user).data['role'] == 'florist'


@pytest.mark.django_db
def test_role_is_affiliate_for_non_delivery_partner():
    from partners.tests.factories.partner_factory import PartnerFactory
    partner = PartnerFactory(partner_type='non_delivery')
    assert UserProfileSerializer(instance=partner.user).data['role'] == 'affiliate'


@pytest.mark.django_db
def test_role_is_customer_for_plain_user():
    user = UserFactory()
    assert UserProfileSerializer(instance=user).data['role'] == 'customer'


@pytest.mark.django_db
def test_role_prefers_admin_over_partner():
    """A staff member who also has a partner profile is treated as admin."""
    from partners.tests.factories.partner_factory import PartnerFactory
    partner = PartnerFactory(partner_type='delivery')
    partner.user.is_staff = True
    partner.user.save()
    assert UserProfileSerializer(instance=partner.user).data['role'] == 'admin'
