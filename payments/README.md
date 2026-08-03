# Payments App

## Purpose

The `payments` app handles all Stripe payment processing for Bloom Print. It supports both one-time upfront payments (PaymentIntents) and recurring subscription payments (Stripe Subscriptions). Payment fulfillment is entirely webhook-driven.

## Model

### Payment
Transaction ledger recording each payment attempt.

**Key fields:**
- `user` (FK to User)
- `order` (FK to OrderBase)
- `stripe_payment_intent_id` (unique)
- `amount` (decimal)
- `status` (`pending` | `succeeded` | `failed`)
- `created_at`, `updated_at`

## Payment Flows

### Upfront Plan Payment
1. Frontend calls `POST /api/payments/create-payment-intent/` with `item_type` (`UPFRONT_PLAN_NEW` or `UPFRONT_PLAN_MODIFY`) and plan details
2. Backend creates/ensures Stripe Customer, calculates amount server-side, creates PaymentIntent and local Payment record
3. Returns `clientSecret` to frontend for Stripe Elements confirmation
4. On success, Stripe sends `payment_intent.succeeded` webhook
5. Webhook handler activates plan, creates delivery events (for single deliveries), updates payment status

### Subscription Payment
1. Frontend calls `POST /api/payments/create-subscription/` with `subscription_plan_id`
2. Backend creates Stripe Subscription with trial period (charges `SUBSCRIPTION_CHARGE_LEAD_DAYS` before delivery)
3. Returns SetupIntent `clientSecret` for payment method collection
4. On setup success, `setup_intent.succeeded` webhook activates the plan
5. On each billing cycle, `invoice.payment_succeeded` webhook creates Payment record and Event for next delivery

## API Endpoints

All under `/api/payments/`:

- `POST /create-payment-intent/` - Create Stripe PaymentIntent for upfront plans (authenticated)
- `POST /create-subscription/` - Create Stripe Subscription (authenticated)
- `POST /webhook/` - Stripe webhook receiver (public, signature-verified)

## Webhook Handlers (`utils/webhook_handlers.py`)

- `handle_payment_intent_succeeded()` - Updates payment status, activates upfront plans, creates single-delivery events
- `handle_invoice_payment_succeeded()` - Creates payment + event for subscription billing cycles
- `handle_payment_intent_failed()` - Marks payment as failed
- `handle_setup_intent_succeeded()` - Activates subscription plan
- `handle_setup_intent_failed()` - Logs failure (no user notification yet)

## Utilities

- `send_admin_payment_notification(payment_id)` - Sends email (Mailgun) and SMS (Twilio) to admin on payment success. Note: currently implemented but not called anywhere.
- `get_next_payment_date(plan)` - Calculates next subscription billing date
- `get_next_delivery_date(plan)` - Calculates next delivery date (payment date + lead days)

## Required Settings

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUBSCRIPTION_PRODUCT_ID`
- `SUBSCRIPTION_CHARGE_LEAD_DAYS` (days before delivery to charge)
