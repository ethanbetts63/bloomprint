import pytest
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from users.tests.factories.user_factory import UserFactory
from partners.models import Commission


@pytest.mark.django_db
class TestAdminDenyCommissionView:
    def setup_method(self):
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _url(self, pk):
        return f'/api/business-accounts/admin/commissions/{pk}/deny/'

    def test_deny_pending_commission_succeeds(self):
        commission = CommissionFactory(status='pending')

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 200
        assert response.data['status'] == 'denied'

    def test_deny_approved_commission_succeeds(self):
        commission = CommissionFactory(status='approved')

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 200
        assert response.data['status'] == 'denied'

    def test_commission_status_becomes_denied(self):
        commission = CommissionFactory(status='pending')

        self.client.post(self._url(commission.id))

        commission.refresh_from_db()
        assert commission.status == 'denied'

    @pytest.mark.parametrize('blocked_status', ['paid', 'processing'])
    def test_blocked_statuses_return_400(self, blocked_status):
        commission = CommissionFactory(status=blocked_status)

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 400
        commission.refresh_from_db()
        assert commission.status == blocked_status

    def test_not_found_returns_404(self):
        response = self.client.post(self._url(99999))
        assert response.status_code == 404

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        commission = CommissionFactory(status='pending')

        response = client.post(self._url(commission.id))

        assert response.status_code == 403

    def test_requires_authentication(self):
        commission = CommissionFactory(status='pending')
        client = APIClient()

        response = client.post(self._url(commission.id))

        assert response.status_code == 401

    def test_deny_makes_no_stripe_call(self, mocker):
        commission = CommissionFactory(status='pending')
        mock_transfer = mocker.patch('stripe.Transfer.create')

        self.client.post(self._url(commission.id))

        mock_transfer.assert_not_called()
