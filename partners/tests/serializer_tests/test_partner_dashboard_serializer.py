import pytest
from decimal import Decimal
from partners.serializers.partner_dashboard_serializer import PartnerDashboardSerializer
from partners.tests.factories.partner_factory import PartnerFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from partners.tests.factories.payout_factory import PayoutFactory


@pytest.mark.django_db
class TestPartnerDashboardSerializer:

    def test_commission_summary_all_zeros_for_new_partner(self):
        partner = PartnerFactory()
        data = PartnerDashboardSerializer(partner).data
        summary = data['commission_summary']
        assert Decimal(summary['total_earned']) == 0
        assert Decimal(summary['total_pending']) == 0
        assert Decimal(summary['total_paid']) == 0

    def test_commission_summary_totals_earned(self):
        partner = PartnerFactory()
        CommissionFactory(partner=partner, amount=Decimal('10.00'), status='pending')
        CommissionFactory(partner=partner, amount=Decimal('20.00'), status='paid')
        data = PartnerDashboardSerializer(partner).data
        summary = data['commission_summary']
        assert Decimal(summary['total_earned']) == Decimal('30.00')
        assert Decimal(summary['total_pending']) == Decimal('10.00')
        assert Decimal(summary['total_paid']) == Decimal('20.00')

    def test_payload_is_summary_only_and_uses_explicit_account_type(self):
        partner = PartnerFactory(partner_type='delivery')
        data = PartnerDashboardSerializer(partner).data
        assert data['account_type'] == 'florist'
        assert 'partner_type' not in data
        assert 'recent_commissions' not in data
        assert 'delivery_requests' not in data
        assert 'discount_codes' not in data

    def test_affiliate_discount_code_summary(self):
        partner = PartnerFactory(partner_type='non_delivery')
        DiscountCodeFactory(partner=partner, is_active=True)
        DiscountCodeFactory(partner=partner, is_active=False)
        data = PartnerDashboardSerializer(partner).data
        assert data['account_type'] == 'affiliate'
        assert data['discount_code_summary']['active_codes'] == 1

    def test_payout_summary_zeros_for_new_partner(self):
        partner = PartnerFactory()
        data = PartnerDashboardSerializer(partner).data
        summary = data['payout_summary']
        assert Decimal(summary['total_paid']) == 0
        assert Decimal(summary['total_pending']) == 0

    def test_payout_summary_counts_completed(self):
        partner = PartnerFactory()
        PayoutFactory(partner=partner, amount=Decimal('100.00'), status='completed')
        data = PartnerDashboardSerializer(partner).data
        assert Decimal(data['payout_summary']['total_paid']) == Decimal('100.00')

    def test_payout_summary_counts_pending(self):
        partner = PartnerFactory()
        PayoutFactory(partner=partner, amount=Decimal('50.00'), status='pending')
        data = PartnerDashboardSerializer(partner).data
        assert Decimal(data['payout_summary']['total_pending']) == Decimal('50.00')

    def test_stripe_connect_field_included(self):
        partner = PartnerFactory()
        data = PartnerDashboardSerializer(partner).data
        assert 'stripe_connect_onboarding_complete' in data
