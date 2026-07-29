import pytest
from rest_framework.test import APIClient
from partners.models import BusinessAccount
from users.models import User

@pytest.mark.django_db
class TestBusinessAccountRegistrationView:
    def setup_method(self):
        self.client = APIClient()
        self.url = '/api/business-accounts/register/'

    def test_partner_registration_success(self):
        data = {
            "email": "newpartner@example.com",
            "password": "strongpassword123",
            "first_name": "Partner",
            "last_name": "One",
            "business_name": "Partner Flowers",
            "phone": "0400000000"
        }
        response = self.client.post(self.url, data, format='json')
        
        assert response.status_code == 201
        assert 'access_token' in response.cookies
        assert response.cookies['access_token']['httponly']
        assert 'access' not in response.data

        user = User.objects.get(email="newpartner@example.com")
        assert user.first_name == "Partner"
        
        partner = BusinessAccount.objects.get(user=user)
        assert partner.business_name == "Partner Flowers"
        assert partner.status == 'pending'

    def test_partner_registration_does_not_create_stripe_connect_account(self, mocker):
        mock_account = mocker.patch('stripe.Account.create')

        data = {
            "email": "stripetest@example.com",
            "password": "strongpassword123",
            "first_name": "Stripe",
            "last_name": "Test",
            "business_name": "Stripe Flowers",
            "phone": "0400000001",
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == 201
        user = User.objects.get(email="stripetest@example.com")
        partner = BusinessAccount.objects.get(user=user)
        assert partner.stripe_connect_account_id is None
        mock_account.assert_not_called()

    def test_partner_registration_duplicate_email(self):
        from users.tests.factories.user_factory import UserFactory
        UserFactory(email="existing@example.com")
        
        data = {
            "email": "existing@example.com",
            "password": "password123",
            "first_name": "P", "last_name": "O",
            "business_name": "B", "phone": "1"
        }
        response = self.client.post(self.url, data, format='json')
        assert response.status_code == 400
        assert "email" in response.data
