from unittest.mock import MagicMock
from data_management.utils.sms_messages import (
    admin_payment_received,
    admin_event_reminder,
    admin_delivery_day,
    admin_cancellation,
)


def _make_order(**kwargs):
    order = MagicMock()
    order.recipient_first_name = kwargs.get('first_name', 'Jane')
    order.recipient_last_name = kwargs.get('last_name', 'Doe')
    order.start_date = kwargs.get('start_date', '2025-06-01')
    order.budget = kwargs.get('budget', 100)
    order.recipient_street_address = kwargs.get('address', '123 Main St')
    order.recipient_suburb = kwargs.get('suburb', 'Springfield')
    return order


def _make_event(**kwargs):
    event = MagicMock()
    event.order = _make_order(**kwargs)
    event.delivery_date = kwargs.get('delivery_date', '2025-06-01')
    return event


class TestAdminPaymentReceived:
    def test_with_order_includes_recipient_name(self):
        order = _make_order(first_name='Jane', last_name='Doe')
        msg = admin_payment_received(order, 'pay_123')
        assert 'Jane Doe' in msg
        assert 'pay_123' in msg

    def test_with_order_includes_budget(self):
        order = _make_order(budget=150)
        msg = admin_payment_received(order, 'pay_456')
        assert '$150' in msg

    def test_with_order_includes_start_date(self):
        order = _make_order(start_date='2025-07-15')
        msg = admin_payment_received(order, 'pay_date')
        assert '2025-07-15' in msg

    def test_without_order_returns_fallback_with_payment_id(self):
        msg = admin_payment_received(None, 'pay_789')
        assert 'pay_789' in msg

    def test_returns_string(self):
        order = _make_order()
        msg = admin_payment_received(order, 'pay_000')
        assert isinstance(msg, str)


class TestAdminEventReminder:
    def test_includes_recipient_name(self):
        event = _make_event(first_name='Bob', last_name='Jones')
        msg = admin_event_reminder(event)
        assert 'Bob Jones' in msg

    def test_includes_delivery_date(self):
        event = _make_event(delivery_date='2025-07-04')
        msg = admin_event_reminder(event)
        assert '2025-07-04' in msg

    def test_says_the_delivery_is_unclaimed(self):
        """
        This alert used to say "order the flowers", and quoted the budget so an
        admin knew what to spend. Admin does not buy flowers any more — the
        message exists to flag that no florist has taken the job.
        """
        event = _make_event(budget=200)
        msg = admin_event_reminder(event)
        assert 'Unclaimed' in msg

    def test_returns_string(self):
        event = _make_event()
        msg = admin_event_reminder(event)
        assert isinstance(msg, str)


class TestAdminDeliveryDay:
    def test_includes_recipient_name(self):
        event = _make_event(first_name='Carol', last_name='White')
        msg = admin_delivery_day(event)
        assert 'Carol White' in msg

    def test_includes_street_address(self):
        event = _make_event(address='456 Oak Ave')
        msg = admin_delivery_day(event)
        assert '456 Oak Ave' in msg

    def test_includes_suburb(self):
        event = _make_event(suburb='Shelbyville')
        msg = admin_delivery_day(event)
        assert 'Shelbyville' in msg

    def test_includes_confirm_wording(self):
        event = _make_event()
        msg = admin_delivery_day(event)
        assert 'onfirm' in msg  # 'Confirm' or 'confirm'

    def test_returns_string(self):
        event = _make_event()
        msg = admin_delivery_day(event)
        assert isinstance(msg, str)


class TestAdminCancellation:
    def test_includes_event_descriptions(self):
        descriptions = 'Event 1: 2025-06-01\nEvent 2: 2025-07-01'
        msg = admin_cancellation(descriptions)
        assert 'Event 1' in msg
        assert 'Event 2' in msg

    def test_includes_cancellation_wording(self):
        msg = admin_cancellation('some event')
        assert 'cancel' in msg.lower()

    def test_returns_string(self):
        msg = admin_cancellation('description')
        assert isinstance(msg, str)
