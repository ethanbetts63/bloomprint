import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from events.tests.factories.event_factory import EventFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAdminCommissionDetailView:
    def setup_method(self):
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _url(self, pk):
        return f'/api/business-accounts/admin/commissions/{pk}/'

    def test_returns_commission_detail(self):
        partner = BusinessAccountFactory(business_name='Petal Co')
        commission = CommissionFactory(business_account=partner, amount=Decimal('42'), status='pending')

        response = self.client.get(self._url(commission.id))

        assert response.status_code == 200
        assert response.data['id'] == commission.id
        assert Decimal(response.data['amount']) == Decimal('42')
        assert response.data['status'] == 'pending'

    def test_includes_partner_fields(self):
        partner = BusinessAccountFactory(
            business_name='Bloom House',
            account_type='florist',
            stripe_connect_account_id='acct_detail',
            stripe_connect_onboarding_complete=True,
        )
        commission = CommissionFactory(business_account=partner)

        response = self.client.get(self._url(commission.id))

        assert response.data['business_account_name'] == 'Bloom House'
        assert response.data['business_account_id'] == partner.id
        assert response.data['account_type'] == 'florist'
        assert response.data['stripe_connect_account_id'] == 'acct_detail'
        assert response.data['stripe_connect_onboarding_complete'] is True

    def test_includes_event_id(self):
        event = EventFactory()
        commission = CommissionFactory(event=event)

        response = self.client.get(self._url(commission.id))

        assert response.data['event'] == event.id

    def test_not_found_returns_404(self):
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        commission = CommissionFactory()

        response = client.get(self._url(commission.id))

        assert response.status_code == 403

    def test_requires_authentication(self):
        commission = CommissionFactory()
        client = APIClient()

        response = client.get(self._url(commission.id))

        assert response.status_code == 401

    def test_stripe_onboarding_false_when_not_complete(self):
        partner = BusinessAccountFactory(stripe_connect_onboarding_complete=False)
        commission = CommissionFactory(business_account=partner)

        response = self.client.get(self._url(commission.id))

        assert response.data['stripe_connect_onboarding_complete'] is False
