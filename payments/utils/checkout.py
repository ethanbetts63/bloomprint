from datetime import datetime, time, timedelta
from decimal import Decimal

import stripe
from django.conf import settings
from django.core.cache import cache

stripe.api_key = settings.STRIPE_SECRET_KEY

STRIPE_MINIMUM_CHARGE = Decimal('0.50')

_SUBSCRIPTION_PRODUCT_CACHE_KEY = 'stripe_subscription_product_id'


def ensure_stripe_customer(order):
    if not order.stripe_customer_id:
        name = f"{order.customer_first_name} {order.customer_last_name}".strip()
        customer = stripe.Customer.create(
            email=order.customer_email,
            name=name,
            metadata={'order_id': order.id}
        )
        order.stripe_customer_id = customer.id
        order.save(update_fields=['stripe_customer_id'])


def _subscription_product_id():
    product_id = cache.get(_SUBSCRIPTION_PRODUCT_CACHE_KEY)
    if product_id:
        return product_id

    product = stripe.Product.create(name='Bloomprint Subscription')
    cache.set(_SUBSCRIPTION_PRODUCT_CACHE_KEY, product.id, timeout=None)
    return product.id


def validate_order_ready_for_payment(order):
    if order.total_amount is None or order.total_amount <= 0:
        return 'Order amount must be greater than zero.'
    if order.billing_mode == 'recurring' and not all([order.start_date, order.frequency]):
        return 'Subscription details are incomplete.'
    return None


def start_order_payment(order):
    ensure_stripe_customer(order)

    if order.billing_mode == 'recurring':
        return _start_subscription_payment(order)

    return _start_one_time_payment(order)


def _first_charge_cents(order):
    return int(max(Decimal(order.total_amount), STRIPE_MINIMUM_CHARGE) * 100)


def _record_pending_payment(order, payment_intent_id, amount_in_cents):
    from payments.models import Payment

    Payment.objects.create(
        order=order,
        stripe_payment_intent_id=payment_intent_id,
        amount=Decimal(amount_in_cents) / 100,
        status='pending',
    )


def _start_one_time_payment(order):
    amount_in_cents = _first_charge_cents(order)

    _clear_stale_subscription(order)

    reused_secret = reuse_or_cancel_pending_payment_intent(order, amount_in_cents)
    if reused_secret:
        return reused_secret

    metadata = {'order_id': str(order.id), 'billing_mode': order.billing_mode}
    if order.discount_code:
        metadata['discount_code'] = order.discount_code.code

    payment_intent = stripe.PaymentIntent.create(
        amount=amount_in_cents,
        currency=order.currency.lower(),
        customer=order.stripe_customer_id,
        automatic_payment_methods={'enabled': True},
        metadata=metadata,
    )
    _record_pending_payment(order, payment_intent.id, amount_in_cents)
    return payment_intent.client_secret


def _start_subscription_payment(order):
    """
    Create the Stripe Subscription for a recurring order at checkout time.

    The subscription is created `default_incomplete` with:
      - a trial ending SUBSCRIPTION_CHARGE_LEAD_DAYS before the *second*
        delivery, so the recurring price bills on the charge-ahead schedule;
      - a one-off invoice item for the first delivery, which Stripe invoices
        immediately despite the trial — that first invoice's PaymentIntent is
        what the browser confirms, so money is taken at signup. Any discount
        is subtracted directly from this one-off item's amount, so it never
        touches the recurring price and needs no Stripe coupon;
      - the recurring price built from the *undiscounted* subtotal, so every
        later delivery bills full price.
    """
    from payments.utils.subscription_dates import (
        calculate_second_delivery_date,
        get_recurring_options,
    )

    reused_secret = _reuse_incomplete_subscription(order)
    if reused_secret:
        return reused_secret

    reuse_or_cancel_pending_payment_intent(order, amount_in_cents=None)

    recurring_cents = int(Decimal(order.subtotal) * 100)
    first_invoice_cents = _first_charge_cents(order)

    second_delivery = calculate_second_delivery_date(order.start_date, order.frequency)
    trial_end_date = second_delivery - timedelta(days=settings.SUBSCRIPTION_CHARGE_LEAD_DAYS)
    trial_end_ts = int(datetime.combine(trial_end_date, time.min).timestamp())
    if trial_end_ts <= datetime.now().timestamp():
        trial_end_ts = int(datetime.now().timestamp() + 60)

    metadata = {'order_id': str(order.id), 'billing_mode': order.billing_mode}
    if order.discount_code:
        metadata['discount_code'] = order.discount_code.code

    product_id = _subscription_product_id()
    subscription = stripe.Subscription.create(
        customer=order.stripe_customer_id,
        items=[{
            'price_data': {
                'currency': order.currency.lower(),
                'unit_amount': recurring_cents,
                'product': product_id,
                'recurring': get_recurring_options(order.frequency),
            },
        }],
        add_invoice_items=[{
            'price_data': {
                'currency': order.currency.lower(),
                'unit_amount': first_invoice_cents,
                'product': product_id,
            },
        }],
        trial_end=trial_end_ts,
        payment_behavior='default_incomplete',
        payment_settings={'save_default_payment_method': 'on_subscription'},
        expand=['latest_invoice.confirmation_secret'],
        metadata=metadata,
    )

    client_secret = subscription.latest_invoice.confirmation_secret.client_secret
    order.stripe_subscription_id = subscription.id
    order.save()

    payment_intent_id = client_secret.split('_secret')[0]
    _record_pending_payment(order, payment_intent_id, first_invoice_cents)
    return client_secret


