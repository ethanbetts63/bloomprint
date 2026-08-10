import pytest
from datetime import date, timedelta
from events.tests.factories.event_factory import EventFactory
from events.models import Event
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestEventModel:

    def test_default_status_is_scheduled(self):
        event = EventFactory()
        assert event.status == 'scheduled'

    def test_str_representation_contains_delivery_date(self):
        plan = OrderFactory(billing_mode='one_time', )
        delivery_date = date.today() + timedelta(days=10)
        event = EventFactory(order=plan, delivery_date=delivery_date)
        assert str(delivery_date) in str(event)

    def test_str_representation_contains_order_id(self):
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(order=plan)
        assert str(plan.id) in str(event)

    def test_message_can_be_null(self):
        event = EventFactory(message=None)
        event.refresh_from_db()
        assert event.message is None

    def test_ordered_at_defaults_to_null(self):
        event = EventFactory()
        assert event.ordered_at is None

    def test_delivered_at_defaults_to_null(self):
        event = EventFactory()
        assert event.delivered_at is None

    def test_events_ordered_by_delivery_date(self):
        plan = OrderFactory(billing_mode='one_time', )
        later = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=20))
        earlier = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=5))
        events = list(Event.objects.filter(order=plan))
        assert events[0].pk == earlier.pk
        assert events[1].pk == later.pk

    def test_status_choices_are_valid(self):
        for status_val in ('scheduled', 'ordered', 'delivered', 'cancelled'):
            event = EventFactory(status=status_val)
            event.refresh_from_db()
            assert event.status == status_val

    def test_created_at_auto_set(self):
        event = EventFactory()
        assert event.created_at is not None

    def test_updated_at_auto_set(self):
        event = EventFactory()
        assert event.updated_at is not None
