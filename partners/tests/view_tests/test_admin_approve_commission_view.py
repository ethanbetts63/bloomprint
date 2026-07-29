import pytest
import stripe
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from users.tests.factories.user_factory import UserFactory
from partners.models import Commission, Payout, PayoutLineItem


@pytest.mark.django_db
class TestAdminApproveCommissionView:
    def setup_method(self):
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _url(self, pk):
        return f'/api/business-accounts/admin/commissions/{pk}/approve/'

    def _onboarded_partner(self):
        return BusinessAccountFactory(
            stripe_connect_account_id='acct_test',
            stripe_connect_onboarding_complete=True,
        )

    def test_approve_success_returns_processing(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('50'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_approve'))

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 200
        assert response.data['status'] == 'processing'
        assert response.data['stripe_transfer_id'] == 'tr_approve'

    def test_commission_status_becomes_processing(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_a'))

        self.client.post(self._url(commission.id))

        commission.refresh_from_db()
        assert commission.status == 'processing'

    def test_payout_created_with_processing_status(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('30'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_payout'))

        self.client.post(self._url(commission.id))

        payout = Payout.objects.get(stripe_transfer_id='tr_payout')
        assert payout.status == 'processing'
        assert payout.amount == Decimal('30')
        assert payout.business_account == partner

    def test_payout_line_item_created(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('15'), status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_li'))

        self.client.post(self._url(commission.id))

        line_item = PayoutLineItem.objects.get(commission=commission)
        assert line_item.amount == Decimal('15')

    def test_fulfillment_commission_creates_fulfillment_payout(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(
            business_account=partner,
            commission_type='fulfillment',
            status='pending',
        )
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_ful'))

        self.client.post(self._url(commission.id))

        payout = Payout.objects.get(stripe_transfer_id='tr_ful')
        assert payout.payout_type == 'fulfillment'

    def test_referral_commission_creates_commission_payout(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(
            business_account=partner,
            commission_type='referral',
            status='pending',
        )
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_ref'))

        self.client.post(self._url(commission.id))

        payout = Payout.objects.get(stripe_transfer_id='tr_ref')
        assert payout.payout_type == 'commission'

    def test_approved_status_commission_can_be_approved(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status='approved')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_appr'))

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 200

    @pytest.mark.parametrize('blocked_status', ['processing', 'paid', 'denied'])
    def test_blocked_statuses_return_400(self, mocker, blocked_status):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status=blocked_status)
        mock_transfer = mocker.patch('stripe.Transfer.create')

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 400
        mock_transfer.assert_not_called()

    def test_partner_not_onboarded_returns_400(self, mocker):
        partner = BusinessAccountFactory(
            stripe_connect_onboarding_complete=False,
            stripe_connect_account_id='acct_x',
        )
        commission = CommissionFactory(business_account=partner, status='pending')
        mock_transfer = mocker.patch('stripe.Transfer.create')

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 400
        mock_transfer.assert_not_called()

    def test_stripe_error_returns_400_and_leaves_commission_unchanged(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, status='pending')
        mocker.patch(
            'stripe.Transfer.create',
            side_effect=stripe.error.StripeError('Insufficient funds'),
        )

        response = self.client.post(self._url(commission.id))

        assert response.status_code == 400
        commission.refresh_from_db()
        assert commission.status == 'pending'

    def test_not_found_returns_404(self):
        response = self.client.post(self._url(99999))
        assert response.status_code == 404

    def test_requires_admin(self, mocker):
        non_admin = UserFactory(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        commission = CommissionFactory(status='pending')
        mocker.patch('stripe.Transfer.create', return_value=mocker.MagicMock(id='tr_x'))

        response = client.post(self._url(commission.id))

        assert response.status_code == 403

    def test_stripe_transfer_called_with_correct_params(self, mocker):
        partner = self._onboarded_partner()
        commission = CommissionFactory(business_account=partner, amount=Decimal('75'), status='pending')
        mock_transfer = mocker.patch(
            'stripe.Transfer.create',
            return_value=mocker.MagicMock(id='tr_params'),
        )

        self.client.post(self._url(commission.id))

        call_kwargs = mock_transfer.call_args.kwargs
        assert call_kwargs['amount'] == 7500
        assert call_kwargs['destination'] == 'acct_test'
        assert f'commission_{commission.id}' in call_kwargs['transfer_group']
