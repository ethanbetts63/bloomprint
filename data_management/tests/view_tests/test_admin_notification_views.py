import pytest
from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from data_management.models import Notification
from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory

User = get_user_model()

LIST_URL = '/api/data/admin/messages/'


@pytest.fixture
def admin_api(db):
    User.objects.create_superuser(username='root', email='root@example.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=User.objects.get(username='root'))
    return client


def notification(**kwargs):
    kwargs.setdefault('recipient_type', 'florist_prospect')
    kwargs.setdefault('recipient_email', 'shop@example.com')
    kwargs.setdefault('channel', 'email')
    kwargs.setdefault('subject', 'A delivery for you')
    kwargs.setdefault('body', 'Hi there')
    kwargs.setdefault('scheduled_for', date.today())
    return Notification.objects.create(**kwargs)


@pytest.mark.django_db
class TestMessageList:
    def test_lists_messages_newest_first(self, admin_api):
        older = notification(subject='Older')
        newer = notification(subject='Newer')

        results = admin_api.get(LIST_URL).data['results']

        assert [row['id'] for row in results] == [newer.id, older.id]

    def test_scopes_to_one_delivery(self, admin_api):
        """This is what powers the history box on the event page."""
        event = EventFactory()
        mine = notification(related_event=event)
        notification(subject='Unrelated')

        results = admin_api.get(LIST_URL, {'related_event': event.id}).data['results']

        assert [row['id'] for row in results] == [mine.id]

    def test_resolves_the_recipient_address(self, admin_api):
        notification(recipient_email='shop@example.com')

        assert admin_api.get(LIST_URL).data['results'][0]['to'] == 'shop@example.com'

    def test_resolves_a_business_account_recipient(self, admin_api):
        florist = BusinessAccountFactory(account_type='florist', business_name='Petal Pushers')
        notification(
            recipient_type='business_account',
            recipient_email=None,
            recipient_business_account=florist,
        )

        row = admin_api.get(LIST_URL).data['results'][0]

        assert row['recipient_name'] == 'Petal Pushers'
        assert row['to'] == florist.user.email

    def test_filters_by_status(self, admin_api):
        failed = notification(status='failed')
        notification(status='sent')

        results = admin_api.get(LIST_URL, {'status': 'failed'}).data['results']

        assert [row['id'] for row in results] == [failed.id]

    def test_filters_by_recipient_type(self, admin_api):
        outreach = notification(recipient_type='florist_prospect')
        notification(recipient_type='admin', recipient_email=None)

        results = admin_api.get(LIST_URL, {'recipient_type': 'florist_prospect'}).data['results']

        assert [row['id'] for row in results] == [outreach.id]

    def test_searches_subject_and_body(self, admin_api):
        match = notification(subject='Rockingham delivery')
        notification(subject='Somewhere else')

        results = admin_api.get(LIST_URL, {'search': 'rockingham'}).data['results']

        assert [row['id'] for row in results] == [match.id]

    def test_searches_by_event_reference(self, admin_api):
        event = EventFactory()
        match = notification(related_event=event, subject='x')
        notification(subject='y')

        results = admin_api.get(LIST_URL, {'search': event.reference}).data['results']

        assert [row['id'] for row in results] == [match.id]

    def test_list_does_not_include_the_body(self, admin_api):
        """Kept off the list so a page of rows is not a page of full emails."""
        notification()

        assert 'body' not in admin_api.get(LIST_URL).data['results'][0]

    def test_requires_admin(self, db):
        assert APIClient().get(LIST_URL).status_code in (401, 403)


@pytest.mark.django_db
class TestMessageDetail:
    def test_returns_the_body_that_was_sent(self, admin_api):
        message = notification(body='The exact text that went out.')

        response = admin_api.get(f'{LIST_URL}{message.id}/')

        assert response.status_code == 200
        assert response.data['body'] == 'The exact text that went out.'

    def test_returns_the_failure_reason(self, admin_api):
        message = notification(status='failed', error_message='mailgun down')

        assert admin_api.get(f'{LIST_URL}{message.id}/').data['error_message'] == 'mailgun down'

    def test_links_back_to_the_delivery(self, admin_api):
        event = EventFactory()
        message = notification(related_event=event)

        data = admin_api.get(f'{LIST_URL}{message.id}/').data

        assert data['related_event'] == event.id
        assert data['related_event_reference'] == event.reference

    def test_unknown_message_is_404(self, admin_api):
        assert admin_api.get(f'{LIST_URL}999999/').status_code == 404

    def test_requires_admin(self, db):
        message = notification()
        assert APIClient().get(f'{LIST_URL}{message.id}/').status_code in (401, 403)
