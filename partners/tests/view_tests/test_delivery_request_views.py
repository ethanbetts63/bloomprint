import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.event_factory import EventFactory
from partners.models import Commission


@pytest.mark.django_db
class TestDeliveryRequestViews:
    def setup_method(self):
        self.client = APIClient()

    def test_list_is_paginated_scoped_and_filtered_for_florist(self):
        florist = BusinessAccountFactory(account_type='florist')
        matching = DeliveryRequestFactory(business_account=florist, status='accepted', event__order__recipient_first_name='Alice', event__order__recipient_last_name='Flower')
        DeliveryRequestFactory(business_account=florist, status='pending')
        DeliveryRequestFactory(business_account=BusinessAccountFactory(account_type='florist'), status='accepted')
        self.client.force_authenticate(user=florist.user)

        response = self.client.get('/api/business-accounts/delivery-requests/?status=accepted&search=alice&ordering=recipient')

        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['id'] == matching.id

    def test_delivery_list_rejects_affiliate(self):
        affiliate = BusinessAccountFactory(account_type='affiliate')
        self.client.force_authenticate(user=affiliate.user)
        assert self.client.get('/api/business-accounts/delivery-requests/').status_code == 404

    def test_detail_view_success(self):
        dr = DeliveryRequestFactory()
        url = f"/api/business-accounts/delivery-requests/{dr.token}/details/"
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['id'] == dr.id

    def test_respond_accept_success(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "accept"}, format='json')

        assert response.status_code == 200
        dr.refresh_from_db()
        assert dr.status == 'accepted'

    def test_respond_decline_creates_commission_if_sourced(self, mocker):
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = BusinessAccountFactory()
        # budget=100: tier calculation returns $10
        event = EventFactory(order__referred_by_affiliate=partner, order__budget=100)
        dr = DeliveryRequestFactory(business_account=partner, event=event, status='pending')

        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "decline"}, format='json')

        assert response.status_code == 200
        dr.refresh_from_db()
        assert dr.status == 'declined'

        commission = Commission.objects.get(business_account=partner, event=event)
        assert commission.amount == Decimal('10')
        assert commission.commission_type == 'referral'
        assert commission.status == 'pending'

    def test_respond_decline_uses_event_commission_amount_snapshot(self, mocker):
        """If event.commission_amount is already set, it takes precedence over recalculation."""
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = BusinessAccountFactory()
        # Snapshot of $7 overrides the tier-calculated $10 for budget=100
        event = EventFactory(order__referred_by_affiliate=partner, order__budget=100, commission_amount=Decimal('7'))
        dr = DeliveryRequestFactory(business_account=partner, event=event, status='pending')

        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        commission = Commission.objects.get(business_account=partner, event=event)
        assert commission.amount == Decimal('7')

    def test_respond_decline_no_commission_if_not_referred_by_affiliate(self, mocker):
        """No commission when the declining florist did not refer the customer."""
        mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        partner = BusinessAccountFactory()
        other_partner = BusinessAccountFactory()
        event = EventFactory(order__referred_by_affiliate=other_partner, order__budget=100)
        dr = DeliveryRequestFactory(business_account=partner, event=event, status='pending')

        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        assert Commission.objects.filter(business_account=partner, event=event).count() == 0

    def test_respond_decline_triggers_reassignment(self, mocker):
        mock_reassign = mocker.patch('partners.utils.reassignment.reassign_delivery_request')

        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        self.client.post(url, {"action": "decline"}, format='json')

        mock_reassign.assert_called_once()

    def test_respond_already_responded_returns_400(self):
        dr = DeliveryRequestFactory(status='accepted')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "decline"}, format='json')
        assert response.status_code == 400

    def test_respond_invalid_action_returns_400(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/respond/"
        response = self.client.post(url, {"action": "snooze"}, format='json')
        assert response.status_code == 400

    def test_mark_delivered_success(self):
        dr = DeliveryRequestFactory(status='accepted')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/mark-delivered/"
        response = self.client.post(url)

        assert response.status_code == 200
        dr.event.refresh_from_db()
        assert dr.event.status == 'delivered'

    def test_mark_delivered_not_accepted_returns_400(self):
        dr = DeliveryRequestFactory(status='pending')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/mark-delivered/"
        response = self.client.post(url)
        assert response.status_code == 400
