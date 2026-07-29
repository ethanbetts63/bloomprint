import pytest
from rest_framework.test import APIClient
from partners.models import DiscountCode
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAffiliateDiscountCodeListCreateView:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.business_account = BusinessAccountFactory(user=self.user, business_name='Bloom Studio')
        self.url = '/api/business-accounts/discount-codes/'

    def test_create_generates_code_from_business_name(self):
        response = self.client.post(self.url, {}, format='json')
        assert response.status_code == 201
        assert 'BLOOMSTUDIO' in response.data['code']
        assert DiscountCode.objects.filter(business_account=self.business_account).count() == 1

    def test_list_is_paginated_scoped_filtered_and_ordered(self):
        matching = DiscountCodeFactory(business_account=self.business_account, code='SPRING-5', is_active=True)
        DiscountCodeFactory(business_account=self.business_account, code='WINTER-5', is_active=False)
        DiscountCodeFactory(code='SPRING-OTHER-5')

        response = self.client.get(f'{self.url}?status=active&search=spring&ordering=code')

        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['id'] == matching.id

    def test_create_with_custom_name(self):
        response = self.client.post(self.url, {'name': 'podcast'}, format='json')
        assert response.status_code == 201
        assert 'PODCAST' in response.data['code']

    def test_create_multiple_codes_allowed(self):
        self.client.post(self.url, {'name': 'spring'}, format='json')
        self.client.post(self.url, {'name': 'summer'}, format='json')
        assert DiscountCode.objects.filter(business_account=self.business_account).count() == 2

    def test_create_returns_correct_fields(self):
        response = self.client.post(self.url, {}, format='json')
        assert response.status_code == 201
        for field in ('id', 'code', 'discount_amount', 'is_active', 'total_uses', 'created_at'):
            assert field in response.data

    def test_create_requires_authentication(self):
        self.client.logout()
        response = self.client.post(self.url, {}, format='json')
        assert response.status_code == 401

    def test_create_requires_business_account(self):
        non_partner = UserFactory()
        self.client.force_authenticate(user=non_partner)
        response = self.client.post(self.url, {}, format='json')
        assert response.status_code == 404

    def test_delivery_partner_cannot_create_discount_code(self):
        florist = BusinessAccountFactory(account_type='florist')
        self.client.force_authenticate(user=florist.user)

        response = self.client.post(self.url, {}, format='json')

        assert response.status_code == 403
        assert DiscountCode.objects.filter(business_account=florist).count() == 0

    def test_delivery_partner_cannot_list_discount_codes(self):
        florist = BusinessAccountFactory(account_type='florist')
        self.client.force_authenticate(user=florist.user)
        assert self.client.get(self.url).status_code == 403

    def test_collision_gets_counter_suffix(self):
        first = self.client.post(self.url, {'name': 'vip'}, format='json')
        second = self.client.post(self.url, {'name': 'vip'}, format='json')
        assert first.data['code'] != second.data['code']
