import pytest
from payments.utils.webhook_handlers import handle_account_updated
from partners.tests.factories.business_account_factory import BusinessAccountFactory


@pytest.mark.django_db
class TestHandleAccountUpdated:

    def test_marks_onboarding_complete_when_payouts_enabled(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_test',
            stripe_connect_onboarding_complete=False,
        )

        handle_account_updated({'id': 'acct_test', 'payouts_enabled': True})

        partner.refresh_from_db()
        assert partner.stripe_connect_onboarding_complete is True

    def test_does_not_update_if_payouts_disabled(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_test',
            stripe_connect_onboarding_complete=False,
        )

        handle_account_updated({'id': 'acct_test', 'payouts_enabled': False})

        partner.refresh_from_db()
        assert partner.stripe_connect_onboarding_complete is False

    def test_already_complete_partner_not_changed(self):
        partner = BusinessAccountFactory(
            stripe_connect_account_id='acct_already',
            stripe_connect_onboarding_complete=True,
        )

        handle_account_updated({'id': 'acct_already', 'payouts_enabled': True})

        partner.refresh_from_db()
        assert partner.stripe_connect_onboarding_complete is True

    def test_no_partner_found_does_not_raise(self):
        # No partner in DB with this account id — must not raise
        handle_account_updated({'id': 'acct_unknown', 'payouts_enabled': True})

    def test_missing_account_id_does_not_raise(self):
        handle_account_updated({'payouts_enabled': True})

    def test_multiple_partners_only_incomplete_ones_updated(self):
        already_done = BusinessAccountFactory(
            stripe_connect_account_id='acct_same',
            stripe_connect_onboarding_complete=True,
        )
        pending = BusinessAccountFactory(
            stripe_connect_account_id='acct_other',
            stripe_connect_onboarding_complete=False,
        )

        handle_account_updated({'id': 'acct_other', 'payouts_enabled': True})

        already_done.refresh_from_db()
        pending.refresh_from_db()
        assert already_done.stripe_connect_onboarding_complete is True
        assert pending.stripe_connect_onboarding_complete is True
