import pytest
from datetime import date, timedelta

from rest_framework.test import APIClient

from events.models import Event
from events.tests.factories.event_factory import EventFactory
from partners.models import DeliveryRequest
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory

ROCKINGHAM = (-32.2767, 115.7297)
NEARBY = (-32.2140, 115.7297)
FAR_AWAY = (-33.8688, 151.2093)  # Sydney

BOARD_URL = '/api/business-accounts/available-deliveries/'


def claim_url(event):
    return f'/api/business-accounts/available-deliveries/{event.id}/claim/'


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
class TestAvailableDeliveryListView:
    def setup_method(self):
        self.client = APIClient()

    def test_board_lists_claimable_event_in_radius(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.get(BOARD_URL)

        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['reference'] == event.reference

    def test_board_withholds_recipient_pii(self):
        """Every florist in radius sees this, and none of them has committed yet."""
        florist = florist_at(*ROCKINGHAM)
        event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        row = self.client.get(BOARD_URL).data['results'][0]

        assert 'suburb' in row
        for leaked in ('recipient_name', 'recipient_first_name', 'recipient_street_address', 'message'):
            assert leaked not in row

    def test_board_excludes_events_outside_radius(self):
        florist = florist_at(*ROCKINGHAM)
        event_at(*FAR_AWAY)
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(BOARD_URL).data['count'] == 0

    def test_board_excludes_already_claimed_events(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        DeliveryRequestFactory(event=event, status='accepted')
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(BOARD_URL).data['count'] == 0

    def test_pending_florist_sees_an_empty_board(self):
        florist = florist_at(*ROCKINGHAM, status='pending')
        event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.get(BOARD_URL)

        assert response.status_code == 200
        assert response.data['count'] == 0

    def test_affiliate_gets_404(self):
        affiliate = BusinessAccountFactory(account_type='affiliate')
        self.client.force_authenticate(user=affiliate.user)
        assert self.client.get(BOARD_URL).status_code == 404

    def test_requires_auth(self):
        assert self.client.get(BOARD_URL).status_code in (401, 403)


@pytest.mark.django_db
class TestAvailableDeliveryDetailView:
    def setup_method(self):
        self.client = APIClient()

    def detail_url(self, event):
        return f'/api/business-accounts/available-deliveries/{event.id}/'

    def test_returns_the_full_non_pii_detail(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.get(self.detail_url(event))

        assert response.status_code == 200
        assert response.data['reference'] == event.reference
        assert 'flower_notes' in response.data
        assert 'suburb' in response.data

    def test_shows_the_full_money_breakdown(self):
        """Transparency: the florist can check our commission arithmetic."""
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        money = self.client.get(self.detail_url(event)).data['money']

        for field in ('budget', 'platform_commission', 'commission_rate',
                      'florist_budget', 'delivery_fee', 'florist_total'):
            assert field in money, field
        assert money['commission_rate'].endswith('%')

    def test_money_matches_the_brief(self):
        """One source, so the PDF and the dashboard cannot show different figures."""
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        money = self.client.get(self.detail_url(event)).data['money']

        expected = {key: str(value) for key, value in event.money_breakdown().items()}
        assert money == expected

    def test_still_withholds_recipient_pii(self):
        florist = florist_at(*ROCKINGHAM)
        event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        data = self.client.get(self.detail_url(Event.objects.latest('id'))).data

        for leaked in ('recipient_name', 'recipient_street_address', 'message', 'delivery_notes'):
            assert leaked not in data

    def test_outside_service_area_is_404_not_403(self):
        """Whether a delivery exists elsewhere is not something you get to learn."""
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*FAR_AWAY)
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(self.detail_url(event)).status_code == 404

    def test_claimed_delivery_returns_409(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        DeliveryRequestFactory(event=event, status='accepted')
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(self.detail_url(event)).status_code == 409

    def test_pending_florist_is_forbidden(self):
        florist = florist_at(*ROCKINGHAM, status='pending')
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(self.detail_url(event)).status_code == 403

    def test_requires_auth(self):
        event = event_at(*NEARBY)
        assert self.client.get(self.detail_url(event)).status_code in (401, 403)


@pytest.mark.django_db
class TestClaimDeliveryView:
    def setup_method(self):
        self.client = APIClient()

    def test_claim_emails_the_florist_a_confirmation(self, mocker):
        notify = mocker.patch(
            'data_management.utils.notification_factory.notify_florist_of_claim'
        )
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        self.client.post(claim_url(event))

        notify.assert_called_once()

    def test_claim_survives_a_failing_confirmation_email(self, mocker):
        """The claim is committed; an email failure must not undo it."""
        mocker.patch(
            'data_management.utils.notification_factory.notify_florist_of_claim',
            side_effect=RuntimeError('mailgun down'),
        )
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.post(claim_url(event))

        assert response.status_code == 201
        assert DeliveryRequest.objects.filter(event=event, status='accepted').exists()

    def test_claim_creates_accepted_delivery_request(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.post(claim_url(event))

        assert response.status_code == 201
        assert response.data['status'] == 'claimed'
        dr = DeliveryRequest.objects.get(event=event)
        assert dr.business_account == florist
        assert dr.status == 'accepted'
        assert dr.responded_at is not None

    def test_claim_returns_token_for_the_job_sheet(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        token = self.client.post(claim_url(event)).data['token']

        detail = self.client.get(f'/api/business-accounts/delivery-requests/{token}/details/')
        assert detail.status_code == 200

    def test_second_claim_on_same_event_conflicts(self):
        winner = florist_at(*ROCKINGHAM)
        loser = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)

        self.client.force_authenticate(user=winner.user)
        assert self.client.post(claim_url(event)).status_code == 201

        self.client.force_authenticate(user=loser.user)
        response = self.client.post(claim_url(event))

        assert response.status_code == 409
        assert DeliveryRequest.objects.filter(event=event).count() == 1

    def test_cannot_claim_outside_service_area(self):
        """The board is a suggestion; the client can post any event id."""
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*FAR_AWAY)
        self.client.force_authenticate(user=florist.user)

        response = self.client.post(claim_url(event))

        assert response.status_code == 403
        assert not DeliveryRequest.objects.filter(event=event).exists()

    def test_cannot_claim_ungeocoded_order(self):
        florist = florist_at(*ROCKINGHAM, radius_km=500)
        event = EventFactory(order__latitude=None, order__longitude=None)
        self.client.force_authenticate(user=florist.user)

        assert self.client.post(claim_url(event)).status_code == 403

    def test_cannot_claim_past_event(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY, delivery_date=date.today() - timedelta(days=1))
        self.client.force_authenticate(user=florist.user)

        assert self.client.post(claim_url(event)).status_code == 409

    def test_pending_florist_cannot_claim(self):
        florist = florist_at(*ROCKINGHAM, status='pending')
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        assert self.client.post(claim_url(event)).status_code == 403

    def test_affiliate_cannot_claim(self):
        affiliate = BusinessAccountFactory(account_type='affiliate')
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=affiliate.user)

        assert self.client.post(claim_url(event)).status_code == 404

    def test_unknown_event_returns_404(self):
        florist = florist_at(*ROCKINGHAM)
        self.client.force_authenticate(user=florist.user)

        assert self.client.post('/api/business-accounts/available-deliveries/999999/claim/').status_code == 404

    def test_requires_auth(self):
        event = event_at(*NEARBY)
        assert self.client.post(claim_url(event)).status_code in (401, 403)

    def test_claimed_event_leaves_the_board(self):
        florist = florist_at(*ROCKINGHAM)
        event = event_at(*NEARBY)
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(BOARD_URL).data['count'] == 1
        self.client.post(claim_url(event))
        assert self.client.get(BOARD_URL).data['count'] == 0
