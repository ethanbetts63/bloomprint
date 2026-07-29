import pytest
from decimal import Decimal
from partners.serializers.admin_business_account_detail_serializer import AdminBusinessAccountDetailSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from events.tests.factories.event_factory import EventFactory


@pytest.mark.django_db
class TestAdminBusinessAccountDetailSerializer:

    def test_includes_commissions_list(self):
        partner = BusinessAccountFactory()
        CommissionFactory(business_account=partner, amount=Decimal('10'), commission_type='referral')
        CommissionFactory(business_account=partner, amount=Decimal('50'), commission_type='fulfillment')

        data = AdminBusinessAccountDetailSerializer(partner).data

        assert 'commissions' in data
        assert len(data['commissions']) == 2

    def test_commission_fields_present(self):
        partner = BusinessAccountFactory()
        event = EventFactory()
        CommissionFactory(
            business_account=partner,
            amount=Decimal('15'),
            commission_type='referral',
            status='pending',
            event=event,
        )

        data = AdminBusinessAccountDetailSerializer(partner).data
        commission = data['commissions'][0]

        assert commission['commission_type'] == 'referral'
        assert Decimal(commission['amount']) == Decimal('15')
        assert commission['status'] == 'pending'
        assert commission['event'] == event.id
        assert 'id' in commission
        assert 'created_at' in commission

    def test_includes_stripe_connect_fields(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_xyz',
            stripe_connect_onboarding_complete=True,
        )

        data = AdminBusinessAccountDetailSerializer(partner).data

        assert data['stripe_connect_account_id'] == 'acct_xyz'
        assert data['stripe_connect_onboarding_complete'] is True

    def test_empty_commissions_when_none_exist(self):
        partner = BusinessAccountFactory()

        data = AdminBusinessAccountDetailSerializer(partner).data

        assert data['commissions'] == []

    def test_includes_user_fields(self):
        partner = BusinessAccountFactory()

        data = AdminBusinessAccountDetailSerializer(partner).data

        assert data['email'] == partner.user.email
        assert data['first_name'] == partner.user.first_name
        assert data['last_name'] == partner.user.last_name
