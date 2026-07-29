import pytest
from decimal import Decimal
from partners.serializers.validate_discount_code_serializer import ValidateDiscountCodeSerializer
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


def serializer_for(code):
    """The serializer takes only a code; the caller supplies the order."""
    serializer = ValidateDiscountCodeSerializer(data={'code': code})
    return serializer


@pytest.mark.django_db
class TestValidateDiscountCodeSerializer:

    def test_valid_code_passes_validation(self):
        partner = BusinessAccountFactory(status='active')
        dc = DiscountCodeFactory(business_account=partner, is_active=True)

        serializer = serializer_for(dc.code)

        assert serializer.is_valid(), serializer.errors

    def test_nonexistent_code_fails(self):
        serializer = serializer_for('DOESNOTEXIST')

        assert not serializer.is_valid()
        assert 'code' in serializer.errors

    def test_inactive_code_fails(self):
        dc = DiscountCodeFactory(is_active=False)

        serializer = serializer_for(dc.code)

        assert not serializer.is_valid()

    def test_inactive_partner_code_fails(self):
        partner = BusinessAccountFactory(status='pending')
        dc = DiscountCodeFactory(business_account=partner, is_active=True)

        serializer = serializer_for(dc.code)

        assert not serializer.is_valid()

    def test_empty_code_passes_validation(self):
        serializer = serializer_for('')

        assert serializer.is_valid(), serializer.errors

    def test_apply_discount_sets_discount_on_the_order(self):
        partner = BusinessAccountFactory(status='active')
        dc = DiscountCodeFactory(business_account=partner, is_active=True, discount_amount=Decimal('5.00'))
        order = OrderFactory(billing_mode='one_time', budget=100)

        serializer = serializer_for(dc.code)
        assert serializer.is_valid(), serializer.errors
        result = serializer.apply_discount(order)

        assert result['code'] == dc.code
        assert Decimal(result['discount_amount']) == Decimal('5.00')
        order.refresh_from_db()
        assert order.discount_code == dc
        assert order.discount_amount == Decimal('5.00')

    def test_apply_discount_clears_when_empty_code(self):
        dc = DiscountCodeFactory()
        order = OrderFactory(billing_mode='one_time', budget=100)
        order.discount_code = dc
        order.discount_amount = Decimal('5.00')
        order.save()

        serializer = serializer_for('')
        assert serializer.is_valid(), serializer.errors
        result = serializer.apply_discount(order)

        assert result['code'] is None
        order.refresh_from_db()
        assert order.discount_code is None
        assert order.discount_amount == 0

    def test_apply_discount_attributes_the_order_to_the_partner(self):
        partner = BusinessAccountFactory(status='active')
        dc = DiscountCodeFactory(business_account=partner, is_active=True)
        order = OrderFactory(billing_mode='one_time', budget=100)

        serializer = serializer_for(dc.code)
        assert serializer.is_valid(), serializer.errors
        serializer.apply_discount(order)

        order.refresh_from_db()
        assert order.referred_by_affiliate == partner

    def test_apply_discount_keeps_an_existing_attribution(self):
        first = BusinessAccountFactory(status='active')
        second = BusinessAccountFactory(status='active')
        dc = DiscountCodeFactory(business_account=second, is_active=True)
        order = OrderFactory(billing_mode='one_time', budget=100, referred_by_affiliate=first)

        serializer = serializer_for(dc.code)
        assert serializer.is_valid(), serializer.errors
        serializer.apply_discount(order)

        order.refresh_from_db()
        assert order.referred_by_affiliate == first

    def test_apply_discount_works_for_a_recurring_order(self):
        partner = BusinessAccountFactory(status='active')
        dc = DiscountCodeFactory(business_account=partner, is_active=True, discount_amount=Decimal('5.00'))
        order = OrderFactory(billing_mode='recurring', budget=100)

        serializer = serializer_for(dc.code)
        assert serializer.is_valid(), serializer.errors
        result = serializer.apply_discount(order)

        assert Decimal(result['discount_amount']) == Decimal('5.00')
