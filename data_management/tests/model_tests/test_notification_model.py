import pytest
from data_management.models import Notification
from data_management.tests.factories.notification_factory import NotificationFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from events.tests.factories.event_factory import EventFactory

@pytest.mark.django_db
def test_notification_creation():
    """
    Test that a Notification can be created with default factory values.
    """
    notification = NotificationFactory()
    assert notification.pk is not None
    assert notification.status == 'pending'

@pytest.mark.django_db
def test_notification_stores_recipient_email():
    """
    Customer notifications carry the recipient email directly, so no user row
    is needed.
    """
    notification = NotificationFactory(
        recipient_type='customer',
        recipient_business_account=None,
        recipient_email='buyer@example.com',
    )
    assert notification.recipient_type == 'customer'
    assert notification.recipient_email == 'buyer@example.com'
    assert notification.recipient_business_account is None


@pytest.mark.django_db
def test_notification_recipient_business_account():
    """
    Test creation of a notification for a business account.
    """
    account = BusinessAccountFactory()
    notification = NotificationFactory(
        recipient_type='business_account',
        recipient_business_account=account,
        recipient_email=None,
    )
    assert notification.recipient_type == 'business_account'
    assert notification.recipient_business_account == account

@pytest.mark.django_db
def test_notification_status_choices():
    """
    Test that valid status choices are accepted.
    """
    for choice, _ in Notification.STATUS_CHOICES:
        notification = NotificationFactory(status=choice)
        assert notification.status == choice

@pytest.mark.django_db
def test_notification_related_event():
    """
    Test that a notification can be linked to an event.
    """
    event = EventFactory()
    notification = NotificationFactory(related_event=event)
    assert notification.related_event == event
