import pytest
from datetime import date, timedelta
from io import BytesIO

from pypdf import PdfReader

from data_management.models import Notification
from data_management.utils.notification_factory import notify_florist_of_claim
from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory


@pytest.fixture
def claim(db):
    florist = BusinessAccountFactory(account_type='florist', status='active')
    event = EventFactory(
        delivery_date=date.today() + timedelta(days=5),
        message='Happy birthday Mum!',
        order__recipient_last_name='Chen',
        order__recipient_street_address='12 Read Street',
        order__recipient_suburb='Rockingham',
        order__recipient_state='WA',
    )
    return DeliveryRequestFactory(event=event, business_account=florist, status='accepted')


@pytest.mark.django_db
class TestNotifyFloristOfClaim:
    def test_congratulates_the_florist_who_claimed_it(self, mocker, claim):
        mocker.patch('data_management.utils.send_notification.send_notification')

        notification = notify_florist_of_claim(claim)

        assert notification.recipient_business_account == claim.business_account
        assert claim.event.reference in notification.subject
        assert 'Congratulations' in notification.body

    def test_sends_immediately(self, mocker, claim):
        send = mocker.patch('data_management.utils.send_notification.send_notification')

        notify_florist_of_claim(claim)

        send.assert_called_once()

    def test_attaches_the_full_brief_with_address_and_card_message(self, mocker, claim):
        """Claiming is the moment the recipient's details are released."""
        send = mocker.patch('data_management.utils.send_notification.send_notification')

        notify_florist_of_claim(claim)

        _, pdf_bytes, _ = send.call_args.kwargs['attachments'][0]
        text = PdfReader(BytesIO(pdf_bytes)).pages[0].extract_text()
        assert 'Read Street' in text
        assert 'Chen' in text
        assert 'Happy birthday Mum' in text

    def test_body_tells_them_what_they_will_be_paid(self, mocker, claim):
        mocker.patch('data_management.utils.send_notification.send_notification')

        notification = notify_florist_of_claim(claim)

        assert str(claim.event.florist_total) in notification.body

    def test_is_linked_to_the_event_for_auditing(self, mocker, claim):
        mocker.patch('data_management.utils.send_notification.send_notification')

        notification = notify_florist_of_claim(claim)

        assert notification.related_event == claim.event
        assert Notification.objects.filter(pk=notification.pk).exists()
