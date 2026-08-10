import pytest
from rest_framework.test import APIClient
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from users.tests.factories.user_factory import UserFactory
from events.tests.factories.event_factory import EventFactory


@pytest.mark.django_db
class TestDeliveryRequestViews:
    def setup_method(self):
        self.client = APIClient()

    def test_list_is_paginated_scoped_and_filtered_for_florist(self):
        florist = BusinessAccountFactory(account_type='florist')
        matching = DeliveryRequestFactory(business_account=florist, event__order__recipient_first_name='Alice', event__order__recipient_last_name='Flower')
        DeliveryRequestFactory(business_account=florist, event__order__recipient_first_name='Bob', event__order__recipient_last_name='Stem')
        DeliveryRequestFactory(business_account=BusinessAccountFactory(account_type='florist'))
        self.client.force_authenticate(user=florist.user)

        response = self.client.get('/api/business-accounts/delivery-requests/?search=alice&ordering=recipient')

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

    def test_mark_delivered_success(self):
        dr = DeliveryRequestFactory(status='accepted')
        url = f"/api/business-accounts/delivery-requests/{dr.token}/mark-delivered/"
        response = self.client.post(url)

        assert response.status_code == 200
        dr.event.refresh_from_db()
        assert dr.event.status == 'delivered'

    def test_mark_delivered_unknown_token_returns_404(self):
        response = self.client.post('/api/business-accounts/delivery-requests/nope/mark-delivered/')
        assert response.status_code == 404
