import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory

URL = '/api/data/admin/orders/'


@pytest.mark.django_db
class TestAdminOrderListView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def test_returns_paginated_shape(self):
        OrderFactory()
        OrderFactory()
        response = self.client.get(URL)
        assert response.status_code == 200
        assert set(response.data.keys()) == {'count', 'next', 'previous', 'results'}
        assert response.data['count'] == 2
        assert len(response.data['results']) == 2

    def test_requires_admin(self):
        client = APIClient()
        client.force_authenticate(user=UserFactory(is_staff=False, is_superuser=False))
        assert client.get(URL).status_code == 403

    def test_filter_by_single_status(self):
        active = OrderFactory(status='active')
        OrderFactory(status='pending_payment')
        response = self.client.get(URL, {'status': 'active'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [active.pk]

    def test_filter_by_multiple_statuses(self):
        active = OrderFactory(status='active')
        pending = OrderFactory(status='pending_payment')
        OrderFactory(status='cancelled')
        response = self.client.get(URL, {'status': 'active,pending_payment'})
        ids = {o['id'] for o in response.data['results']}
        assert ids == {active.pk, pending.pk}

    def test_filter_by_order_type_recurring(self):
        recurring = OrderFactory(billing_mode='recurring')
        OrderFactory(billing_mode='one_time')
        response = self.client.get(URL, {'order_type': 'recurring'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [recurring.pk]

    def test_filter_by_order_type_one_time(self):
        one_time = OrderFactory(billing_mode='one_time')
        OrderFactory(billing_mode='recurring')
        response = self.client.get(URL, {'order_type': 'one_time'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [one_time.pk]

    def test_search_by_customer_email(self):
        match = OrderFactory(customer_email='findme@example.com')
        OrderFactory(customer_email='other@example.com')
        response = self.client.get(URL, {'search': 'findme'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [match.pk]

    def test_search_by_recipient_last_name(self):
        match = OrderFactory(recipient_last_name='UniqueRecipient')
        OrderFactory(recipient_last_name='Other')
        response = self.client.get(URL, {'search': 'UniqueRecipient'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [match.pk]

    def test_ordering_by_recipient(self):
        alpha = OrderFactory(recipient_last_name='Alpha')
        zeta = OrderFactory(recipient_last_name='Zeta')
        response = self.client.get(URL, {'ordering': 'recipient'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [alpha.pk, zeta.pk]

    def test_empty_list_when_no_orders(self):
        response = self.client.get(URL)
        assert response.status_code == 200
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_ordering_by_total_ascending(self):
        # total_amount is derived from budget in Order.save(), so drive it via budget.
        cheap = OrderFactory(budget=Decimal('50.00'))
        pricey = OrderFactory(budget=Decimal('99.00'))
        response = self.client.get(URL, {'ordering': 'total'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [cheap.pk, pricey.pk]

    def test_ordering_by_total_descending(self):
        cheap = OrderFactory(budget=Decimal('50.00'))
        pricey = OrderFactory(budget=Decimal('99.00'))
        response = self.client.get(URL, {'ordering': '-total'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [pricey.pk, cheap.pk]

    def test_ordering_by_customer_name(self):
        alpha = OrderFactory(customer_last_name='Alpha')
        zeta = OrderFactory(customer_last_name='Zeta')
        response = self.client.get(URL, {'ordering': 'customer_name'})
        ids = [o['id'] for o in response.data['results']]
        assert ids == [alpha.pk, zeta.pk]

    def test_default_ordering_is_newest_first(self):
        older = OrderFactory()
        newer = OrderFactory()
        response = self.client.get(URL)
        ids = [o['id'] for o in response.data['results']]
        # -id tiebreaker: newest created row (higher id) comes first by default
        assert ids[0] == newer.pk and ids[1] == older.pk

    def test_pagination_page_size(self):
        for _ in range(3):
            OrderFactory()
        response = self.client.get(URL, {'page_size': 2})
        assert response.data['count'] == 3
        assert len(response.data['results']) == 2
        assert response.data['next'] is not None
