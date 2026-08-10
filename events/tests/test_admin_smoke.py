"""
Admin changelists are the operator's window onto whether geocoding and claiming
worked. A display callable that raises only fails at render time, which
manage.py check cannot catch — so render them.
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory

User = get_user_model()


@pytest.fixture
def admin_client(db):
    User.objects.create_superuser(username='root', email='root@example.com', password='pw')
    client = Client()
    client.login(username='root', password='pw')
    return client


@pytest.mark.django_db
class TestAdminChangelistsRender:
    def test_order_changelist_shows_geocoded_column(self, admin_client):
        EventFactory(order__latitude=-32.28, order__longitude=115.73)
        EventFactory(order__latitude=None, order__longitude=None)

        response = admin_client.get('/admin/events/order/')

        assert response.status_code == 200
        assert b'Geocoded' in response.content

    def test_order_changelist_filters_by_missing_coordinates(self, admin_client):
        """The filter that answers 'why is this order reaching nobody?'."""
        EventFactory(order__latitude=-32.28, order__longitude=115.73)
        EventFactory(order__latitude=None, order__longitude=None)

        both = admin_client.get('/admin/events/order/')
        empty_only = admin_client.get('/admin/events/order/?latitude__isempty=1')

        assert both.context['cl'].result_count == 2
        assert empty_only.context['cl'].result_count == 1

    def test_event_changelist_shows_unclaimed_and_claimed(self, admin_client):
        florist = BusinessAccountFactory(account_type='florist', business_name='Petal Pushers')
        claimed = EventFactory()
        DeliveryRequestFactory(event=claimed, business_account=florist, status='accepted')
        EventFactory()

        response = admin_client.get('/admin/events/event/')

        assert response.status_code == 200
        assert b'Petal Pushers' in response.content
        assert b'Unclaimed' in response.content

    def test_delivery_request_changelist_renders(self, admin_client):
        DeliveryRequestFactory(status='accepted')

        response = admin_client.get('/admin/partners/deliveryrequest/')

        assert response.status_code == 200

    def test_order_change_form_exposes_coordinates_for_manual_fix(self, admin_client):
        """An admin must be able to hand-correct a pin Nominatim got wrong."""
        event = EventFactory(order__latitude=None, order__longitude=None)

        response = admin_client.get(f'/admin/events/order/{event.order.id}/change/')

        assert response.status_code == 200
        assert b'id_latitude' in response.content
        assert b'id_longitude' in response.content
