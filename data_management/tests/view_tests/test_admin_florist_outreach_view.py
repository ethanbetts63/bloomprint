import pytest
from datetime import date, timedelta
from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from pypdf import PdfReader
from rest_framework.test import APIClient

from data_management.models import Notification
from events.tests.factories.event_factory import EventFactory

User = get_user_model()


@pytest.fixture
def admin_api(db):
    admin = User.objects.create_superuser(
        username='root', email='root@example.com', password='pw'
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def event(db):
    return EventFactory(
        delivery_date=date.today() + timedelta(days=10),
        order__budget=Decimal('100'),
        order__latitude=-32.2767,
        order__longitude=115.7297,
        order__recipient_suburb='Rockingham',
        order__recipient_state='WA',
        order__recipient_first_name='Sarah',
        order__recipient_last_name='Chen',
        order__recipient_street_address='12 Read Street',
        message='Happy birthday Mum!',
    )


def url(event):
    return f'/api/data/admin/events/{event.id}/florist-outreach/'


@pytest.mark.django_db
class TestOutreachDraft:
    def test_returns_a_prefilled_subject_and_body(self, admin_api, event):
        response = admin_api.get(url(event))

        assert response.status_code == 200
        assert response.data['subject']
        assert 'Hi there' in response.data['body']

    def test_draft_carries_the_area_date_and_payment(self, admin_api, event):
        data = admin_api.get(url(event)).data

        assert 'Rockingham' in data['body']
        # Day-month-year, not ISO: this is read by a florist, not a machine.
        assert f'{event.delivery_date.day} {event.delivery_date:%B %Y}' in data['body']
        assert data['florist_total'] in data['body']

    def test_draft_pitches_signing_up_rather_than_claiming(self, admin_api, event):
        """The reader has no account, so 'claim it on your dashboard' is useless."""
        body = admin_api.get(url(event)).data['body']

        assert '/florists' in body
        assert 'reply to this email' in body

    def test_draft_withholds_recipient_pii(self, admin_api, event):
        """This goes to a stranger who has not taken the job."""
        body = admin_api.get(url(event)).data['body']

        assert 'Chen' not in body
        assert 'Read Street' not in body
        assert 'Happy birthday Mum' not in body

    def test_draft_does_not_prefill_a_recipient(self, admin_api, event):
        assert 'to' not in admin_api.get(url(event)).data

    def test_flags_an_ungeocoded_delivery(self, admin_api):
        """Signing up would not help — it never reaches the board."""
        ungeocoded = EventFactory(order__latitude=None, order__longitude=None)

        assert admin_api.get(url(ungeocoded)).data['is_geocoded'] is False

    def test_unknown_event_is_404(self, admin_api):
        assert admin_api.get('/api/data/admin/events/999999/florist-outreach/').status_code == 404

    def test_requires_admin(self, db, event):
        assert APIClient().get(url(event)).status_code in (401, 403)


def fake_send(status='sent'):
    """
    Stands in for send_notification, which conftest mocks globally.

    Returns (fake, captured) — the fake records the attachments it was handed
    and sets the status the real sender would have set, so the view's success
    and failure branches can both be exercised.
    """
    captured = {}

    def _send(notification, attachments=None):
        captured['attachments'] = attachments
        notification.status = status
        notification.save(update_fields=['status'])

    return _send, captured


@pytest.mark.django_db
class TestSendOutreach:
    def test_sends_and_records_what_went_out(self, admin_api, event, mocker):
        send, _ = fake_send()
        mocker.patch('data_management.utils.send_notification.send_notification', send)

        response = admin_api.post(
            url(event),
            {'to': 'shop@example.com', 'subject': 'Delivery', 'body': 'Hello there'},
            format='json',
        )

        assert response.status_code == 200
        notification = Notification.objects.get(
            related_event=event, recipient_type='florist_prospect'
        )
        assert notification.recipient_email == 'shop@example.com'
        assert notification.subject == 'Delivery'
        assert notification.body == 'Hello there'
        assert notification.status == 'sent'

    def test_attaches_the_request_brief_without_pii(self, admin_api, event, mocker):
        send, captured = fake_send()
        mocker.patch('data_management.utils.send_notification.send_notification', send)

        admin_api.post(
            url(event),
            {'to': 'shop@example.com', 'subject': 'Delivery', 'body': 'Hello'},
            format='json',
        )

        filename, pdf_bytes, mimetype = captured['attachments'][0]
        assert filename.endswith('.pdf')
        assert mimetype == 'application/pdf'

        text = PdfReader(BytesIO(pdf_bytes)).pages[0].extract_text()
        assert 'Rockingham' in text
        assert 'Read Street' not in text
        assert 'Chen' not in text
        assert 'Happy birthday Mum' not in text

    def test_can_attach_the_full_brief_with_pii(self, admin_api, event, mocker):
        send, captured = fake_send()
        mocker.patch('data_management.utils.send_notification.send_notification', send)

        admin_api.post(
            url(event),
            {
                'to': 'shop@example.com', 'subject': 'Delivery', 'body': 'Hello',
                'brief_variant': 'claimed',
            },
            format='json',
        )

        _, pdf_bytes, _ = captured['attachments'][0]
        text = PdfReader(BytesIO(pdf_bytes)).pages[0].extract_text()
        assert 'Read Street' in text
        assert 'Chen' in text

    def test_rejects_an_unknown_brief_variant(self, admin_api, event):
        response = admin_api.post(
            url(event),
            {
                'to': 'shop@example.com', 'subject': 'Delivery', 'body': 'Hello',
                'brief_variant': 'everything',
            },
            format='json',
        )

        assert response.status_code == 400
        assert not Notification.objects.filter(recipient_type='florist_prospect').exists()

    def test_rejects_a_missing_recipient(self, admin_api, event):
        response = admin_api.post(
            url(event), {'subject': 'Delivery', 'body': 'Hello'}, format='json'
        )
        assert response.status_code == 400
        assert not Notification.objects.filter(recipient_type='florist_prospect').exists()

    def test_rejects_a_malformed_recipient(self, admin_api, event):
        response = admin_api.post(
            url(event), {'to': 'not-an-email', 'subject': 'x', 'body': 'y'}, format='json'
        )
        assert response.status_code == 400

    def test_rejects_an_empty_body(self, admin_api, event):
        response = admin_api.post(
            url(event), {'to': 'shop@example.com', 'subject': 'x', 'body': '   '}, format='json'
        )
        assert response.status_code == 400

    def test_a_failed_send_is_recorded_and_reported(self, admin_api, event, mocker):
        """Admin must not be told it went out when it did not."""
        send, _ = fake_send(status='failed')
        mocker.patch('data_management.utils.send_notification.send_notification', send)

        response = admin_api.post(
            url(event),
            {'to': 'shop@example.com', 'subject': 'Delivery', 'body': 'Hello'},
            format='json',
        )

        assert response.status_code == 502
        assert Notification.objects.get(recipient_type='florist_prospect').status == 'failed'

    def test_requires_admin(self, db, event):
        assert APIClient().post(url(event), {}, format='json').status_code in (401, 403)
