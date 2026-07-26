import pytest
from rest_framework.test import APIClient
from partners.tests.factories.partner_factory import PartnerFactory
from partners.tests.factories.payout_factory import PayoutFactory, PayoutLineItemFactory
from users.tests.factories.user_factory import UserFactory

@pytest.mark.django_db
class TestPayoutViews:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_payout_list_success(self):
        partner = PartnerFactory(user=self.user)
        PayoutFactory(partner=partner, amount=Decimal('100.00'))
        PayoutFactory(partner=partner, amount=Decimal('200.00'))
        
        response = self.client.get('/api/partners/payouts/')
        assert response.status_code == 200
        assert response.data['count'] == 2
        assert len(response.data['results']) == 2

    def test_payout_list_filters_searches_and_orders_on_server(self):
        partner = PartnerFactory(user=self.user)
        matching = PayoutFactory(partner=partner, payout_type='commission', status='completed', note='July referral', amount=Decimal('150.00'))
        PayoutFactory(partner=partner, payout_type='fulfillment', status='pending', note='Other')

        response = self.client.get('/api/partners/payouts/?status=completed&payout_type=commission&search=july&ordering=amount')

        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['id'] == matching.id

    def test_payout_detail_success(self):
        partner = PartnerFactory(user=self.user)
        payout = PayoutFactory(partner=partner, amount=Decimal('150.00'))
        li = PayoutLineItemFactory(payout=payout, amount=Decimal('150.00'))
        
        response = self.client.get(f'/api/partners/payouts/{payout.id}/')
        assert response.status_code == 200
        assert response.data['amount'] == '150.00'
        assert len(response.data['line_items']) == 1

    def test_payout_detail_other_partner_fails(self):
        partner = PartnerFactory(user=self.user)
        other_partner = PartnerFactory()
        payout = PayoutFactory(partner=other_partner)
        
        response = self.client.get(f'/api/partners/payouts/{payout.id}/')
        assert response.status_code == 404

from decimal import Decimal
