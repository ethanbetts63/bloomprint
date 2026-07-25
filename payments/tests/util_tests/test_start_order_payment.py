from decimal import Decimal

import pytest
import stripe

from events.tests.factories.order_factory import OrderFactory
from users.tests.factories.user_factory import UserFactory
from payments.models import Payment
from payments.utils.checkout import (
    start_order_payment,
    validate_order_ready_for_payment,
)


@pytest.fixture
def stripe_intent(mocker):
    intent = mocker.Mock(id='pi_test_123', client_secret='pi_test_123_secret')
    return mocker.patch.object(stripe.PaymentIntent, 'create', return_value=intent)


@pytest.fixture
def stripe_product(mocker):
    return mocker.patch.object(stripe.Product, 'create', return_value=mocker.Mock(id='prod_test_123'))


@pytest.fixture
def stripe_subscription(stripe_product, mocker):
    subscription = mocker.Mock(
        id='sub_test_123',
        latest_invoice=mocker.Mock(
            confirmation_secret=mocker.Mock(client_secret='pi_sub_123_secret_xyz'),
        ),
    )
    return mocker.patch.object(stripe.Subscription, 'create', return_value=subscription)


@pytest.fixture(autouse=True)
def no_stripe_customer_call(mocker):
    mocker.patch(
        'payments.utils.checkout.ensure_stripe_customer',
        side_effect=lambda order: setattr(order, 'stripe_customer_id', 'cus_test_123'),
    )


@pytest.fixture(autouse=True)
def fake_product_cache(mocker):
    store = {}
    fake_cache = mocker.Mock()
    fake_cache.get.side_effect = store.get
    fake_cache.set.side_effect = lambda key, value, timeout=None: store.__setitem__(key, value)
    mocker.patch('payments.utils.checkout.cache', fake_cache)
    return fake_cache


@pytest.mark.django_db
class TestValidateOrderReadyForPayment:

    def test_zero_total_is_rejected(self):
        order = OrderFactory(budget=None)
        order.total_amount = Decimal('0')
        assert validate_order_ready_for_payment(order) == 'Order amount must be greater than zero.'

    def test_missing_total_is_rejected(self):
        order = OrderFactory(budget=None)
        order.total_amount = None
        assert validate_order_ready_for_payment(order) == 'Order amount must be greater than zero.'

    def test_recurring_without_a_frequency_is_rejected(self):
        order = OrderFactory(billing_mode='recurring', budget=Decimal('80.00'), frequency=None)
        assert validate_order_ready_for_payment(order) == 'Subscription details are incomplete.'

    def test_a_complete_one_off_order_is_ready(self):
        order = OrderFactory(budget=Decimal('80.00'))
        assert validate_order_ready_for_payment(order) is None


@pytest.mark.django_db
class TestStartOrderPayment:

    def test_returns_the_client_secret(self, stripe_intent):
        order = OrderFactory(budget=Decimal('80.00'))
        assert start_order_payment(order) == 'pi_test_123_secret'

    def test_records_a_payment_matching_what_stripe_is_charged(self, stripe_intent):
        order = OrderFactory(budget=Decimal('80.00'))
        start_order_payment(order)

        charged_cents = stripe_intent.call_args.kwargs['amount']
        payment = Payment.objects.get(order=order)

        assert Decimal(charged_cents) == payment.amount * 100
        assert payment.status == 'pending'
        assert payment.stripe_payment_intent_id == 'pi_test_123'

    def test_one_off_orders_do_not_save_the_card(self, stripe_intent):
        order = OrderFactory(billing_mode='one_time', budget=Decimal('80.00'))
        start_order_payment(order)
        assert 'setup_future_usage' not in stripe_intent.call_args.kwargs

    def test_the_order_is_identifiable_from_stripe_metadata(self, stripe_intent):
        order = OrderFactory(budget=Decimal('80.00'))
        start_order_payment(order)

        metadata = stripe_intent.call_args.kwargs['metadata']
        assert metadata['order_id'] == str(order.id)
        assert metadata['billing_mode'] == order.billing_mode

    def test_staff_are_charged_the_order_total_like_anyone_else(self, stripe_intent):
        staff = UserFactory(is_staff=True, is_superuser=True)
        order = OrderFactory(budget=Decimal('500.00'))
        start_order_payment(order)

        assert stripe_intent.call_args.kwargs['amount'] == 50000
        assert Payment.objects.get(order=order).amount == Decimal('500.00')

    def test_a_pending_intent_of_the_same_amount_is_reused(self, stripe_intent, mocker):
        mocker.patch(
            'payments.utils.checkout.reuse_or_cancel_pending_payment_intent',
            return_value='pi_existing_secret',
        )
        order = OrderFactory(budget=Decimal('80.00'))

        assert start_order_payment(order) == 'pi_existing_secret'
        stripe_intent.assert_not_called()
        assert not Payment.objects.filter(order=order).exists()


def _recurring_order(**overrides):
    from datetime import date, timedelta

    defaults = dict(
        billing_mode='recurring',
        budget=Decimal('80.00'),
        frequency='monthly',
        start_date=date.today() + timedelta(days=30),
    )
    defaults.update(overrides)
    return OrderFactory(**defaults)


