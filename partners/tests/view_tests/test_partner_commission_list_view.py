import pytest
from rest_framework.test import APIClient

from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.partner_factory import PartnerFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestPartnerCommissionListView:
    def setup_method(self):
        self.client = APIClient()

    def test_returns_only_authenticated_partners_commissions(self):
        partner = PartnerFactory()
        other_partner = PartnerFactory()
        older = CommissionFactory(partner=partner)
        newer = CommissionFactory(partner=partner)
        CommissionFactory(partner=other_partner)
        self.client.force_authenticate(user=partner.user)

        response = self.client.get('/api/partners/commissions/')

        assert response.status_code == 200
        assert response.data['count'] == 2
        assert [item['id'] for item in response.data['results']] == [newer.id, older.id]

    def test_filters_searches_and_orders_on_server(self):
        partner = PartnerFactory()
        matching = CommissionFactory(partner=partner, status='approved', amount='12.00', note='Special referral')
        CommissionFactory(partner=partner, status='pending', note='Other')
        self.client.force_authenticate(user=partner.user)

        response = self.client.get('/api/partners/commissions/?status=approved&search=special&ordering=amount')

        assert response.status_code == 200
        assert [item['id'] for item in response.data['results']] == [matching.id]

    def test_non_partner_returns_404(self):
        self.client.force_authenticate(user=UserFactory())

        response = self.client.get('/api/partners/commissions/')

        assert response.status_code == 404
