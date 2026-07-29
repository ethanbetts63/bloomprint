from datetime import timedelta
from django.conf import settings
from django.db import transaction
from payments.models import Payment
from events.models import Order, Event
from payments.utils.subscription_dates import get_next_delivery_date
from payments.utils.send_admin_payment_notification import send_admin_payment_notification
from payments.utils.send_customer_payment_notification import send_customer_payment_notification
from data_management.utils.notification_factory import create_admin_event_notifications, create_customer_delivery_day_notification


def _activate_order(order):
    order.status = 'active'
    order.save()


def _create_first_event(order, payment_intent_id):
    """
    Creates the single delivery Event for a one-time or recurring order's
    first delivery. Idempotent.
    """
    if Event.objects.filter(order=order, delivery_date=order.start_date).exists():
        print(f"First event for Order (PK: {order.pk}) already exists. Skipping duplicate.")
        return

    from partners.utils.commission_utils import get_referral_commission_amount
    commission_amount = get_referral_commission_amount(order.budget) if order.budget else None
    message = order.card_message if order.billing_mode == 'one_time' else ''

    event = Event.objects.create(
        order=order,
        delivery_date=order.start_date,
        message=message,
        commission_amount=commission_amount,
    )
    create_admin_event_notifications(event)
    create_customer_delivery_day_notification(event)
    send_customer_payment_notification(order)
    send_admin_payment_notification(payment_intent_id, order=order)


def handle_payment_intent_succeeded(payment_intent):
    """
    Handles the payment_intent.succeeded event from Stripe. This is the
    fulfillment step of checkout, dispatched by the order's billing_mode.

    Deliberately does not catch-and-log unexpected errors here: letting them
    propagate makes the view return a 5xx, which is what tells Stripe to
    retry the webhook. A caught-and-printed error used to look like success
    to Stripe (a 200), silently dropping the retry that would otherwise fix a
    transient failure (e.g. the Payment row not written yet, see below).
    """
    payment_intent_id = payment_intent['id']

    with transaction.atomic():
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
        except Payment.DoesNotExist:
            print(f"Payment not found for PI ID: {payment_intent_id} — the webhook may have arrived before "
                  "the initial request finished writing it. Raising so Stripe retries.")
            raise

        if payment.status == 'succeeded':
            print(f"Payment record (PK: {payment.pk}) already succeeded. Skipping duplicate webhook.")
            return

        payment.status = 'succeeded'
        payment.save()
        print(f"Payment record (PK: {payment.pk}) status updated to 'succeeded'.")

        if payment.order.discount_code:
            try:
                from partners.models import DiscountUsage
                if not DiscountUsage.objects.filter(payment=payment).exists():
                    DiscountUsage.objects.create(
                        discount_code=payment.order.discount_code,
                        payment=payment,
                    )
                    print(f"DiscountUsage created for Payment {payment.pk}")
            except Exception as e:
                print(f"Error creating DiscountUsage: {e}")

        try:
            from partners.utils.commission_utils import process_referral_commission
            process_referral_commission(payment)
        except Exception as e:
            print(f"Error processing referral commission: {e}")

        order = payment.order
        print(f"Processing payment_intent.succeeded for Order {order.id} (billing_mode: {order.billing_mode})")
        _activate_order(order)
        _create_first_event(order, payment_intent_id)


def _invoice_subscription_id(invoice):
    """
    The subscription id for an invoice. Since Stripe API 2025-03-31 (basil) it
    lives at parent.subscription_details.subscription; older payloads carried a
    top-level `subscription` field. Support both.
    """
    parent = invoice.get('parent') or {}
    details = parent.get('subscription_details') or {}
    subscription = details.get('subscription') or invoice.get('subscription')
    if isinstance(subscription, dict):
        return subscription.get('id')
    return subscription


