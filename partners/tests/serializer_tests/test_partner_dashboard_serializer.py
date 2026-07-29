import pytest
from decimal import Decimal
from partners.serializers.business_account_dashboard_serializer import BusinessAccountDashboardSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from partners.tests.factories.payout_factory import PayoutFactory


@pytest.mark.django_db
class TestBusinessAccountDashboardSerializer:

    def test_commission_summary_all_zeros_for_new_partner(self):
        partner = BusinessAccountFactory()
        data = BusinessAccountDashboardSerializer(partner).data
        summary = data['commission_summary']
        assert Decimal(summary['total_earned']) == 0
        assert Decimal(summary['total_pending']) == 0
        assert Decimal(summary['total_paid']) == 0

    def test_commission_summary_totals_earned(self):
        partner = BusinessAccountFactory()
        CommissionFactory(business_account=partner, amount=Decimal('10.00'), status='pending')
        CommissionFactory(business_account=partner, amount=Decimal('20.00'), status='paid')
        data = BusinessAccountDashboardSerializer(partner).data
        summary = data['commission_summary']
        assert Decimal(summary['total_earned']) == Decimal('30.00')
        assert Decimal(summary['total_pending']) == Decimal('10.00')
        assert Decimal(summary['total_paid']) == Decimal('20.00')

    def test_payload_is_summary_only_and_uses_explicit_account_type(self):
        partner = BusinessAccountFactory(account_type='florist')
        data = BusinessAccountDashboardSerializer(partner).data
        assert data['account_type'] == 'florist'
        assert 'partner_type' not in data
        assert 'recent_commissions' not in data
        assert 'delivery_requests' not in data
        assert 'discount_codes' not in data

    def test_affiliate_discount_code_summary(self):
        partner = BusinessAccountFactory(account_type='affiliate')
        DiscountCodeFactory(business_account=partner, is_active=True)
        DiscountCodeFactory(business_account=partner, is_active=False)
        data = BusinessAccountDashboardSerializer(partner).data
        assert data['account_type'] == 'affiliate'
        assert data['discount_code_summary']['active_codes'] == 1

    def test_payout_summary_zeros_for_new_partner(self):
        partner = BusinessAccountFactory()
        data = BusinessAccountDashboardSerializer(partner).data
        summary = data['payout_summary']
        assert Decimal(summary['total_paid']) == 0
        assert Decimal(summary['total_pending']) == 0

    def test_payout_summary_counts_completed(self):
        partner = BusinessAccountFactory()
        PayoutFactory(business_account=partner, amount=Decimal('100.00'), status='completed')
        data = BusinessAccountDashboardSerializer(partner).data
        assert Decimal(data['payout_summary']['total_paid']) == Decimal('100.00')

    def test_payout_summary_counts_pending(self):
        partner = BusinessAccountFactory()
        PayoutFactory(business_account=partner, amount=Decimal('50.00'), status='pending')
        data = BusinessAccountDashboardSerializer(partner).data
        assert Decimal(data['payout_summary']['total_pending']) == Decimal('50.00')

    def test_stripe_connect_field_included(self):
        partner = BusinessAccountFactory()
        data = BusinessAccountDashboardSerializer(partner).data
        assert 'stripe_connect_onboarding_complete' in data
