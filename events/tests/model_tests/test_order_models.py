from decimal import Decimal

import pytest
from events.tests.factories.order_factory import OrderFactory
from events.models import Order

@pytest.mark.django_db
class TestOrderModels:
    def test_order_stores_customer_details_directly(self):
        from django.utils import timezone
        order = OrderFactory(
            customer_email='buyer@example.com',
            customer_first_name='Buyer',
            customer_last_name='Person',
            stripe_customer_id='cus_test123',
            terms_accepted_at=timezone.now(),
        )
        order.refresh_from_db()
        assert order.customer_email == 'buyer@example.com'
        assert order.customer_first_name == 'Buyer'
        assert order.customer_last_name == 'Person'
        assert order.stripe_customer_id == 'cus_test123'
        assert order.terms_accepted_at is not None

    def test_one_time_order_creation(self):
        plan = OrderFactory(billing_mode='one_time', budget=100)
        assert plan.status == 'pending_payment'
        assert plan.billing_mode == 'one_time'
        assert plan.budget == 100
        assert isinstance(plan, Order)

    def test_recurring_order_creation(self, settings):
        settings.DELIVERY_INCLUDED_THRESHOLD = 100
        settings.DELIVERY_FEE = 20
        plan = OrderFactory(billing_mode='recurring', budget=80)
        assert plan.status == 'pending_payment'
        assert plan.billing_mode == 'recurring'
        assert plan.delivery_fee == 20
        assert plan.total_amount == 100

    def test_budget_at_threshold_has_delivery_included(self):
        plan = OrderFactory(billing_mode='one_time', budget=100)
        assert plan.delivery_fee == 0
        assert plan.total_amount == 100

    def test_a_budget_assigned_as_a_float_still_prices_correctly(self):
        """
        A DecimalField does not coerce until it is written, so a budget assigned
        as a float reaches save() as a float and used to crash the money
        arithmetic with "unsupported operand type(s) for +: 'float' and 'Decimal'".
        """
        plan = OrderFactory(billing_mode='one_time', budget=80.00)

        assert plan.budget == Decimal('80.00')
        assert plan.total_amount == plan.budget + plan.delivery_fee

    def test_a_paid_order_is_not_repriced_when_the_fee_setting_changes(self, settings):
        """
        The stored price is the record of what was charged. Activation saves the
        order again, so a later DELIVERY_FEE change must not rewrite history.
        """
        settings.DELIVERY_INCLUDED_THRESHOLD = 100
        settings.DELIVERY_FEE = 20
        plan = OrderFactory(billing_mode='one_time', budget=80)
        assert plan.total_amount == Decimal('100.00')

        plan.status = 'active'
        plan.save()

        settings.DELIVERY_FEE = 40
        plan.save()
        plan.refresh_from_db()

        assert plan.delivery_fee == Decimal('20.00')
        assert plan.total_amount == Decimal('100.00')

    def test_a_draft_still_reprices_when_the_fee_setting_changes(self, settings):
        settings.DELIVERY_INCLUDED_THRESHOLD = 100
        settings.DELIVERY_FEE = 20
        plan = OrderFactory(billing_mode='one_time', budget=80)

        settings.DELIVERY_FEE = 40
        plan.save()
        plan.refresh_from_db()

        assert plan.delivery_fee == Decimal('40.00')
        assert plan.total_amount == Decimal('120.00')

    def test_order_str_representation(self):
        plan = OrderFactory(billing_mode='one_time')
        assert str(plan) == f"Order {plan.id} (one_time) for {plan.user.username}"
