import pytest
from decimal import Decimal
from partners.serializers.partner_dashboard_serializer import PartnerDashboardSerializer
from partners.tests.factories.partner_factory import PartnerFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.payout_factory import PayoutFactory
from partners.models import Partner


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

    def test_recent_commissions_included(self):
        partner = PartnerFactory()
        CommissionFactory(partner=partner, commission_type='referral')
        data = PartnerDashboardSerializer(partner).data
        assert len(data['recent_commissions']) == 1

    def test_delivery_requests_empty_for_non_delivery_partner(self):
        partner = PartnerFactory(partner_type='non_delivery')
        data = PartnerDashboardSerializer(partner).data
        assert data['delivery_requests'] == []

    def test_delivery_requests_included_for_delivery_partner(self):
        partner = PartnerFactory(partner_type='delivery')
        DeliveryRequestFactory(partner=partner)
        data = PartnerDashboardSerializer(partner).data
        assert len(data['delivery_requests']) == 1

    def test_discount_codes_included_when_exist(self):
        partner = PartnerFactory()
        dc = DiscountCodeFactory(partner=partner)
        partner = Partner.objects.get(pk=partner.pk)
        data = PartnerDashboardSerializer(partner).data
        assert len(data['discount_codes']) == 1
        assert data['discount_codes'][0]['code'] == dc.code

    def test_discount_codes_empty_when_none_exist(self):
        partner = PartnerFactory()
        data = PartnerDashboardSerializer(partner).data
        assert data['discount_codes'] == []

    def test_discount_codes_hidden_for_delivery_partner(self):
        partner = PartnerFactory(partner_type='delivery')
        DiscountCodeFactory(partner=partner)

        data = PartnerDashboardSerializer(partner).data

        assert data['discount_codes'] == []

    def test_discount_codes_multiple(self):
        partner = PartnerFactory()
        DiscountCodeFactory(partner=partner, code='code-one-5')
        DiscountCodeFactory(partner=partner, code='code-two-5')
        partner = Partner.objects.get(pk=partner.pk)
        data = PartnerDashboardSerializer(partner).data
        assert len(data['discount_codes']) == 2

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
