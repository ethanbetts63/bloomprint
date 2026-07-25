from decimal import Decimal

import pytest
import stripe

from events.tests.factories.order_factory import OrderFactory
from payments.utils.checkout import ensure_stripe_customer


@pytest.mark.django_db
def test_creates_stripe_customer_from_order_details(mocker):
    order = OrderFactory(
        user=None,
        customer_email='buyer@example.com',
        customer_first_name='Buyer',
        customer_last_name='Person',
        stripe_customer_id=None,
        budget=Decimal('80.00'),
    )
    create = mocker.patch.object(
        stripe.Customer, 'create', return_value=mocker.Mock(id='cus_new123')
    )

    ensure_stripe_customer(order)

    order.refresh_from_db()
    assert order.stripe_customer_id == 'cus_new123'
    assert create.call_args.kwargs['email'] == 'buyer@example.com'
    assert create.call_args.kwargs['name'] == 'Buyer Person'
    assert create.call_args.kwargs['metadata'] == {'order_id': order.id}


@pytest.mark.django_db
def test_does_nothing_when_order_already_has_a_customer(mocker):
    order = OrderFactory(user=None, stripe_customer_id='cus_existing', budget=Decimal('80.00'))
    create = mocker.patch.object(stripe.Customer, 'create')

    ensure_stripe_customer(order)

    create.assert_not_called()
    assert order.stripe_customer_id == 'cus_existing'