def _invoice_payment_intent_id(invoice):
    """
    The PaymentIntent id that paid an invoice. Since Stripe API 2025-03-31
    (basil) invoices no longer carry `payment_intent`; the link lives on the
    invoice's payments, which need an expanded retrieve. Falls back to the
    invoice id as an idempotency key if no PaymentIntent can be found.
    """
    payment_intent = invoice.get('payment_intent')
    if payment_intent:
        return payment_intent if isinstance(payment_intent, str) else payment_intent.get('id')

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        expanded = stripe.Invoice.retrieve(
            invoice['id'], expand=['payments.data.payment.payment_intent']
        )
        for invoice_payment in expanded.get('payments', {}).get('data', []):
            intent = (invoice_payment.get('payment') or {}).get('payment_intent')
            if intent:
                return intent if isinstance(intent, str) else intent.get('id')
    except stripe.error.StripeError as e:
        print(f"Could not resolve PaymentIntent for invoice {invoice.get('id')}: {e}")
    return f"invoice_{invoice['id']}"


def handle_invoice_payment_succeeded(invoice):
    """
    Handles the invoice.payment_succeeded event from Stripe for recurring subscription payments.

    Deliberately does not catch-and-log unexpected errors here: letting them
    propagate makes the view return a 5xx, which is what tells Stripe to
    retry the webhook, instead of a caught-and-printed error looking like
    success (a 200) and silently dropping a delivery Event.
    """
    subscription_id = _invoice_subscription_id(invoice)
    if not subscription_id:
        print("Webhook received an invoice.payment_succeeded event without a subscription ID. Skipping.")
        return

    if invoice.get('billing_reason') == 'subscription_create':
        print(f"Skipping subscription_create invoice for subscription {subscription_id} (handled via payment_intent.succeeded).")
        return

    payment_intent_id = _invoice_payment_intent_id(invoice)

    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(stripe_subscription_id=subscription_id)
        except Order.DoesNotExist:
            print(f"Order not found for Stripe Subscription ID: {subscription_id}. Raising so Stripe retries.")
            raise
        print(f"Found Order (PK: {order.pk}) for Stripe Subscription ID: {subscription_id}")

        payment, created = Payment.objects.get_or_create(
            stripe_payment_intent_id=payment_intent_id,
            defaults={
                'order': order,
                'amount': invoice.get('amount_paid') / 100.0,
                'status': 'succeeded',
            }
        )
        if created:
            print(f"Created Payment record (PK: {payment.pk}) for invoice.")
        else:
            print(f"Payment record (PK: {payment.pk}) already exists for this invoice. Skipping duplicate.")
            return

        try:
            from partners.utils.commission_utils import process_referral_commission
            process_referral_commission(payment)
        except Exception as e:
            print(f"Error processing referral commission for subscription: {e}")

        invoice_created_ts = invoice.get('created')
        if invoice_created_ts:
            from datetime import date
            invoice_date = date.fromtimestamp(invoice_created_ts)
            delivery_date = invoice_date + timedelta(days=settings.SUBSCRIPTION_CHARGE_LEAD_DAYS)
        else:
            delivery_date = get_next_delivery_date(order)

        if delivery_date is None:
            print(f"WARNING: Could not determine delivery date for Order (PK: {order.pk}). Skipping Event creation.")
            return

        if not Event.objects.filter(order=order, delivery_date=delivery_date).exists():
            from partners.utils.commission_utils import get_referral_commission_amount
            commission_amount = get_referral_commission_amount(order.budget) if order.budget else None
            new_event = Event.objects.create(
                order=order,
                delivery_date=delivery_date,
                commission_amount=commission_amount,
            )
            create_admin_event_notifications(new_event)
            create_customer_delivery_day_notification(new_event)
            send_admin_payment_notification(payment_intent_id, order=order)
            print(f"Created new Event for recurring delivery on {delivery_date}.")
        else:
            print(f"Event for delivery on {delivery_date} already exists. Skipping duplicate.")


