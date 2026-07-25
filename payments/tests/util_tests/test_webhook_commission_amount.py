import pytest
from decimal import Decimal
from payments.utils.webhook_handlers import handle_payment_intent_succeeded, handle_invoice_payment_succeeded
from payments.tests.factories.payment_factory import PaymentFactory
from events.tests.factories.order_factory import OrderFactory
from events.models import Event


@pytest.mark.django_db
class TestWebhookCommissionAmount:

    def test_one_time_order_event_gets_commission_amount(self, mocker):
        """Event created for a one-time order has commission_amount set from budget."""
        mocker.patch('payments.utils.webhook_handlers.send_customer_payment_notification')

        # budget=150: not < 150, is < 200 → tier gives $15
        plan = OrderFactory(billing_mode='one_time', status='pending_payment', budget=Decimal('150'), frequency='annually')
        payment = PaymentFactory(
            order=plan,
            stripe_payment_intent_id='pi_upfront_test',
            status='pending',
        )

        payment_intent = {
            'id': 'pi_upfront_test',
            'metadata': {},
            'payment_method': 'pm_test',
        }
        handle_payment_intent_succeeded(payment_intent)

        events = Event.objects.filter(order=plan)
        assert events.exists()
        for event in events:
            assert event.commission_amount == Decimal('15')

    def test_one_time_order_commission_amount_varies_with_budget(self, mocker):
        """Commission amount snapshot reflects the tier for the plan's budget."""
        mocker.patch('payments.utils.webhook_handlers.send_customer_payment_notification')

        # budget=75 → tier gives $5
        plan = OrderFactory(billing_mode='one_time', status='pending_payment', budget=Decimal('75'), frequency='annually')
        payment = PaymentFactory(
            order=plan,
            stripe_payment_intent_id='pi_upfront_test2',
            status='pending',
        )

        payment_intent = {
            'id': 'pi_upfront_test2',
            'metadata': {},
            'payment_method': 'pm_test',
        }
        handle_payment_intent_succeeded(payment_intent)

        event = Event.objects.filter(order=plan).first()
        assert event.commission_amount == Decimal('5')

    def test_subscription_plan_first_event_gets_commission_amount(self, mocker):
        """First event created for a new subscription has commission_amount set."""
        mocker.patch('payments.utils.webhook_handlers.send_customer_payment_notification')

        # stripe_subscription_id already set → skips Stripe Subscription.create block
        plan = OrderFactory(
            billing_mode='recurring',
            status='pending_payment',
            budget=Decimal('200'),
            stripe_subscription_id='sub_existing',
        )
        payment = PaymentFactory(
            order=plan,
            stripe_payment_intent_id='pi_sub_test',
            status='pending',
        )

        payment_intent = {
            'id': 'pi_sub_test',
            'metadata': {},
            'payment_method': 'pm_test',
        }
        handle_payment_intent_succeeded(payment_intent)

        event = Event.objects.filter(order=plan).first()
        assert event is not None
        # budget=200: not < 200, is < 250 → tier gives $20
        assert event.commission_amount == Decimal('20')

    def test_recurring_subscription_event_gets_commission_amount(self, mocker):
        """Recurring subscription invoice creates an event with commission_amount."""
        from django.conf import settings
        from datetime import date, timedelta

        # budget=250 → tier gives $25
        plan = OrderFactory(
            billing_mode='recurring',
            status='active',
            budget=Decimal('250'),
            stripe_subscription_id='sub_recurring',
        )

        # Provide a created timestamp so the handler can compute delivery_date
        lead_days = getattr(settings, 'SUBSCRIPTION_CHARGE_LEAD_DAYS', 14)
        today = date.today()
        invoice_created_ts = int(__import__('datetime').datetime.combine(today, __import__('datetime').time.min).timestamp())
        expected_delivery_date = today + timedelta(days=lead_days)

        invoice = {
            'subscription': 'sub_recurring',
            'payment_intent': 'pi_recurring_test',
            'amount_paid': 25000,
            'created': invoice_created_ts,
        }
        handle_invoice_payment_succeeded(invoice)

        event = Event.objects.filter(order=plan, delivery_date=expected_delivery_date).first()
        assert event is not None
        assert event.commission_amount == Decimal('25')
