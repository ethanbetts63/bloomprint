import pytest
from rest_framework.test import APIClient
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory


@pytest.mark.django_db
class TestDeliveryRequestViews:
    """
    The list of a florist's own claims. The job sheet and mark-delivered moved
    to test_florist_delivery_views.py when they stopped being token-addressed.
    """
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
