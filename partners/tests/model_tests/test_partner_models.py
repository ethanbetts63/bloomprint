import pytest
from decimal import Decimal
from django.db import IntegrityError
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.payout_factory import PayoutFactory, PayoutLineItemFactory
from partners.models import (
    BusinessAccount, Commission, DiscountCode, DeliveryRequest,
    Payout, PayoutLineItem,
)

from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestPartnerModel:

    def test_str_with_business_name(self):
        partner = BusinessAccountFactory(business_name='Floral Co')
        assert 'Floral Co' in str(partner)

    def test_str_with_no_business_name_uses_email(self):
        user = UserFactory(email='partner@example.com')
        partner = BusinessAccountFactory(user=user, business_name='')
        assert 'partner@example.com' in str(partner)

    def test_default_account_type_is_affiliate(self):
        partner = BusinessAccountFactory(account_type='affiliate')
        assert partner.account_type == 'affiliate'

    def test_one_to_one_with_user(self):
        partner = BusinessAccountFactory()
        assert partner.user.business_account == partner

    def test_status_choices(self):
        for status in ('pending', 'active', 'suspended', 'denied'):
            p = BusinessAccountFactory(status=status)
            p.refresh_from_db()
            assert p.status == status

    def test_stripe_connect_fields_default_empty(self):
        partner = BusinessAccountFactory()
        assert partner.stripe_connect_account_id is None
        assert partner.stripe_connect_onboarding_complete is False


@pytest.mark.django_db
class TestCommissionModel:

    def test_str_representation(self):
        commission = CommissionFactory(commission_type='referral', amount=Decimal('10.00'))
        s = str(commission)
        assert 'referral' in s
        assert '10' in s

    def test_default_status_is_pending(self):
        commission = CommissionFactory()
        assert commission.status == 'pending'

    def test_commission_type_referral(self):
        c = CommissionFactory(commission_type='referral')
        c.refresh_from_db()
        assert c.commission_type == 'referral'

    def test_commission_type_fulfillment(self):
        c = CommissionFactory(commission_type='fulfillment')
        c.refresh_from_db()
        assert c.commission_type == 'fulfillment'

    def test_event_is_optional(self):
        c = CommissionFactory(event=None)
        c.refresh_from_db()
        assert c.event is None


@pytest.mark.django_db
class TestDeliveryRequestModel:

    def test_token_auto_generated_on_save(self):
        dr = DeliveryRequestFactory()
        assert dr.token
        assert len(dr.token) > 10

    def test_token_not_regenerated_on_update(self):
        dr = DeliveryRequestFactory()
        original_token = dr.token
        dr.status = 'accepted'
        dr.save()
        dr.refresh_from_db()
        assert dr.token == original_token

    def test_str_representation(self):
        dr = DeliveryRequestFactory()
        s = str(dr)
        assert str(dr.id) in s

    def test_default_status_is_accepted(self):
        """A DeliveryRequest only exists because a florist claimed the delivery."""
        dr = DeliveryRequestFactory()
        assert dr.status == 'accepted'

    def test_token_is_unique(self):
        dr1 = DeliveryRequestFactory()
        dr2 = DeliveryRequestFactory()
        assert dr1.token != dr2.token


@pytest.mark.django_db
class TestDiscountCodeModel:

    def test_str_representation(self):
        dc = DiscountCodeFactory(discount_amount=Decimal('5.00'))
        s = str(dc)
        assert dc.code in s
        assert '5' in s

    def test_generate_code_creates_slug_based_code(self):
        code = DiscountCode.generate_code('Test Business')
        assert code
        assert 'TESTBUSINESS' in code

    def test_generate_code_handles_collision(self):
        base_code = DiscountCode.generate_code('Collision Biz')
        DiscountCode.objects.create(code=base_code, is_active=True)
        code2 = DiscountCode.generate_code('Collision Biz')
        assert code2 != base_code
        assert '2' in code2

    def test_generate_code_with_empty_business_name_uses_affiliate(self):
        code = DiscountCode.generate_code('')
        assert code
        assert 'AFFILIATE' in code

    def test_generate_code_ignores_inactive_codes(self):
        base_code = DiscountCode.generate_code('Same Name')
        DiscountCode.objects.create(code=base_code, is_active=False)
        code2 = DiscountCode.generate_code('Same Name')
        assert code2 == base_code

    def test_is_active_defaults_to_true(self):
        dc = DiscountCodeFactory()
        assert dc.is_active is True


@pytest.mark.django_db
class TestPayoutModel:

    def test_str_representation(self):
        payout = PayoutFactory(amount=Decimal('100.00'))
        s = str(payout)
        assert str(payout.id) in s
        assert '100' in s

    def test_default_status_is_pending(self):
        payout = PayoutFactory()
        assert payout.status == 'pending'

    def test_currency_default_is_usd(self):
        payout = PayoutFactory()
        assert payout.currency == 'USD'


@pytest.mark.django_db
class TestPayoutLineItemModel:

    def test_str_representation(self):
        item = PayoutLineItemFactory(amount=Decimal('50.00'))
        s = str(item)
        assert str(item.id) in s
        assert '50' in s

    def test_commission_is_optional(self):
        item = PayoutLineItemFactory(commission=None)
        item.refresh_from_db()
        assert item.commission is None

    def test_delivery_request_is_optional(self):
        item = PayoutLineItemFactory(delivery_request=None)
        item.refresh_from_db()
        assert item.delivery_request is None


