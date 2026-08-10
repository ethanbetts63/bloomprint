# Events App

## Purpose

The `events` app is the core domain of Bloomprint. It manages orders (one-time or recurring flower plans), the individual deliveries (events) within them, and the guest checkout flow customers use to build and pay for an order.

## Models

### Order
The single order model for the system. `billing_mode` (`one_time` | `recurring`) distinguishes a single delivery from a subscription; `frequency` (`weekly`, `fortnightly`, `monthly`, `annually`) only applies when recurring.

**Status lifecycle:** `pending_payment` -> `active` -> `completed` | `cancelled` | `refunded`

**Pricing fields** (`delivery_fee`, `subtotal`, `total_amount`) are auto-computed on every `save()` while `status == 'pending_payment'` — see `_recalculate_price()` in `models/order.py`. Never set them directly.

**Key methods:** `make_recurring(frequency)`, `make_one_time()` — convert a draft order between billing modes before payment.

### Event
An individual flower delivery belonging to an `Order`.

**Key fields:** `order` (FK), `delivery_date`, `message`, `status`, `ordered_at` / `delivered_at` with evidence text, `commission_amount`.

### CheckoutSession
Opaque, cookie-held authority for an in-progress guest checkout. Maps a hashed token to a draft `Order` so an unauthenticated visitor can build and resume an order without an account.

## Guest Checkout

`GuestCheckoutView` (`events/views/guest_checkout_view.py`) exposes a single action-dispatch endpoint backing the whole checkout flow: starting a draft order, editing it, claiming it with contact details, switching billing mode, applying a discount code, accepting terms, and finally creating a Stripe payment intent.

## Testing

- **Model Tests:** `Order` and `Event` creation, string representations.
- **Util Tests:** Fee calculations (`utils/fee_calc.py`).
- **Serializer Tests:** `OrderSerializer`.
- **View Tests:** Guest checkout claim and discount flows.
- **Integration Tests:** Verifies `Event` objects are correctly generated on successful payment.

Run tests using: `pytest events/tests`

## Pricing Engine

### `utils/fee_calc.py`
- `calculate_delivery_fee(budget)` - Returns `$0` once the budget reaches `DELIVERY_INCLUDED_THRESHOLD` (the budget absorbs delivery), otherwise `DELIVERY_FEE`. Both live in `settings.py`.
- `frequency_to_deliveries_per_year(frequency)` - Maps frequency string to annual delivery count.

Pricing is computed server-side in `Order.save()`: `subtotal = budget + delivery_fee`,
then `total_amount = subtotal - discount_amount`. Never set `subtotal` or
`delivery_fee` directly — they are derived from `budget` on every save.

## API Endpoints

All under `/api/events/`:

- `POST /guest-checkout/start/` - Create or resume a draft order, sets the checkout cookie
- `GET /guest-checkout/order/` - Retrieve the current draft order
- `POST /guest-checkout/order/` - Update the draft order
- `POST /guest-checkout/claim/` - Attach customer name/email to the draft order
- `POST /guest-checkout/make-recurring/` - Switch the draft order to a subscription
- `POST /guest-checkout/make-one-time/` - Switch the draft order back to a single delivery
- `POST /guest-checkout/discount/` - Validate and apply a discount code
- `POST /guest-checkout/accept-terms/` - Record acceptance of the current customer terms
- `POST /guest-checkout/checkout/` - Validate the order and create a Stripe payment intent

## Templates

- `notifications/emails/base.html` / `base.txt` - Base email templates (dark theme, responsive)
