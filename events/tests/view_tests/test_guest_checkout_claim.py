from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from events.models import Order

User = get_user_model()

START_URL = '/api/events/guest-checkout/start/'
CLAIM_URL = '/api/events/guest-checkout/claim/'


def start_order(client, budget='125.00'):
    response = client.post(START_URL, {'brief': {'budget': budget}}, format='json')
    assert response.status_code == 201, response.data
    return Order.objects.get(pk=response.data['id'])


@pytest.mark.django_db
class TestGuestCheckoutClaim:
    def test_start_creates_an_order_but_no_user(self):
        client = APIClient()
        before = User.objects.count()
        start_order(client)
        assert User.objects.count() == before

    def test_claim_records_the_customer_details_on_the_order(self):
        client = APIClient()
        order = start_order(client)

        response = client.post(
            CLAIM_URL,
            {'email': 'Buyer@Example.com', 'first_name': 'Bo', 'last_name': 'Buyer'},
            format='json',
        )

        assert response.status_code == 200, response.data
        order.refresh_from_db()
        assert order.customer_email == 'buyer@example.com'
        assert order.customer_first_name == 'Bo'
        assert order.customer_last_name == 'Buyer'

    def test_claiming_an_existing_staff_email_does_not_touch_that_account(self):
        """
        The email is never verified and is stored only on the order, so claiming
        with a staff address neither resolves to that account nor grants anything.
        """
        staff = User.objects.create_user(
            username='boss', email='hello@bloomprint.com.au', is_staff=True
        )

        client = APIClient()
        order = start_order(client, budget='125.00')

        response = client.post(
            CLAIM_URL,
            {'email': 'hello@bloomprint.com.au', 'first_name': 'Not', 'last_name': 'Boss'},
            format='json',
        )
        assert response.status_code == 200, response.data

        order.refresh_from_db()
        assert order.customer_email == 'hello@bloomprint.com.au'
        assert order.total_amount == Decimal('125.00')
        staff.refresh_from_db()
        assert staff.is_staff

    def test_two_orders_may_share_an_email_without_colliding(self):
        first_client = APIClient()
        first_order = start_order(first_client)
        response = first_client.post(
            CLAIM_URL,
            {'email': 'repeat@example.com', 'first_name': 'Reg', 'last_name': 'Ular'},
            format='json',
        )
        assert response.status_code == 200, response.data

        second_client = APIClient()
        second_order = start_order(second_client)
        response = second_client.post(
            CLAIM_URL,
            {'email': 'repeat@example.com', 'first_name': 'Reg', 'last_name': 'Ular'},
            format='json',
        )
        assert response.status_code == 200, response.data

        first_order.refresh_from_db()
        second_order.refresh_from_db()
        assert first_order.pk != second_order.pk
        assert first_order.customer_email == second_order.customer_email == 'repeat@example.com'
