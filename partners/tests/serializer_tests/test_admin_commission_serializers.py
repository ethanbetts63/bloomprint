import pytest
from decimal import Decimal
from partners.serializers.admin_commission_list_serializer import AdminCommissionListSerializer
from partners.serializers.admin_commission_detail_serializer import AdminCommissionDetailSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from events.tests.factories.event_factory import EventFactory


@pytest.mark.django_db
class TestAdminCommissionListSerializer:

    def test_includes_expected_fields(self):
        commission = CommissionFactory()
        data = AdminCommissionListSerializer(commission).data

        for field in ('id', 'commission_type', 'amount', 'status', 'note',
                      'created_at', 'event', 'business_account_name', 'business_account_id', 'account_type'):
            assert field in data, f"Missing field: {field}"

    def test_business_account_name_uses_business_name(self):
        partner = BusinessAccountFactory(business_name='Rose Garden')
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionListSerializer(commission).data

        assert data['business_account_name'] == 'Rose Garden'

    def test_business_account_name_falls_back_to_full_name(self):
        partner = BusinessAccountFactory(business_name='')
        partner.user.first_name = 'Alice'
        partner.user.last_name = 'Wong'
        partner.user.save()
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionListSerializer(commission).data

        assert data['business_account_name'] == 'Alice Wong'

    def test_business_account_name_falls_back_to_email_when_no_name(self):
        partner = BusinessAccountFactory(business_name='')
        partner.user.first_name = ''
        partner.user.last_name = ''
        partner.user.save()
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionListSerializer(commission).data

        assert data['business_account_name'] == partner.user.email

    def test_business_account_id_and_type_correct(self):
        partner = BusinessAccountFactory(account_type='florist')
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionListSerializer(commission).data

        assert data['business_account_id'] == partner.id
        assert data['account_type'] == 'florist'

    def test_event_field_is_none_when_no_event(self):
        commission = CommissionFactory(event=None)

        data = AdminCommissionListSerializer(commission).data

        assert data['event'] is None

    def test_event_field_contains_id_when_event_exists(self):
        event = EventFactory()
        commission = CommissionFactory(event=event)

        data = AdminCommissionListSerializer(commission).data

        assert data['event'] == event.id


@pytest.mark.django_db
class TestAdminCommissionDetailSerializer:

    def test_includes_all_list_fields_plus_stripe_fields(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_detail_test',
            stripe_connect_onboarding_complete=True,
        )
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionDetailSerializer(commission).data

        for field in ('id', 'commission_type', 'amount', 'status', 'note', 'created_at',
                      'event', 'business_account_name', 'business_account_id', 'account_type',
                      'stripe_connect_onboarding_complete', 'stripe_connect_account_id'):
            assert field in data, f"Missing field: {field}"

    def test_stripe_fields_reflect_partner_values(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_xyz',
            stripe_connect_onboarding_complete=True,
        )
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionDetailSerializer(commission).data

        assert data['stripe_connect_account_id'] == 'acct_xyz'
        assert data['stripe_connect_onboarding_complete'] is True

    def test_stripe_onboarding_false_when_incomplete(self):
        partner = BusinessAccountFactory(stripe_connect_onboarding_complete=False)
        commission = CommissionFactory(business_account=partner)

        data = AdminCommissionDetailSerializer(commission).data

        assert data['stripe_connect_onboarding_complete'] is False

    def test_stripe_account_id_null_when_not_set(self):
        partner = BusinessAccountFactory(stripe_connect_account_id=None)
        commission = CommissionFactory(business_account=partner, payment=None)

        data = AdminCommissionDetailSerializer(commission).data

        assert data['stripe_connect_account_id'] is None
