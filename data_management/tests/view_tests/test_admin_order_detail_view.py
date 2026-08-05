import pytest
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestAdminOrderDetailView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self, pk):
        return f'/api/data/admin/orders/{pk}/'

    def test_returns_one_time_order(self):
        plan = OrderFactory(billing_mode='one_time')
        response = self.client.get(self._url(plan.pk))
        assert response.status_code == 200
        assert response.data['id'] == plan.pk

    def test_returns_recurring_order(self):
        plan = OrderFactory(billing_mode='recurring')
        response = self.client.get(self._url(plan.pk))
        assert response.status_code == 200
        assert response.data['id'] == plan.pk

    def test_404_for_nonexistent_order(self):
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False, is_superuser=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        plan = OrderFactory(billing_mode='one_time')
        response = client.get(self._url(plan.pk))
        assert response.status_code == 403

    def test_requires_authentication(self):
        client = APIClient()
        plan = OrderFactory(billing_mode='one_time')
        response = client.get(self._url(plan.pk))
        assert response.status_code == 401
