from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from events.models import Event
from events.tests.factories.event_factory import EventFactory
from partners.models import DeliveryRequest
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from users.tests.factories.user_factory import UserFactory


ROCKINGHAM = (-32.2767, 115.7297)
NEARBY = (-32.2140, 115.7297)
FAR_AWAY = (-33.8688, 151.2093)


def list_url(florist):
    return f'/api/business-accounts/admin/{florist.id}/available-deliveries/'


def claim_url(florist, event):
    return f'{list_url(florist)}{event.id}/claim/'


def florist_at(lat, lng, **kwargs):
    kwargs.setdefault('status', 'active')
    return BusinessAccountFactory(
        account_type='florist', latitude=lat, longitude=lng,
        service_radius_km=10, **kwargs,
    )


def event_at(lat, lng, **kwargs):
    defaults = {'delivery_date': date.today() + timedelta(days=5), 'status': 'scheduled'}
    defaults.update(kwargs)
    return EventFactory(order__latitude=lat, order__longitude=lng, **defaults)


@pytest.mark.django_db
class TestAdminAvailableDeliveryViews:
    def setup_method(self):
        self.client = APIClient()
        self.client.force_authenticate(user=UserFactory(is_staff=True, is_superuser=True))

    def test_lists_the_same_in_radius_delivery_as_the_florist_board(self):
        florist = florist_at(*ROCKINGHAM)
        visible = event_at(*NEARBY)
        event_at(*FAR_AWAY)

        response = self.client.get(list_url(florist))

        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['reference'] == visible.reference

    def test_claim_assigns_the_delivery_to_that_florist(self, mocker):
        notify = mocker.patch('data_management.utils.notification_factory.notify_florist_of_claim')
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        response = self.client.post(claim_url(florist, event))

        assert response.status_code == 201
        claim = DeliveryRequest.objects.get(event=event, status='accepted')
        assert claim.business_account == florist
        assert Event.objects.get(pk=event.pk).status == 'claimed'
        notify.assert_called_once_with(claim, assigned_by_admin=True)

    def test_pending_florist_has_no_board_and_cannot_be_assigned(self):
        florist = florist_at(*ROCKINGHAM, status='pending')
        event = event_at(*NEARBY)

        assert self.client.get(list_url(florist)).data['count'] == 0
        assert self.client.post(claim_url(florist, event)).status_code == 403
        assert not DeliveryRequest.objects.filter(event=event).exists()

    def test_non_admin_cannot_view_or_claim(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        client = APIClient()
        client.force_authenticate(user=UserFactory(is_staff=False))

        assert client.get(list_url(florist)).status_code == 403
        assert client.post(claim_url(florist, event)).status_code == 403

    def test_affiliate_account_is_not_a_claim_board(self):
        affiliate = BusinessAccountFactory(account_type='affiliate')

        assert self.client.get(list_url(affiliate)).status_code == 404
