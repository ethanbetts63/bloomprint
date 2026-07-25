import pytest
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestAdminPlanListView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self):
        return '/api/data/admin/plans/'

    def test_returns_all_plans_by_default(self):
        OrderFactory(billing_mode='one_time', )
        OrderFactory(billing_mode='recurring', )
        response = self.client.get(self._url())
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_filter_by_plan_type_upfront_only(self):
        upfront = OrderFactory(billing_mode='one_time', )
        OrderFactory(billing_mode='recurring', )
        response = self.client.get(self._url(), {'plan_type': 'one_time'})
        ids = [p['id'] for p in response.data]
        assert upfront.pk in ids
        assert len(ids) == 1

    def test_filter_by_plan_type_subscription_only(self):
        OrderFactory(billing_mode='one_time', )
        sub = OrderFactory(billing_mode='recurring', )
        response = self.client.get(self._url(), {'plan_type': 'recurring'})
        ids = [p['id'] for p in response.data]
        assert sub.pk in ids
        assert len(ids) == 1

    def test_filter_by_status(self):
        active = OrderFactory(billing_mode='one_time', status='active')
        OrderFactory(billing_mode='one_time', status='pending_payment')
        response = self.client.get(self._url(), {'status': 'active'})
        ids = [p['id'] for p in response.data]
        assert active.pk in ids
        assert len(ids) == 1

    def test_search_by_customer_email(self):
        plan = OrderFactory(billing_mode='one_time', user=None, customer_email='findme@example.com')
        OrderFactory(billing_mode='one_time', )
        response = self.client.get(self._url(), {'search': 'findme'})
        ids = [p['id'] for p in response.data]
        assert plan.pk in ids

    def test_search_by_recipient_last_name(self):
        plan = OrderFactory(billing_mode='one_time', recipient_last_name='UniqueRecipient')
        OrderFactory(billing_mode='one_time', recipient_last_name='Other')
        response = self.client.get(self._url(), {'search': 'UniqueRecipient'})
        ids = [p['id'] for p in response.data]
        assert plan.pk in ids

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False, is_superuser=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        response = client.get(self._url())
        assert response.status_code == 403

    def test_empty_list_when_no_plans(self):
        response = self.client.get(self._url())
        assert response.status_code == 200
        assert response.data == []
