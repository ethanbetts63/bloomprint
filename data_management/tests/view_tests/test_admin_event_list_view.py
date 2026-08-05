import pytest
from datetime import date, timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.event_factory import EventFactory
from events.tests.factories.order_factory import OrderFactory

URL = '/api/data/admin/events/'


def days_from_today(offset):
    return date.today() + timedelta(days=offset)


@pytest.mark.django_db
class TestAdminEventListView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def test_returns_paginated_shape(self):
        EventFactory()
        EventFactory()
        response = self.client.get(URL)
        assert response.status_code == 200
        assert set(response.data.keys()) == {'count', 'next', 'previous', 'results'}
        assert response.data['count'] == 2

    def test_requires_admin(self):
        client = APIClient()
        client.force_authenticate(user=UserFactory(is_staff=False, is_superuser=False))
        assert client.get(URL).status_code == 403

    def test_row_carries_order_context(self):
        order = OrderFactory(
            budget=Decimal('80.00'),
            billing_mode='recurring',
            customer_email='buyer@example.com',
            recipient_first_name='Ada',
            recipient_last_name='Lovelace',
        )
        EventFactory(order=order, delivery_date=days_from_today(3))
        row = self.client.get(URL).data['results'][0]
        assert row['order_id'] == order.pk
        assert row['order_type'] == 'recurring'
        assert row['customer_email'] == 'buyer@example.com'
        assert row['recipient_first_name'] == 'Ada'
        assert row['recipient_last_name'] == 'Lovelace'
        assert row['budget'] == '80.00'

    def test_filter_by_single_status(self):
        scheduled = EventFactory(status='scheduled')
        EventFactory(status='delivered')
        response = self.client.get(URL, {'status': 'scheduled'})
        assert [e['id'] for e in response.data['results']] == [scheduled.pk]

    def test_filter_by_multiple_statuses(self):
        scheduled = EventFactory(status='scheduled')
        ordered = EventFactory(status='ordered')
        EventFactory(status='cancelled')
        response = self.client.get(URL, {'status': 'scheduled,ordered'})
        assert {e['id'] for e in response.data['results']} == {scheduled.pk, ordered.pk}

    def test_cancelled_events_are_reachable(self):
        cancelled = EventFactory(status='cancelled')
        response = self.client.get(URL, {'status': 'cancelled'})
        assert [e['id'] for e in response.data['results']] == [cancelled.pk]

    def test_window_overdue_returns_only_past_dates(self):
        overdue = EventFactory(delivery_date=days_from_today(-2))
        EventFactory(delivery_date=days_from_today(0))
        EventFactory(delivery_date=days_from_today(5))
        response = self.client.get(URL, {'window': 'overdue'})
        assert [e['id'] for e in response.data['results']] == [overdue.pk]

    def test_window_today(self):
        today = EventFactory(delivery_date=days_from_today(0))
        EventFactory(delivery_date=days_from_today(-1))
        EventFactory(delivery_date=days_from_today(1))
        response = self.client.get(URL, {'window': 'today'})
        assert [e['id'] for e in response.data['results']] == [today.pk]

    def test_window_next_7_spans_today_through_seven_days(self):
        today = EventFactory(delivery_date=days_from_today(0))
        soon = EventFactory(delivery_date=days_from_today(7))
        EventFactory(delivery_date=days_from_today(8))
        EventFactory(delivery_date=days_from_today(-1))
        response = self.client.get(URL, {'window': 'next_7'})
        assert {e['id'] for e in response.data['results']} == {today.pk, soon.pk}

    def test_window_past_includes_today_and_earlier(self):
        old = EventFactory(delivery_date=days_from_today(-30))
        today = EventFactory(delivery_date=days_from_today(0))
        EventFactory(delivery_date=days_from_today(1))
        response = self.client.get(URL, {'window': 'past'})
        assert {e['id'] for e in response.data['results']} == {old.pk, today.pk}

    def test_unknown_window_is_ignored(self):
        EventFactory(delivery_date=days_from_today(-2))
        EventFactory(delivery_date=days_from_today(2))
        response = self.client.get(URL, {'window': 'nonsense'})
        assert response.data['count'] == 2

    def test_search_by_recipient_last_name(self):
        match = EventFactory(order=OrderFactory(recipient_last_name='UniqueRecipient'))
        EventFactory(order=OrderFactory(recipient_last_name='Other'))
        response = self.client.get(URL, {'search': 'UniqueRecipient'})
        assert [e['id'] for e in response.data['results']] == [match.pk]

    def test_search_by_customer_email(self):
        match = EventFactory(order=OrderFactory(customer_email='findme@example.com'))
        EventFactory(order=OrderFactory(customer_email='other@example.com'))
        response = self.client.get(URL, {'search': 'findme'})
        assert [e['id'] for e in response.data['results']] == [match.pk]

    def test_search_by_order_id(self):
        match = EventFactory()
        EventFactory()
        response = self.client.get(URL, {'search': str(match.order_id)})
        assert match.pk in [e['id'] for e in response.data['results']]

    def test_default_ordering_is_soonest_delivery_first(self):
        later = EventFactory(delivery_date=days_from_today(10))
        sooner = EventFactory(delivery_date=days_from_today(1))
        response = self.client.get(URL)
        assert [e['id'] for e in response.data['results']] == [sooner.pk, later.pk]

    def test_ordering_by_delivery_date_descending(self):
        later = EventFactory(delivery_date=days_from_today(10))
        sooner = EventFactory(delivery_date=days_from_today(1))
        response = self.client.get(URL, {'ordering': '-delivery_date'})
        assert [e['id'] for e in response.data['results']] == [later.pk, sooner.pk]

    def test_ordering_by_recipient(self):
        alpha = EventFactory(order=OrderFactory(recipient_last_name='Alpha'))
        zeta = EventFactory(order=OrderFactory(recipient_last_name='Zeta'))
        response = self.client.get(URL, {'ordering': 'recipient'})
        assert [e['id'] for e in response.data['results']] == [alpha.pk, zeta.pk]

    def test_ordering_by_budget(self):
        cheap = EventFactory(order=OrderFactory(budget=Decimal('50.00')))
        pricey = EventFactory(order=OrderFactory(budget=Decimal('99.00')))
        response = self.client.get(URL, {'ordering': '-budget'})
        assert [e['id'] for e in response.data['results']] == [pricey.pk, cheap.pk]

    def test_unknown_ordering_falls_back_to_delivery_date(self):
        later = EventFactory(delivery_date=days_from_today(10))
        sooner = EventFactory(delivery_date=days_from_today(1))
        response = self.client.get(URL, {'ordering': 'drop_table'})
        assert [e['id'] for e in response.data['results']] == [sooner.pk, later.pk]

    def test_pagination_page_size(self):
        for offset in range(3):
            EventFactory(delivery_date=days_from_today(offset))
        response = self.client.get(URL, {'page_size': 2})
        assert response.data['count'] == 3
        assert len(response.data['results']) == 2
        assert response.data['next'] is not None

    def test_empty_list_when_no_events(self):
        response = self.client.get(URL)
        assert response.status_code == 200
        assert response.data['count'] == 0
        assert response.data['results'] == []
