import pytest
from datetime import date, timedelta
from rest_framework.test import APIClient
from events.tests.factories.event_factory import EventFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestAdminDashboardView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self):
        return '/api/data/admin/dashboard/'

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False, is_superuser=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        response = client.get(self._url())
        assert response.status_code == 403

    def test_requires_authentication(self):
        client = APIClient()
        response = client.get(self._url())
        assert response.status_code == 401

    def test_returns_three_buckets(self):
        response = self.client.get(self._url())
        assert response.status_code == 200
        assert 'unclaimed' in response.data
        assert 'claimed' in response.data
        assert 'delivered' in response.data

    def test_unclaimed_includes_scheduled_within_14_days(self):
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(status='scheduled', order=plan, delivery_date=date.today() + timedelta(days=7))
        response = self.client.get(self._url())
        ids = [e['id'] for e in response.data['unclaimed']]
        assert event.id in ids

    def test_unclaimed_excludes_scheduled_beyond_14_days(self):
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(status='scheduled', order=plan, delivery_date=date.today() + timedelta(days=20))
        response = self.client.get(self._url())
        ids = [e['id'] for e in response.data['unclaimed']]
        assert event.id not in ids

    def test_claimed_events_in_claimed_bucket(self):
        from django.utils import timezone
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(status='claimed', order=plan, ordered_at=timezone.now())
        response = self.client.get(self._url())
        ids = [e['id'] for e in response.data['claimed']]
        assert event.id in ids

    def test_delivered_events_in_delivered_bucket(self):
        from django.utils import timezone
        plan = OrderFactory(billing_mode='one_time', )
        event = EventFactory(status='delivered', order=plan, delivered_at=timezone.now())
        response = self.client.get(self._url())
        ids = [e['id'] for e in response.data['delivered']]
        assert event.id in ids

    def test_unclaimed_excludes_claimed_events(self):
        from django.utils import timezone
        plan = OrderFactory(billing_mode='one_time', )
        ordered = EventFactory(status='claimed', order=plan, delivery_date=date.today() + timedelta(days=5))
        response = self.client.get(self._url())
        ids = [e['id'] for e in response.data['unclaimed']]
        assert ordered.id not in ids

    def test_buckets_are_lists(self):
        response = self.client.get(self._url())
        assert isinstance(response.data['unclaimed'], list)
        assert isinstance(response.data['claimed'], list)
        assert isinstance(response.data['delivered'], list)
