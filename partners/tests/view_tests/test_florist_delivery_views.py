import pytest
from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APIClient

from events.tests.factories.event_factory import EventFactory
from partners.models import Commission
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory


def claim_for(florist, **event_kwargs):
    event_kwargs.setdefault('status', 'claimed')
    event_kwargs.setdefault('delivery_date', date.today())
    event = EventFactory(order__budget=Decimal('100'), **event_kwargs)
    return DeliveryRequestFactory(event=event, business_account=florist, status='accepted')


def florist_account(**kwargs):
    kwargs.setdefault('status', 'active')
    return BusinessAccountFactory(account_type='florist', **kwargs)


@pytest.mark.django_db
class TestFloristDeliveryDetailView:
    def setup_method(self):
        self.client = APIClient()

    def url(self, claim):
        return f'/api/business-accounts/delivery-requests/{claim.id}/'

    def test_returns_the_job_sheet_for_your_own_claim(self):
        florist = florist_account()
        claim = claim_for(florist)
        self.client.force_authenticate(user=florist.user)

        response = self.client.get(self.url(claim))

        assert response.status_code == 200
        assert response.data['reference'] == claim.event.reference
        assert 'recipient_street_address' in response.data
        assert 'card_from' in response.data

    def test_another_florists_claim_is_404(self):
        """The PII on this page belongs to one florist's job, not everyone's."""
        mine = florist_account()
        theirs = florist_account()
        claim = claim_for(theirs)
        self.client.force_authenticate(user=mine.user)

        assert self.client.get(self.url(claim)).status_code == 404

    def test_requires_auth(self):
        claim = claim_for(florist_account())
        assert self.client.get(self.url(claim)).status_code in (401, 403)

    def test_pending_florist_is_404(self):
        florist = florist_account(status='pending')
        claim = claim_for(florist)
        self.client.force_authenticate(user=florist.user)

        assert self.client.get(self.url(claim)).status_code == 404


@pytest.mark.django_db
class TestFloristMarkDeliveredView:
    def setup_method(self):
        self.client = APIClient()

    def url(self, claim):
        return f'/api/business-accounts/delivery-requests/{claim.id}/mark-delivered/'

    def test_marks_delivered_and_creates_the_payable(self):
        florist = florist_account()
        claim = claim_for(florist)
        self.client.force_authenticate(user=florist.user)

        response = self.client.post(self.url(claim))

        assert response.status_code == 200
        claim.event.refresh_from_db()
        assert claim.event.status == 'delivered'
        assert claim.event.delivered_at is not None

        commission = Commission.objects.get(event=claim.event, commission_type='fulfillment')
        assert commission.business_account == florist
        assert commission.amount == claim.event.money_breakdown()['florist_total']

    def test_is_idempotent(self):
        florist = florist_account()
        claim = claim_for(florist)
        self.client.force_authenticate(user=florist.user)

        self.client.post(self.url(claim))
        second = self.client.post(self.url(claim))

        assert second.status_code == 200
        assert second.data['already'] is True
        assert Commission.objects.filter(event=claim.event, commission_type='fulfillment').count() == 1

    def test_cannot_mark_another_florists_delivery(self):
        mine = florist_account()
        theirs = florist_account()
        claim = claim_for(theirs)
        self.client.force_authenticate(user=mine.user)

        assert self.client.post(self.url(claim)).status_code == 404
        assert not Commission.objects.filter(event=claim.event).exists()

    def test_cannot_mark_a_cancelled_delivery(self):
        florist = florist_account()
        claim = claim_for(florist, status='cancelled')
        self.client.force_authenticate(user=florist.user)

        assert self.client.post(self.url(claim)).status_code == 400

    def test_pending_florist_cannot_mark_delivered(self):
        florist = florist_account(status='pending')
        claim = claim_for(florist)
        self.client.force_authenticate(user=florist.user)

        assert self.client.post(self.url(claim)).status_code == 404

    def test_requires_auth(self):
        claim = claim_for(florist_account())
        assert self.client.post(self.url(claim)).status_code in (401, 403)
        assert not Commission.objects.filter(event=claim.event).exists()
