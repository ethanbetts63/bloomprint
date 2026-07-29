import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from events.tests.factories.event_factory import EventFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAdminBusinessAccountDetailView:
    def setup_method(self):
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_detail_view_includes_commissions(self):
        partner = BusinessAccountFactory()
        CommissionFactory(business_account=partner, amount=Decimal('10'), commission_type='referral', status='pending')
        CommissionFactory(business_account=partner, amount=Decimal('100'), commission_type='fulfillment', status='paid')

        response = self.client.get(f'/api/business-accounts/admin/{partner.id}/')

        assert response.status_code == 200
        commissions = response.data['commissions']
        assert len(commissions) == 2
        types = {c['commission_type'] for c in commissions}
        assert types == {'referral', 'fulfillment'}

    def test_detail_view_includes_stripe_fields(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_abc',
            stripe_connect_onboarding_complete=True,
        )

        response = self.client.get(f'/api/business-accounts/admin/{partner.id}/')

        assert response.status_code == 200
        assert response.data['stripe_connect_account_id'] == 'acct_abc'
        assert response.data['stripe_connect_onboarding_complete'] is True

    def test_detail_view_requires_admin(self):
        non_admin = UserFactory(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        partner = BusinessAccountFactory()

        response = client.get(f'/api/business-accounts/admin/{partner.id}/')
        assert response.status_code == 403

    def test_detail_view_not_found(self):
        response = self.client.get('/api/business-accounts/admin/99999/')
        assert response.status_code == 404

    def test_detail_view_commission_fields(self):
        partner = BusinessAccountFactory()
        event = EventFactory()
        CommissionFactory(
            business_account=partner,
            amount=Decimal('15'),
            commission_type='referral',
            status='pending',
            event=event,
        )

        response = self.client.get(f'/api/business-accounts/admin/{partner.id}/')
        commission = response.data['commissions'][0]

        assert 'id' in commission
        assert 'commission_type' in commission
        assert 'amount' in commission
        assert 'status' in commission
        assert 'created_at' in commission
        assert commission['event'] == event.id