def handle_payment_intent_failed(payment_intent):
    """
    Handles the payment_intent.payment_failed event from Stripe.
    """
    print(f"Processing payment_intent.payment_failed for ID: {payment_intent['id']}")
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
        payment.status = 'failed'
        payment.save()
        print(f"Payment record (PK: {payment.pk}) status updated to 'failed'.")
    except Payment.DoesNotExist:
        print(f"ERROR: Received failed payment intent for non-existent local Payment record ID: {payment_intent['id']}")
    except Exception as e:
        print(f"UNEXPECTED ERROR during payment_intent.payment_failed processing for ID {payment_intent['id']}: {e}")


def handle_subscription_deleted(subscription):
    """
    Handles the customer.subscription.deleted event from Stripe.
    Acts as a safety net for cancellations that happen outside our API
    (e.g. payment failure, manual cancellation in Stripe dashboard).
    """
    subscription_id = subscription.get('id')
    if not subscription_id:
        print("Webhook received customer.subscription.deleted without a subscription ID. Skipping.")
        return

    print(f"Processing customer.subscription.deleted for Stripe Subscription ID: {subscription_id}")

    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(
                stripe_subscription_id=subscription_id
            )

            if order.status == 'cancelled':
                print(f"Order (PK: {order.pk}) already cancelled. Skipping.")
                return

            if order.status == 'pending_payment':
                order.stripe_subscription_id = None
                order.save(update_fields=['stripe_subscription_id'])
                print(f"Order (PK: {order.pk}) draft detached from expired subscription {subscription_id}.")
                return

            order.status = 'cancelled'
            order.save()
            print(f"Order (PK: {order.pk}) marked as cancelled via webhook.")

            scheduled_events = order.events.filter(status='scheduled')
            for event in scheduled_events:
                from data_management.models.notification import Notification
                Notification.objects.filter(
                    related_event=event, status='pending'
                ).update(status='cancelled')
                event.status = 'cancelled'
                event.save()

    except Order.DoesNotExist:
        print(f"Order not found for Stripe Subscription ID: {subscription_id}. Skipping.")
    except Exception as e:
        print(f"UNEXPECTED ERROR during customer.subscription.deleted for {subscription_id}: {e}")


def handle_account_updated(account):
    """
    Handles the account.updated event from Stripe for Connect accounts.
    Marks the business account as onboarding complete when payouts are enabled.
    """
    account_id = account.get('id')
    if not account_id:
        return

    if account.get('payouts_enabled'):
        from partners.models import BusinessAccount
        updated = BusinessAccount.objects.filter(
            stripe_connect_account_id=account_id,
            stripe_connect_onboarding_complete=False,
        ).update(stripe_connect_onboarding_complete=True)
        if updated:
            print(f"Business account with Stripe account {account_id} marked as onboarding complete.")
        else:
            print(f"account.updated for {account_id}: already complete or not found.")


def handle_transfer_created(transfer):
    """
    Handles the transfer.created event from Stripe.
    Marks the associated Payout as completed and the linked Commission as paid.
    """
    transfer_id = transfer.get('id')
    if not transfer_id:
        print("transfer.created event received without a transfer ID. Skipping.")
        return

    print(f"Processing transfer.created for transfer ID: {transfer_id}")

    try:
        from partners.models import Payout
        payout = Payout.objects.get(stripe_transfer_id=transfer_id)

        if payout.status == 'completed':
            print(f"Payout (PK: {payout.pk}) already completed. Skipping.")
            return

        payout.status = 'completed'
        payout.save()
        print(f"Payout (PK: {payout.pk}) marked as completed.")

        line_item = payout.line_items.filter(commission__isnull=False).first()
        if line_item and line_item.commission:
            commission = line_item.commission
            commission.status = 'paid'
            commission.save()
            print(f"Commission (PK: {commission.pk}) marked as paid.")

    except Payout.DoesNotExist:
        print(f"No Payout found for transfer ID: {transfer_id}. Skipping.")
    except Exception as e:
        print(f"UNEXPECTED ERROR during transfer.created processing for {transfer_id}: {e}")
