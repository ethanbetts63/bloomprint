import pytest
from unittest.mock import patch, MagicMock
from partners.serializers.business_account_registration_serializer import BusinessAccountRegistrationSerializer
from partners.models import BusinessAccount, DiscountCode
from users.tests.factories.user_factory import UserFactory
from django.contrib.auth import get_user_model

User = get_user_model()


def _valid_data(**overrides):
    data = {
        'email': 'newpartner@example.com',
        'password': 'securepassword123',
        'first_name': 'Test',
        'last_name': 'Partner',
        'business_name': 'My Flower Shop',
        'phone': '+15551234567',
        'account_type': 'affiliate',
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
class TestBusinessAccountRegistrationSerializer:

    def test_valid_affiliate_data_is_valid(self):
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id='acct_test')
            serializer = BusinessAccountRegistrationSerializer(data=_valid_data())
            assert serializer.is_valid(), serializer.errors

    def test_duplicate_email_fails_validation(self):
        UserFactory(email='existing@example.com')
        serializer = BusinessAccountRegistrationSerializer(
            data=_valid_data(email='existing@example.com')
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_email_case_insensitive_duplicate_check(self):
        UserFactory(email='existing@example.com')
        serializer = BusinessAccountRegistrationSerializer(
            data=_valid_data(email='EXISTING@example.com')
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_delivery_partner_without_lat_lng_fails(self):
        data = _valid_data(account_type='florist', latitude=None, longitude=None)
        serializer = BusinessAccountRegistrationSerializer(data=data)
        assert not serializer.is_valid()

    def test_delivery_partner_with_lat_lng_is_valid(self):
        data = _valid_data(account_type='florist', latitude=40.7128, longitude=-74.0060)
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id='acct_test')
            serializer = BusinessAccountRegistrationSerializer(data=data)
            assert serializer.is_valid(), serializer.errors

    def test_create_creates_user_and_partner(self):
        data = _valid_data()
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id='acct_test')
            serializer = BusinessAccountRegistrationSerializer(data=data)
            assert serializer.is_valid()
            user = serializer.save()

        assert User.objects.filter(email='newpartner@example.com').exists()
        assert BusinessAccount.objects.filter(user=user).exists()

    def test_create_generates_discount_code(self):
        data = _valid_data(business_name='Code Test Shop')
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id='acct_test')
            serializer = BusinessAccountRegistrationSerializer(data=data)
            assert serializer.is_valid()
            user = serializer.save()

        partner = BusinessAccount.objects.get(user=user)
        assert DiscountCode.objects.filter(business_account=partner).exists()

    def test_florist_registration_creates_no_discount_code(self):
        """Florists earn from fulfilment, not referrals — they get no code."""
        data = _valid_data(
            account_type='florist',
            business_name='Petal Pushers',
            latitude=40.7128,
            longitude=-74.0060,
        )
        serializer = BusinessAccountRegistrationSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()

        partner = BusinessAccount.objects.get(user=user)
        assert partner.account_type == 'florist'
        assert not DiscountCode.objects.filter(business_account=partner).exists()

    def test_create_normalizes_email_to_lowercase(self):
        data = _valid_data(email='TestEmail@Example.COM')
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id='acct_test')
            serializer = BusinessAccountRegistrationSerializer(data=data)
            assert serializer.is_valid()
            user = serializer.save()

        assert user.email == 'testemail@example.com'

    def test_create_stripe_failure_does_not_raise(self):
        data = _valid_data()
        with patch('stripe.Account.create') as mock_stripe:
            mock_stripe.side_effect = Exception('Stripe error')
            serializer = BusinessAccountRegistrationSerializer(data=data)
            assert serializer.is_valid()
            user = serializer.save()

        assert User.objects.filter(email='newpartner@example.com').exists()
