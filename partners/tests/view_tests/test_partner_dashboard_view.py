import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from users.tests.factories.user_factory import UserFactory

@pytest.mark.django_db
class TestBusinessAccountDashboardView:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.url = '/api/business-accounts/dashboard/'

    def test_dashboard_success(self):
        partner = BusinessAccountFactory(user=self.user, business_name="My Flower Shop")
        DiscountCodeFactory(business_account=partner, code="MYSHOP5")
        CommissionFactory(business_account=partner, amount=Decimal('10.00'), status='pending')
        CommissionFactory(business_account=partner, amount=Decimal('20.00'), status='paid')
        
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert response.data['business_name'] == "My Flower Shop"
        assert response.data['discount_code_summary']['active_codes'] == 1
        assert Decimal(response.data['commission_summary']['total_earned']) == Decimal('30.00')

    def test_dashboard_without_business_account_fails(self):
        # User is authenticated but has no florist or affiliate account.
        response = self.client.get(self.url)
        assert response.status_code == 404
        assert response.data['error'] == "No florist or affiliate account was found."

from decimal import Decimal
