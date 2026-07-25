import pytest
from unittest.mock import MagicMock
from data_management.utils.send_notification import resolve_recipient


def _make_notification(recipient_type, **kwargs):
    notif = MagicMock()
    notif.recipient_type = recipient_type
    notif.recipient_partner = kwargs.get('partner', None)
    notif.recipient_email = kwargs.get('email', None)
    return notif


class TestResolveRecipient:
    def test_admin_returns_admin_email_from_settings(self, settings):
        settings.ADMIN_EMAIL = 'admin@example.com'
        settings.ADMIN_NUMBER = '+15550001111'
        notif = _make_notification('admin')
        email, phone = resolve_recipient(notif)
        assert email == 'admin@example.com'
        assert phone == '+15550001111'

    def test_partner_returns_partner_user_email(self):
        partner = MagicMock()
        partner.user.email = 'florist@example.com'
        partner.phone = '+15559998888'
        notif = _make_notification('partner', partner=partner)
        email, phone = resolve_recipient(notif)
        assert email == 'florist@example.com'
        assert phone == '+15559998888'

    def test_partner_with_no_partner_returns_none_none(self):
        notif = _make_notification('partner', partner=None)
        email, phone = resolve_recipient(notif)
        assert email is None
        assert phone is None

    def test_customer_returns_recipient_email_and_no_phone(self):
        notif = _make_notification('customer', email='customer@example.com')
        email, phone = resolve_recipient(notif)
        assert email == 'customer@example.com'
        assert phone is None

    def test_customer_with_no_email_returns_none_none(self):
        notif = _make_notification('customer', email=None)
        email, phone = resolve_recipient(notif)
        assert email is None
        assert phone is None

    def test_unknown_type_returns_none_none(self):
        notif = _make_notification('unknown_type')
        email, phone = resolve_recipient(notif)
        assert email is None
        assert phone is None

    def test_returns_tuple_of_two_elements(self):
        notif = _make_notification('admin')
        result = resolve_recipient(notif)
        assert len(result) == 2
