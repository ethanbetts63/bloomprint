from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from events.models import Order
from partners.tests.factories.discount_code_factory import DiscountCodeFactory
from partners.tests.factories.partner_factory import PartnerFactory

START_URL = '/api/events/guest-checkout/start/'
DISCOUNT_URL = '/api/events/guest-checkout/discount/'


def start_order(client, budget='125.00'):
    response = client.post(START_URL, {'brief': {'budget': budget}}, format='json')
    assert response.status_code == 201, response.data
    return Order.objects.get(pk=response.data['id'])


@pytest.mark.django_db
class TestGuestCheckoutDiscount:
    def test_a_guest_can_apply_a_discount_code(self):
        """
        The whole ordering flow is a guest flow. This endpoint used to require
        authentication, so every guest applying a code got a 401 — the Promotions
        box on the confirmation page could not work at all.
        """
        client = APIClient()
        order = start_order(client)
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))

        response = client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        assert response.status_code == 200, response.data
        assert Decimal(response.data['discount_amount']) == Decimal('5.00')
        order.refresh_from_db()
        assert order.discount_code == code
        assert order.discount_amount == Decimal('5.00')

    def test_applying_a_code_reduces_the_total(self):
        client = APIClient()
        order = start_order(client, budget='125.00')
        before = order.total_amount
        DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))

        response = client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        order.refresh_from_db()
        assert order.total_amount == before - Decimal('5.00')
        assert Decimal(response.data['new_total_amount']) == order.total_amount

    def test_applying_a_code_attributes_the_order_to_the_partner(self):
        """Attribution is what pays the affiliate; process_referral_commission
        reads it off the order at payment time."""
        client = APIClient()
        order = start_order(client)
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))

        client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        order.refresh_from_db()
        assert order.referred_by_partner == code.partner

    def test_an_empty_code_clears_the_discount(self):
        client = APIClient()
        order = start_order(client)
        DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))
        client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        response = client.post(DISCOUNT_URL, {'code': ''}, format='json')

        assert response.status_code == 200, response.data
        order.refresh_from_db()
        assert order.discount_code is None
        assert order.discount_amount == 0

    def test_a_code_may_be_applied_before_any_email_is_known(self):
        """
        Anonymous application is allowed: the once-per-email rule can only be
        checked once claim() has recorded who is paying, so apply-time lets it
        through and the checkout action is the authoritative gate.
        """
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))

        for _ in range(2):
            client = APIClient()
            order = start_order(client)
            response = client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')
            assert response.status_code == 200, response.data
            order.refresh_from_db()
            assert order.discount_code == code

    def test_an_unknown_code_is_rejected(self):
        client = APIClient()
        start_order(client)

        response = client.post(DISCOUNT_URL, {'code': 'NOSUCHCODE'}, format='json')

        assert response.status_code == 400

    def test_an_inactive_code_is_rejected(self):
        client = APIClient()
        start_order(client)
        DiscountCodeFactory(code='EXPIRED', is_active=False)

        response = client.post(DISCOUNT_URL, {'code': 'EXPIRED'}, format='json')

        assert response.status_code == 400

    def test_a_code_from_an_inactive_partner_is_rejected(self):
        client = APIClient()
        start_order(client)
        partner = PartnerFactory(status='pending')
        DiscountCodeFactory(code='PENDING5', partner=partner)

        response = client.post(DISCOUNT_URL, {'code': 'PENDING5'}, format='json')

        assert response.status_code == 400

    def test_a_discount_cannot_be_applied_without_a_checkout_session(self):
        """No cookie, no order: there is no id in the request to fall back on."""
        DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))

        response = APIClient().post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        assert response.status_code == 410

    def test_a_discount_cannot_be_applied_to_a_paid_order(self):
        client = APIClient()
        order = start_order(client)
        DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))
        order.status = 'active'
        order.save()

        response = client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        assert response.status_code == 400
        order.refresh_from_db()
        assert order.discount_code is None


CLAIM_URL = '/api/events/guest-checkout/claim/'
CHECKOUT_URL = '/api/events/guest-checkout/checkout/'


def _claim(client, email):
    response = client.post(
        CLAIM_URL,
        {'email': email, 'first_name': 'Test', 'last_name': 'Customer'},
        format='json',
    )
    assert response.status_code == 200, response.data


def _record_usage(code, email):
    """A past redemption of this code by this email."""
    from partners.models import DiscountUsage
    from payments.tests.factories.payment_factory import PaymentFactory
    from events.tests.factories.order_factory import OrderFactory

    order = OrderFactory(user=None, customer_email=email)
    DiscountUsage.objects.create(
        discount_code=code, payment=PaymentFactory(user=None, order=order)
    )


@pytest.mark.django_db
class TestDiscountOncePerEmail:
    """A discount code can be redeemed once per email address."""

    def test_a_used_code_is_rejected_at_apply_time_once_the_email_is_known(self):
        client = APIClient()
        start_order(client)
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))
        _record_usage(code, 'repeat@example.com')
        _claim(client, 'repeat@example.com')

        response = client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')

        assert response.status_code == 400

    def test_checkout_strips_a_code_already_used_by_this_email(self):
        """The code can be applied before the email is known; checkout is the
        authoritative gate and must catch it just before money moves."""
        client = APIClient()
        order = start_order(client)
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))
        client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')
        _record_usage(code, 'repeat@example.com')
        _claim(client, 'REPEAT@EXAMPLE.COM')  # case must not matter

        response = client.post(CHECKOUT_URL, {}, format='json')

        assert response.status_code == 400
        order.refresh_from_db()
        assert order.discount_code is None
        assert order.discount_amount == 0

    def test_a_fresh_email_may_use_the_code(self, mocker):
        mocker.patch(
            'events.views.guest_checkout_view.start_order_payment',
            return_value='pi_test_secret',
        )
        client = APIClient()
        start_order(client)
        code = DiscountCodeFactory(code='SAVE5', discount_amount=Decimal('5.00'))
        _record_usage(code, 'someone-else@example.com')
        client.post(DISCOUNT_URL, {'code': 'SAVE5'}, format='json')
        _claim(client, 'first-timer@example.com')

        response = client.post(CHECKOUT_URL, {}, format='json')

        assert response.status_code == 200, response.data
        assert response.data['clientSecret'] == 'pi_test_secret'
