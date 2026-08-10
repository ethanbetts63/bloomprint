import pytest
from datetime import date, timedelta

from data_management.models import Notification
from data_management.utils.notification_factory import notify_florists_of_new_delivery
from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory

ROCKINGHAM = (-32.2767, 115.7297)
NEARBY = (-32.2140, 115.7297)
FAR_AWAY = (-33.8688, 151.2093)


def florist_at(lat, lng, radius_km=10, **kwargs):
    kwargs.setdefault('status', 'active')
    return BusinessAccountFactory(
        account_type='florist',
        latitude=lat, longitude=lng, service_radius_km=radius_km, **kwargs
    )


def event_at(lat, lng, **kwargs):
    defaults = {'delivery_date': date.today() + timedelta(days=5), 'status': 'scheduled'}
    defaults.update(kwargs)
    return EventFactory(order__latitude=lat, order__longitude=lng, **defaults)


@pytest.mark.django_db
class TestNotifyFloristsOfNewDelivery:
    def test_notifies_every_eligible_florist(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification')
        one = florist_at(*ROCKINGHAM)
        two = florist_at(*NEARBY)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        notified = set(
            Notification.objects.filter(related_event=event, recipient_type='business_account')
            .values_list('recipient_business_account_id', flat=True)
        )
        assert notified == {one.id, two.id}

    def test_does_not_notify_florists_outside_radius(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*FAR_AWAY)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        assert not Notification.objects.filter(
            related_event=event, recipient_type='business_account'
        ).exists()

    def test_does_not_notify_pending_florists(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM, status='pending')
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        assert not Notification.objects.filter(
            related_event=event, recipient_type='business_account'
        ).exists()

    def test_ungeocoded_order_notifies_nobody(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM, radius_km=500)
        event = EventFactory(order__latitude=None, order__longitude=None)

        assert notify_florists_of_new_delivery(event) == []

    def test_sends_immediately_rather_than_queueing_for_the_cron(self, mocker):
        """A daily queue would decide a first-come-first-served race by cron schedule."""
        send = mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        assert send.call_count == 1

    def test_failed_send_stays_pending_for_the_cron_to_retry(self, mocker):
        # send_notification swallows its own errors and leaves status='pending'.
        mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        notification = Notification.objects.get(
            related_event=event, recipient_type='business_account'
        )
        assert notification.status == 'pending'
        assert notification.scheduled_for == date.today()

    def test_attaches_the_request_brief_without_recipient_pii(self, mocker):
        """Every florist in radius receives this, and email cannot be unsent."""
        from pypdf import PdfReader
        from io import BytesIO

        send = mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM)
        event = event_at(
            *NEARBY,
            message='Happy birthday Mum!',
            order__recipient_last_name='Chen',
            order__recipient_street_address='12 Read Street',
        )

        notify_florists_of_new_delivery(event)

        attachments = send.call_args.kwargs['attachments']
        filename, pdf_bytes, mimetype = attachments[0]
        assert filename.endswith('.pdf')
        assert mimetype == 'application/pdf'

        text = PdfReader(BytesIO(pdf_bytes)).pages[0].extract_text()
        assert 'Read Street' not in text
        assert 'Chen' not in text
        assert 'Happy birthday Mum' not in text

    def test_a_broken_pdf_does_not_stop_the_email(self, mocker):
        """Without the brief a florist can still claim; without the email they cannot."""
        send = mocker.patch('data_management.utils.send_notification.send_notification')
        mocker.patch(
            'data_management.utils.florist_brief_pdf.build_florist_brief',
            side_effect=RuntimeError('reportlab exploded'),
        )
        florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        send.assert_called_once()
        assert send.call_args.kwargs['attachments'] is None

    def test_body_carries_the_reference_and_florist_payment(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification')
        florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        notify_florists_of_new_delivery(event)

        body = Notification.objects.get(
            related_event=event, recipient_type='business_account'
        ).body
        assert event.reference in body
        assert str(event.florist_total) in body
