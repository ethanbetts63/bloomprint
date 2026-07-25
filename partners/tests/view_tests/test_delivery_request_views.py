import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.partner_factory import PartnerFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.event_factory import EventFactory
from partners.models import Commission


@pytest.mark.django_db
class TestDeliveryRequestViews:
    def setup_method(self):
        self.client = APIClient()

    def test_detail_view_success(self):
        dr = DeliveryRequestFactory()
        url = f"/api/partners/delivery-requests/{dr.token}/details/"
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['id'] == dr.id

    def test_respond_accept_success(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "accept"}, format='json')

        assert response.status_code == 200
        dr.refresh_from_db()
        assert dr.status == 'accepted'

    def test_respond_decline_creates_commission_if_sourced(self, mocker):
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = PartnerFactory()
        # budget=100: tier calculation returns $10
        event = EventFactory(order__user=None, order__referred_by_partner=partner, order__budget=100)
        dr = DeliveryRequestFactory(partner=partner, event=event, status='pending')

        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "decline"}, format='json')

        assert response.status_code == 200
        dr.refresh_from_db()
        assert dr.status == 'declined'

        commission = Commission.objects.get(partner=partner, event=event)
        assert commission.amount == Decimal('10')
        assert commission.commission_type == 'referral'
        assert commission.status == 'pending'

    def test_respond_decline_uses_event_commission_amount_snapshot(self, mocker):
        """If event.commission_amount is already set, it takes precedence over recalculation."""
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = PartnerFactory()
        # Snapshot of $7 overrides the tier-calculated $10 for budget=100
        event = EventFactory(order__user=None, order__referred_by_partner=partner, order__budget=100, commission_amount=Decimal('7'))
        dr = DeliveryRequestFactory(partner=partner, event=event, status='pending')

        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        commission = Commission.objects.get(partner=partner, event=event)
        assert commission.amount == Decimal('7')

    def test_respond_decline_no_commission_if_not_referred_by_partner(self, mocker):
        """No commission when the declining florist did not refer the customer."""
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = PartnerFactory()
        other_partner = PartnerFactory()
        event = EventFactory(order__user=None, order__referred_by_partner=other_partner, order__budget=100)
        dr = DeliveryRequestFactory(partner=partner, event=event, status='pending')

        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        assert Commission.objects.filter(partner=partner, event=event).count() == 0

    def test_respond_decline_triggers_reassignment(self, mocker):
        mock_reassign = mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        mock_reassign.assert_called_once()

    def test_respond_already_responded_returns_400(self):
        dr = DeliveryRequestFactory(status='accepted')
        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "decline"}, format='json')
        assert response.status_code == 400

    def test_respond_invalid_action_returns_400(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/partners/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "snooze"}, format='json')
        assert response.status_code == 400

    def test_mark_delivered_success(self):
        dr = DeliveryRequestFactory(status='accepted')
        url = f"/api/partners/delivery-requests/{dr.token}/mark-delivered/"
        response = self.client.post(url)

        assert response.status_code == 200
        dr.event.refresh_from_db()
        assert dr.event.status == 'delivered'

    def test_mark_delivered_not_accepted_returns_400(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/partners/delivery-requests/{dr.token}/mark-delivered/"
        response = self.client.post(url)
        assert response.status_code == 400