def _reuse_incomplete_subscription(order):
    """
    If the order already has an incomplete subscription whose first invoice
    matches the current total, reuse its client secret. Anything stale is
    cancelled and cleared (by _clear_stale_subscription, the single place
    that issues the cancel call) so a fresh subscription can be created.
    """
    if not order.stripe_subscription_id:
        return None

    expected_cents = _first_charge_cents(order)
    try:
        subscription = stripe.Subscription.retrieve(
            order.stripe_subscription_id,
            expand=['latest_invoice.confirmation_secret'],
        )
        invoice = getattr(subscription, 'latest_invoice', None)
        if (
            subscription.status == 'incomplete'
            and invoice is not None
            and invoice.amount_due == expected_cents
            and getattr(invoice, 'confirmation_secret', None)
        ):
            return invoice.confirmation_secret.client_secret
    except stripe.error.StripeError:
        pass

    _clear_stale_subscription(order)
    return None


def _cancel_incomplete_subscription(order):
    """Cancel and clear a leftover incomplete subscription on the order, if
    the order is still a draft (a paid order's subscription must survive)."""
    if not order.stripe_subscription_id or order.status != 'pending_payment':
        return
    _clear_stale_subscription(order)


def _clear_stale_subscription(order):
    """Cancel the order's Stripe Subscription (if any) and clear local state
    referencing it, so a fresh subscription/PaymentIntent can be created."""
    from payments.models import Payment

    if order.stripe_subscription_id:
        try:
            stripe.Subscription.cancel(order.stripe_subscription_id)
        except stripe.error.StripeError:
            pass
        order.stripe_subscription_id = None
        order.save(update_fields=['stripe_subscription_id'])
    Payment.objects.filter(order=order, status='pending').delete()


def reuse_or_cancel_pending_payment_intent(order, amount_in_cents):
    """
    Looks for an existing pending Payment for this order. If a matching Stripe
    PaymentIntent exists with the same amount, its client secret is reused.
    Otherwise the stale PaymentIntent/Payment record is cleaned up so a new
    one can be created.

    Pass amount_in_cents=None to force cleanup without reuse — the existing
    PaymentIntent is cancelled outright, without a wasted retrieve to compare
    an amount that can never match.

    Returns a client secret to reuse, or None if the caller should create a
    new PaymentIntent.
    """
    from payments.models import Payment

    existing_payment = Payment.objects.filter(order=order, status='pending').first()
    if not existing_payment or not existing_payment.stripe_payment_intent_id:
        return None

    if amount_in_cents is None:
        try:
            stripe.PaymentIntent.cancel(existing_payment.stripe_payment_intent_id)
        except stripe.error.StripeError:
            pass
        existing_payment.delete()
        return None

    try:
        payment_intent = stripe.PaymentIntent.retrieve(existing_payment.stripe_payment_intent_id)
        if payment_intent.amount == amount_in_cents:
            return payment_intent.client_secret
        stripe.PaymentIntent.cancel(existing_payment.stripe_payment_intent_id)
        existing_payment.delete()
    except stripe.error.StripeError:
        existing_payment.delete()

    return None
