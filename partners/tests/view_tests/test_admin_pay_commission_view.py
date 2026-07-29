import pytest
import stripe
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from events.tests.factories.event_factory import EventFactory
from users.tests.factories.user_factory import UserFactory
from partners.models import Commission, Payout, PayoutLineItem


@pytest.mark.django_db
class TestAdminPayCommissionView:
    def setup_method(self):
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _url(self, business_account_id, commission_id):
        return f'/api/business-accounts/admin/{business_account_id}/commissions/{commission_id}/pay/'

    def _onboarded_partner(self):
        return BusinessAccountFactory(
            stripe_connect_account_id='acct_test',
            stripe_connect_onboarding_complete=True,
        )

    def test_pay_commission_success(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('10'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_abc123'))

        response = self.client.post(self._url(partner.id, commission.id))

        assert response.status_code == 200
        assert response.data['status'] == 'processing'
        assert response.data['stripe_transfer_id'] == 'tr_abc123'

        commission.refresh_from_db()
        assert commission.status == 'processing'

    def test_pay_commission_creates_payout_record(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('10'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_payout_test'))

        self.client.post(self._url(partner.id, commission.id))

        payout = Payout.objects.get(stripe_transfer_id='tr_payout_test')
        assert payout.business_account == partner
        assert payout.amount == Decimal('10')
        assert payout.payout_type == 'commission'
        assert payout.status == 'processing'

    def test_pay_commission_creates_payout_line_item(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('10'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_li_test'))

        self.client.post(self._url(partner.id, commission.id))

        line_item = PayoutLineItem.objects.get(commission=commission)
        assert line_item.amount == Decimal('10')

    def test_fulfillment_commission_creates_fulfillment_payout(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(
            business_account=partner,
            amount=Decimal('120'),
            commission_type='fulfillment',
            status='pending',
        )
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_fulfillment'))

        self.client.post(self._url(partner.id, commission.id))

        payout = Payout.objects.get(stripe_transfer_id='tr_fulfillment')
        assert payout.payout_type == 'fulfillment'

    @pytest.mark.parametrize('blocked_status', ['paid', 'processing', 'denied'])
    def test_pay_commission_blocked_status_returns_400(self, mocker, blocked_status):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status=blocked_status)
        mock_transfer = mocker.patch('stripe.Transfer.create')

        response = self.client.post(self._url(partner.id, commission.id))

        assert response.status_code == 400
        mock_transfer.assert_not_called()

    def test_pay_commission_partner_not_onboarded_returns_400(self, mocker):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_test',
            stripe_connect_onboarding_complete=False,
        )
        commission = CommissionFactory(business_account=partner, status='pending')
        mock_transfer = mocker.patch('stripe.Transfer.create')

        response = self.client.post(self._url(partner.id, commission.id))

        assert response.status_code == 400
        mock_transfer.assert_not_called()

    def test_pay_commission_stripe_error_returns_400(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status='pending')
        mocker.patch(
            'stripe.Transfer.create',
            side_effect=stripe.error.StripeError('Insufficient funds'),
        )

        response = self.client.post(self._url(partner.id, commission.id))

        assert response.status_code == 400
        # Commission should not be marked paid on Stripe error
        commission.refresh_from_db()
        assert commission.status == 'pending'

    def test_pay_commission_wrong_partner_returns_404(self, mocker):
        partner_a = self._onboarded_partner()
        partner_b = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner_b, status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_x'))

        response = self.client.post(self._url(partner_a.id, commission.id))
        assert response.status_code == 404

    def test_pay_commission_partner_not_found_returns_404(self, mocker):
        commission = CommissionFactory(status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_x'))

        response = self.client.post(self._url(99999, commission.id))
        assert response.status_code == 404

    def test_pay_commission_requires_admin(self, mocker):
        non_admin = UserFactory(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)

        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_x'))

        response = client.post(self._url(partner.id, commission.id))
        assert response.status_code == 403

    def test_stripe_transfer_called_with_correct_params(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('25'), status='pending')
        mock_transfer = mocker.patch(
            'stripe.Transfer.create',
            return_value=mocker.MagicMock(id='tr_params_test'),
        )

        self.client.post(self._url(partner.id, commission.id))

        call_kwargs = mock_transfer.call_args.kwargs
        assert call_kwargs['amount'] == 2500  # $25.00 in cents
        assert call_kwargs['destination'] == 'acct_test'
        assert f'commission_{commission.id}' in call_kwargs['transfer_group']
