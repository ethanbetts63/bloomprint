import pytest
from datetime import date, timedelta
from data_management.models.notification import Notification
from data_management.utils.notification_factory import create_customer_delivery_day_notification
from events.tests.factories.event_factory import EventFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestCreateCustomerDeliveryDayNotification:

    def test_creates_notification_with_correct_fields(self):
        plan = OrderFactory(
            billing_mode='one_time',
            customer_first_name='Alice', customer_email='alice@example.com',
        )
        delivery_date = date.today() + timedelta(days=10)
        event = EventFactory(order=plan, delivery_date=delivery_date)

        create_customer_delivery_day_notification(event)

        notif = Notification.objects.get(related_event=event, recipient_type='customer')
        assert notif.recipient_email == 'alice@example.com'
        assert notif.channel == 'email'
        assert notif.scheduled_for == delivery_date
        assert notif.subject == "Your Bloomprint delivery is today!"
        assert notif.status == 'pending'

    def test_body_contains_recipient_name(self):
        plan = OrderFactory(billing_mode='one_time', 
            recipient_first_name='Jane',
            recipient_last_name='Doe',
        )
        event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))

        create_customer_delivery_day_notification(event)

        notif = Notification.objects.get(related_event=event, recipient_type='customer')
        assert 'Jane Doe' in notif.body

    def test_body_includes_next_delivery_date_when_future_event_exists(self):
        plan = OrderFactory(billing_mode='one_time', )
        first_event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))
        next_event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=20))

        create_customer_delivery_day_notification(first_event)

        notif = Notification.objects.get(related_event=first_event, recipient_type='customer')
        assert str(next_event.delivery_date) in notif.body

    def test_body_omits_next_delivery_line_when_no_future_event(self):
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))

        create_customer_delivery_day_notification(event)

        notif = Notification.objects.get(related_event=event, recipient_type='customer')
        assert 'next delivery' not in notif.body

    def test_next_delivery_date_is_scoped_to_same_order(self):
        """An event on a different order does not appear as the next delivery."""
        plan = OrderFactory(billing_mode='one_time', )
        other_plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))
        EventFactory(order=other_plan, delivery_date=date.today() + timedelta(days=20))

        create_customer_delivery_day_notification(event)

        notif = Notification.objects.get(related_event=event, recipient_type='customer')
        assert 'next delivery' not in notif.body

    def test_uses_generic_greeting_when_first_name_is_blank(self):
        plan = OrderFactory(billing_mode='one_time', customer_first_name='')
        event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))

        create_customer_delivery_day_notification(event)

        notif = Notification.objects.get(related_event=event, recipient_type='customer')
        assert 'Hi there' in notif.body

    def test_only_next_event_is_referenced_not_the_one_after(self):
        """Confirms we pick the immediately next event, not a later one."""
        plan = OrderFactory(billing_mode='one_time', )
        first_event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=10))
        next_event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=20))
        far_event = EventFactory(order=plan, delivery_date=date.today() + timedelta(days=30))

        create_customer_delivery_day_notification(first_event)

        notif = Notification.objects.get(related_event=first_event, recipient_type='customer')
        assert str(next_event.delivery_date) in notif.body
        assert str(far_event.delivery_date) not in notif.body
