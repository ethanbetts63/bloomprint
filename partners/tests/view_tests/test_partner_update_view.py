import pytest
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from users.tests.factories.user_factory import UserFactory

@pytest.mark.django_db
class TestBusinessAccountUpdateView:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.url = '/api/business-accounts/update/'

    def test_update_success(self):
        partner = BusinessAccountFactory(user=self.user, business_name="Old Name")
        data = {"business_name": "New Name", "city": "Sydney"}
        response = self.client.patch(self.url, data, format='json')
        
        assert response.status_code == 200
        partner.refresh_from_db()
        assert partner.business_name == "New Name"
        assert partner.city == "Sydney"

