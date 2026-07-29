import pytest
from decimal import Decimal
from payments.utils.webhook_handlers import handle_transfer_created
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.commission_factory import CommissionFactory
from partners.tests.factories.payout_factory import PayoutFactory, PayoutLineItemFactory
from partners.models import Commission, Payout


@pytest.mark.django_db
class TestHandleTransferCreated:

    def _make_payout_with_commission(self, transfer_id, payout_status='processing', commission_status='processing'):
        partner = BusinessAccountFactory()
        commission = CommissionFactory(business_account=partner, status=commission_status)
        payout = PayoutFactory(
            business_account=partner,
            stripe_transfer_id=transfer_id,
            status=payout_status,
        )
        PayoutLineItemFactory(payout=payout, commission=commission)
        return payout, commission

    def test_marks_payout_completed(self):
        payout, _ = self._make_payout_with_commission('tr_webhook_1')

        handle_transfer_created({'id': 'tr_webhook_1'})

        payout.refresh_from_db()
        assert payout.status == 'completed'

    def test_marks_commission_paid(self):
        _, commission = self._make_payout_with_commission('tr_webhook_2')

        handle_transfer_created({'id': 'tr_webhook_2'})

        commission.refresh_from_db()
        assert commission.status == 'paid'

    def test_idempotent_when_payout_already_completed(self):
        payout, commission = self._make_payout_with_commission(
            'tr_webhook_idem',
            payout_status='completed',
            commission_status='paid',
        )

        # Calling again should not raise and should leave state unchanged
        handle_transfer_created({'id': 'tr_webhook_idem'})

        payout.refresh_from_db()
        commission.refresh_from_db()
        assert payout.status == 'completed'
        assert commission.status == 'paid'

    def test_unknown_transfer_id_does_not_raise(self):
        # Should log and return gracefully
        handle_transfer_created({'id': 'tr_nonexistent'})

    def test_missing_transfer_id_does_not_raise(self):
        handle_transfer_created({})

    def test_payout_without_commission_line_item_does_not_raise(self):
        partner = BusinessAccountFactory()
        payout = PayoutFactory(
            business_account=partner,
            stripe_transfer_id='tr_no_commission',
            status='processing',
        )
        # Line item with no commission (delivery_request only scenario)
        PayoutLineItemFactory(payout=payout, commission=None)

        handle_transfer_created({'id': 'tr_no_commission'})

        payout.refresh_from_db()
        assert payout.status == 'completed'
