import pytest
from decimal import Decimal
from unittest.mock import MagicMock
from events.models import Event
from events.tests.factories.order_factory import OrderFactory
from payments.models import Payment
from payments.utils.webhook_handlers import handle_payment_intent_succeeded, handle_invoice_payment_succeeded

@pytest.mark.django_db
class TestEventGeneration:
    def test_one_time_order_activation_creates_event(self):
        plan = OrderFactory(billing_mode='one_time', status='pending_payment', frequency='monthly')
        payment = Payment.objects.create(
            order=plan,
            stripe_payment_intent_id="pi_123",
            amount=plan.total_amount,
            status='pending'
        )

        mock_pi = {
            'id': 'pi_123',
            'metadata': {},
        }

        handle_payment_intent_succeeded(mock_pi)

        plan.refresh_from_db()
        assert plan.status == 'active'
        assert Event.objects.filter(order=plan).count() == 1

    def test_subscription_invoice_creates_single_event(self):
        plan = OrderFactory(billing_mode='recurring', status='active', frequency='monthly', stripe_subscription_id='sub_test_123')

        mock_invoice = {
            'subscription': plan.stripe_subscription_id,
            'payment_intent': 'pi_sub_123',
            'amount_paid': 10000
        }

        assert Event.objects.filter(order=plan).count() == 0

        handle_invoice_payment_succeeded(mock_invoice)

        assert Payment.objects.filter(stripe_payment_intent_id='pi_sub_123').exists()
        assert Event.objects.filter(order=plan).count() == 1
