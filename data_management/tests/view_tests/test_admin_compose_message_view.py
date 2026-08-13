import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from data_management.models import Notification
from users.tests.factories.user_factory import UserFactory


URL = '/api/data/admin/messages/compose/'


def sent(notification, attachments=None):
    notification.status = 'sent'
    notification.save(update_fields=['status'])


@pytest.mark.django_db
class TestAdminComposeMessageView:
    def setup_method(self):
        self.client = APIClient()
        self.client.force_authenticate(user=UserFactory(is_staff=True, is_superuser=True))

    def test_sends_and_records_a_manual_email(self, mocker):
        mocker.patch('data_management.utils.send_notification.send_notification', sent)

        response = self.client.post(
            URL,
            {'to': 'hello@example.com', 'subject': 'Hello', 'body': 'A hand-written message.'},
            format='json',
        )

        assert response.status_code == 200
        notification = Notification.objects.get(recipient_type='manual')
        assert notification.recipient_email == 'hello@example.com'
        assert notification.subject == 'Hello'
        assert notification.body == 'A hand-written message.'
        assert notification.related_event is None
        assert notification.status == 'sent'

    def test_sends_uploaded_files_as_attachments(self, mocker):
        captured = {}

        def send_with_attachment(notification, attachments=None):
            captured['attachments'] = attachments
            notification.status = 'sent'
            notification.save(update_fields=['status'])

        mocker.patch('data_management.utils.send_notification.send_notification', send_with_attachment)

        response = self.client.post(
            URL,
            {
                'to': 'hello@example.com', 'subject': 'Hello', 'body': 'Message',
                'attachments': SimpleUploadedFile(
                    'notes.txt', b'Attachment contents', content_type='text/plain',
                ),
            },
            format='multipart',
        )

        assert response.status_code == 200
        assert captured['attachments'] == [('notes.txt', b'Attachment contents', 'text/plain')]

    def test_rejects_an_invalid_recipient(self):
        response = self.client.post(
            URL, {'to': 'not-an-email', 'subject': 'Hello', 'body': 'Message'}, format='json',
        )

        assert response.status_code == 400
        assert not Notification.objects.filter(recipient_type='manual').exists()

    def test_records_a_failed_send(self, mocker):
        def failed(notification, attachments=None):
            notification.status = 'failed'
            notification.save(update_fields=['status'])

        mocker.patch('data_management.utils.send_notification.send_notification', failed)

        response = self.client.post(
            URL, {'to': 'hello@example.com', 'subject': 'Hello', 'body': 'Message'}, format='json',
        )

        assert response.status_code == 502
        assert Notification.objects.get(recipient_type='manual').status == 'failed'

    def test_requires_an_admin(self):
        client = APIClient()
        client.force_authenticate(user=UserFactory(is_staff=False))

        assert client.post(URL, {}, format='json').status_code == 403
