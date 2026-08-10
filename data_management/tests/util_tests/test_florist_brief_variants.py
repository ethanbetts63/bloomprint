"""
The request brief goes to every florist in radius before anyone claims, and an
emailed PDF cannot be recalled. These tests pin the boundary between the two
variants so a future edit cannot quietly leak the recipient.
"""
import pytest
from io import BytesIO

from django.conf import settings
from pypdf import PdfReader

from data_management.utils.florist_brief_pdf import build_florist_brief
from events.tests.factories.event_factory import EventFactory


def text_of(pdf_bytes):
    return PdfReader(BytesIO(pdf_bytes)).pages[0].extract_text()


@pytest.fixture
def event(db):
    return EventFactory(
        message='Happy birthday Mum!',
        order__recipient_first_name='Sarah',
        order__recipient_last_name='Chen',
        order__recipient_street_address='12 Read Street',
        order__recipient_suburb='Rockingham',
        order__recipient_state='WA',
        order__recipient_postcode='6168',
        order__delivery_notes='Leave with the neighbour at number 14.',
        order__customer_first_name='Daniel',
        order__customer_last_name='Okafor',
    )


@pytest.mark.django_db
class TestRequestVariantWithholdsPii:
    def test_omits_recipient_name(self, event):
        assert 'Chen' not in text_of(build_florist_brief(event, variant='request'))

    def test_omits_street_address(self, event):
        assert 'Read Street' not in text_of(build_florist_brief(event, variant='request'))

    def test_omits_card_message(self, event):
        assert 'Happy birthday Mum' not in text_of(build_florist_brief(event, variant='request'))

    def test_omits_delivery_notes(self, event):
        assert 'neighbour' not in text_of(build_florist_brief(event, variant='request'))

    def test_omits_the_sender_name(self, event):
        assert 'Okafor' not in text_of(build_florist_brief(event, variant='request'))

    def test_still_shows_the_area(self, event):
        """Enough to judge the drive without identifying anyone."""
        text = text_of(build_florist_brief(event, variant='request'))
        assert 'Rockingham' in text
        assert 'WA' in text

    def test_still_shows_reference_and_money(self, event):
        text = text_of(build_florist_brief(event, variant='request'))
        assert event.reference in text


@pytest.mark.django_db
class TestClaimedVariantIsTheFullBrief:
    def test_includes_recipient_name(self, event):
        assert 'Chen' in text_of(build_florist_brief(event, variant='claimed'))

    def test_includes_street_address(self, event):
        assert 'Read Street' in text_of(build_florist_brief(event, variant='claimed'))

    def test_includes_card_message(self, event):
        assert 'Happy birthday Mum' in text_of(build_florist_brief(event, variant='claimed'))

    def test_includes_the_sender_name_for_the_card(self, event):
        """The florist writes the card, so they need to know who it is from."""
        text = text_of(build_florist_brief(event, variant='claimed'))
        assert 'Daniel Okafor' in text
        # field() renders labels uppercased.
        assert 'CARD FROM' in text

    def test_still_omits_customer_contact_details(self, event):
        """The florist gets the buyer's name to sign the card, nothing more."""
        event.order.customer_email = 'daniel@example.com'
        event.order.save(update_fields=['customer_email'])

        text = text_of(build_florist_brief(event, variant='claimed'))

        assert 'daniel@example.com' not in text

    def test_defaults_to_claimed_so_the_admin_download_is_unchanged(self, event):
        # Compared as text, not bytes: a PDF embeds a creation timestamp, so two
        # identical documents rendered a moment apart differ byte-for-byte.
        assert text_of(build_florist_brief(event)) == text_of(
            build_florist_brief(event, variant='claimed')
        )


@pytest.mark.django_db
class TestQrTarget:
    def test_request_brief_points_at_signup(self, event):
        text = text_of(build_florist_brief(event, variant='request'))
        assert settings.FLORIST_SIGNUP_URL in text
        assert 'Claim this delivery' in text

    def test_claimed_brief_points_at_login(self, event):
        text = text_of(build_florist_brief(event, variant='claimed'))
        assert settings.FLORIST_LOGIN_URL in text
        assert 'Log in' in text

    def test_neither_variant_still_says_sign_up_or_log_in(self, event):
        for variant in ('request', 'claimed'):
            assert 'Sign up or log in' not in text_of(build_florist_brief(event, variant=variant))


@pytest.mark.django_db
def test_unknown_variant_is_rejected(event):
    with pytest.raises(ValueError):
        build_florist_brief(event, variant='whatever')