def _order_with_discount(amount='5.00', **overrides):
    from partners.models import DiscountCode

    order = _recurring_order(**overrides)
    order.discount_code = DiscountCode.objects.create(
        code='TESTCODE', discount_amount=Decimal(amount)
    )
    order.discount_amount = Decimal(amount)
    order.save()
    return order


@pytest.mark.django_db
class TestStartSubscriptionPayment:

    def test_returns_the_first_invoice_client_secret(self, stripe_subscription, stripe_intent):
        order = _recurring_order()
        assert start_order_payment(order) == 'pi_sub_123_secret_xyz'
        stripe_intent.assert_not_called()

    def test_subscription_id_is_saved_on_the_order(self, stripe_subscription):
        order = _recurring_order()
        start_order_payment(order)
        order.refresh_from_db()
        assert order.stripe_subscription_id == 'sub_test_123'

    def test_first_delivery_is_invoiced_immediately_despite_the_trial(self, stripe_subscription):
        order = _recurring_order()
        start_order_payment(order)

        kwargs = stripe_subscription.call_args.kwargs
        assert kwargs['add_invoice_items'][0]['price_data']['unit_amount'] == int(order.total_amount * 100)
        assert kwargs['trial_end'] > 0
        assert kwargs['payment_behavior'] == 'default_incomplete'

    def test_the_subscription_product_is_created_only_once(self, stripe_subscription, stripe_product, mocker):
        stripe_subscription.side_effect = [
            mocker.Mock(
                id='sub_test_1',
                latest_invoice=mocker.Mock(confirmation_secret=mocker.Mock(client_secret='pi_sub_1_secret_a')),
            ),
            mocker.Mock(
                id='sub_test_2',
                latest_invoice=mocker.Mock(confirmation_secret=mocker.Mock(client_secret='pi_sub_2_secret_b')),
            ),
        ]
        start_order_payment(_recurring_order())
        start_order_payment(_recurring_order())
        stripe_product.assert_called_once()

    def test_the_confirmed_card_is_kept_for_future_invoices(self, stripe_subscription):
        order = _recurring_order()
        start_order_payment(order)
        kwargs = stripe_subscription.call_args.kwargs
        assert kwargs['payment_settings'] == {'save_default_payment_method': 'on_subscription'}

    def test_recurring_price_is_the_undiscounted_subtotal(self, stripe_subscription):
        order = _order_with_discount('5.00', budget=Decimal('80.00'))
        start_order_payment(order)

        kwargs = stripe_subscription.call_args.kwargs
        recurring = kwargs['items'][0]['price_data']
        assert recurring['unit_amount'] == int(order.subtotal * 100)
        assert recurring['unit_amount'] > int(order.total_amount * 100)

    def test_discount_reduces_the_first_invoice_directly(self, stripe_subscription):
        order = _order_with_discount('5.00', budget=Decimal('80.00'))
        start_order_payment(order)

        kwargs = stripe_subscription.call_args.kwargs
        first_invoice = kwargs['add_invoice_items'][0]['price_data']['unit_amount']
        assert first_invoice == int(order.total_amount * 100)
        assert first_invoice < int(order.subtotal * 100)

    def test_records_a_payment_matching_the_first_invoice(self, stripe_subscription):
        order = _order_with_discount('5.00', budget=Decimal('80.00'))
        start_order_payment(order)

        payment = Payment.objects.get(order=order)
        assert payment.status == 'pending'
        assert payment.stripe_payment_intent_id == 'pi_sub_123'
        assert payment.amount == order.total_amount

    def test_an_incomplete_subscription_with_matching_amount_is_reused(self, stripe_subscription, mocker):
        order = _recurring_order(stripe_subscription_id='sub_existing')
        expected_cents = int(max(order.total_amount, Decimal('0.50')) * 100)
        existing = mocker.Mock(
            status='incomplete',
            latest_invoice=mocker.Mock(
                amount_due=expected_cents,
                confirmation_secret=mocker.Mock(client_secret='pi_existing_secret_abc'),
            ),
        )
        mocker.patch.object(stripe.Subscription, 'retrieve', return_value=existing)

        assert start_order_payment(order) == 'pi_existing_secret_abc'
        stripe_subscription.assert_not_called()

    def test_a_stale_subscription_of_the_wrong_amount_is_cancelled_exactly_once(self, stripe_subscription, mocker):
        order = _recurring_order(stripe_subscription_id='sub_stale')
        stale = mocker.Mock(
            status='incomplete',
            latest_invoice=mocker.Mock(amount_due=1, confirmation_secret=mocker.Mock(client_secret='pi_stale_secret')),
        )
        mocker.patch.object(stripe.Subscription, 'retrieve', return_value=stale)
        cancel = mocker.patch.object(stripe.Subscription, 'cancel')

        start_order_payment(order)

        cancel.assert_called_once_with('sub_stale')
        order.refresh_from_db()
        assert order.stripe_subscription_id == stripe_subscription.return_value.id
