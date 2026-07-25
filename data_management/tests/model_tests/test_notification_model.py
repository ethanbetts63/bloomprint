import pytest
from data_management.models import Notification
from data_management.tests.factories.notification_factory import NotificationFactory
from users.tests.factories.user_factory import UserFactory
from partners.tests.factories.partner_factory import PartnerFactory
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
def test_notification_recipient_customer():
    """
    Test creation of a notification for a customer user.
    """
    user = UserFactory()
    notification = NotificationFactory(recipient_type='customer', recipient_user=user, recipient_partner=None)
    assert notification.recipient_type == 'customer'
    assert notification.recipient_user == user
    assert notification.recipient_partner is None

@pytest.mark.django_db
def test_notification_stores_recipient_email():
    """
    Customer notifications carry the recipient email directly, so no user row
    is needed.
    """
    notification = NotificationFactory(
        recipient_type='customer',
        recipient_user=None,
        recipient_partner=None,
        recipient_email='buyer@example.com',
    )
    assert notification.recipient_email == 'buyer@example.com'


@pytest.mark.django_db
def test_notification_recipient_partner():
    """
    Test creation of a notification for a partner.
    """
    partner = PartnerFactory()
    notification = NotificationFactory(recipient_type='partner', recipient_partner=partner, recipient_user=None)
    assert notification.recipient_type == 'partner'
    assert notification.recipient_partner == partner
    assert notification.recipient_user is None

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
