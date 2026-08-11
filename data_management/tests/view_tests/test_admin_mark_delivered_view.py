import pytest
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.models import Commission
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestAdminMarkDeliveredView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self, event_id):
        return f'/api/data/admin/events/{event_id}/mark-delivered/'

    def test_mark_delivered_success(self):
        event = EventFactory(status='claimed')
        payload = {
            'delivered_at': timezone.now().isoformat(),
            'delivery_evidence_text': 'Delivered to front door.',
        }
        response = self.client.post(self._url(event.id), payload, format='json')

        assert response.status_code == 200
        event.refresh_from_db()
        assert event.status == 'delivered'
        assert event.delivery_evidence_text == 'Delivered to front door.'

    def test_mark_delivered_creates_fulfillment_commission(self):
        """When there is an accepted DeliveryRequest, a fulfillment Commission is created."""
        plan = OrderFactory(billing_mode='one_time', budget=Decimal('120'))
        event = EventFactory(status='claimed', order=plan)
        partner = BusinessAccountFactory(account_type='florist')
        DeliveryRequestFactory(event=event, business_account=partner, status='accepted')

        payload = {'delivered_at': timezone.now().isoformat()}
        self.client.post(self._url(event.id), payload, format='json')

        commission = Commission.objects.get(event=event, commission_type='fulfillment')
        assert commission.business_account == partner
        # The payable is the florist's snapshotted total, whatever the rate was
        # when the event was priced — never the customer's budget.
        assert commission.amount == event.money_breakdown()['florist_total']
        assert commission.amount != plan.budget
        assert commission.amount != plan.budget
        assert commission.status == 'pending'

    def test_mark_delivered_no_commission_without_delivery_request(self):
        """No accepted DeliveryRequest → no fulfillment Commission created."""
        event = EventFactory(status='claimed')
        payload = {'delivered_at': timezone.now().isoformat()}
        self.client.post(self._url(event.id), payload, format='json')

        assert Commission.objects.filter(event=event, commission_type='fulfillment').count() == 0

    def test_mark_delivered_idempotent_no_duplicate_commission(self):
        """If a fulfillment Commission already exists for the event, another is not created."""
        plan = OrderFactory(billing_mode='one_time', budget=Decimal('120'))
        event = EventFactory(status='claimed', order=plan)
        partner = BusinessAccountFactory(account_type='florist')
        DeliveryRequestFactory(event=event, business_account=partner, status='accepted')

        payload = {'delivered_at': timezone.now().isoformat()}
        # First call creates the commission and marks delivered
        self.client.post(self._url(event.id), payload, format='json')

        assert Commission.objects.filter(event=event, commission_type='fulfillment').count() == 1

    def test_mark_delivered_requires_claimed_status(self):
        event = EventFactory(status='scheduled')
        payload = {'delivered_at': timezone.now().isoformat()}
        response = self.client.post(self._url(event.id), payload, format='json')

        assert response.status_code == 400
        event.refresh_from_db()
        assert event.status == 'scheduled'

    def test_mark_delivered_requires_delivered_at(self):
        event = EventFactory(status='claimed')
        response = self.client.post(self._url(event.id), {}, format='json')
        assert response.status_code == 400

    def test_mark_delivered_requires_admin(self):
        non_admin = UserFactory(is_staff=False, is_superuser=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)

        event = EventFactory(status='claimed')
        payload = {'delivered_at': timezone.now().isoformat()}
        response = client.post(self._url(event.id), payload, format='json')

        assert response.status_code == 403

    def test_mark_delivered_event_not_found(self):
        payload = {'delivered_at': timezone.now().isoformat()}
        response = self.client.post(self._url(99999), payload, format='json')
        assert response.status_code == 404
