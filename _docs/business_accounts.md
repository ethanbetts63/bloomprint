# Business accounts

## Account types

- **Non-delivery (referral)** — Refers customers via discount code. Earns tiered commissions on the first 3 purchases made by each referred customer.
- **Delivery** — A florist who will eventually receive delivery fulfillment business. Has a discount code for customers but does NOT earn referral commissions. Has a service area (lat/lng pin + radius).

Both types get a discount code at registration. Both types require admin approval before their code works.

## Registration Flow

1. Partner type is determined by entry point: the `/florists` hero embeds the delivery registration form, and the `/affiliates` hero embeds the referral registration form. There is no separate type-selection step.
2. Fills in account details: email, password, first name, last name, business name, phone, and country (ISO 2-letter code, used to set the Stripe Express account's country).
3. Delivery partners additionally set their location on an interactive map (lat/lng) and configure a service radius (default 10km).
4. On submit, backend creates:
   - A User account
   - A BusinessAccount record (status: `pending`)
   - A DiscountCode (auto-generated, `is_active=True`)
5. Returns JWT tokens — user is logged in immediately.
6. Redirects to `the role-specific dashboard`. Stripe Connect setup is decoupled from registration — the partner initiates it from the dashboard when ready.

**Auto-generated code format:** `{slugified-business-name}-{discount_amount}` (e.g. `flower-shop-5`). If no business name is provided, falls back to `partner`. If the generated code is taken among active codes, appends `-2`, `-3`, etc.

## Partner Status Lifecycle

`pending` → `active` → `suspended`

- **pending** — Default after registration. Discount code exists but won't validate (partner status check fails).
- **active** — Admin approves via Django admin. Discount code now works.
- **suspended** — Admin deactivates. Discount code stops working.

## Discount Codes

Each partner can have multiple discount codes. One is auto-generated at registration. Partners can create additional codes from the dashboard but cannot edit or delete existing ones (codes are only deactivated on partner deletion). Each code has a fixed dollar amount (default $5).

### Validation Rules (when a customer tries to use a code)

1. Code must exist and `is_active=True`
2. Partner must have `status='active'`
3. Customer cannot use their own partner code (self-referral prevention)
4. Customer must be a new customer (no previous succeeded payments)

### How Discount Codes Are Applied

1. Customer enters code on the plan confirmation page (UpfrontSummary or SubscriptionSummary).
2. Frontend sends `{ code, plan_id, plan_type }` to `POST /api/business-accounts/validate-discount-code/`.
3. Backend validates the code, then persists it on the plan:
   - Sets `plan.discount_code` (FK) and `plan.discount_amount`
   - `plan.save()` auto-computes `total_amount = subtotal - discount_amount + tax_amount`
   - Sets `user.referred_by_affiliate` to the code's partner (one-time, for commission tracking)
4. Returns `{ code, discount_amount, partner_name, new_total_amount }`.
5. Frontend re-fetches the plan to show updated totals.
6. Discount persists on the plan — navigating away and coming back shows it as already applied.

### Clearing a Discount Code

Send empty code with the plan_id. Backend clears `discount_code` and `discount_amount` on the plan, recalculates `total_amount`.

### Soft Delete on Account Deletion

When a partner's account is deleted:
- A `pre_delete` signal sets `is_active=False` on their discount code
- The code's `partner` FK becomes `NULL` (via `SET_NULL`)
- The code record stays in the DB for historical integrity
- If the user re-registers with the same business name, a new code is generated without collision (only active codes are checked for uniqueness)

## Pricing Model on Orders

`OrderBase` has these pricing fields:

| Field | Description |
|-------|-------------|
| `budget` | What the customer chose (untouched) |
| `subtotal` | Computed price before discounts |
| `discount_code` | FK to DiscountCode (nullable) |
| `discount_amount` | Dollar amount of discount |
| `tax_amount` | Placeholder for future tax |
| `total_amount` | Auto-computed: `subtotal - discount_amount + tax_amount` |

`total_amount` is recalculated on every `save()`. Payment intents and Stripe subscriptions read `total_amount` directly.

## Checkout and Payment

1. Customer goes to checkout — sees subtotal, discount (if any), and total.
2. Payment intent is created using `plan.total_amount` (discount already baked in).
3. `discount_code` string is stored in Stripe PaymentIntent metadata for tracking.
4. On payment success (webhook), two things happen:
   - A `DiscountUsage` record is created (links discount code, user, payment, and amount)
   - `process_referral_commission(payment)` is called

## Commissions

How Referral Commissions Work

1. Customer applies discount code on confirmation page. Code belongs to a Partner. We set `user.referred_by_affiliate` to that partner (tracks where the customer came from).
2. Customer pays. Stripe sends a `payment_intent.succeeded` webhook (for upfront/single-delivery) or `invoice.paid` webhook (for subscriptions). `webhook_handlers.py` processes it.
3. Webhook handler calls `process_referral_commission(payment)` which:
   - Looks up `payment.user.referred_by_affiliate` — if none, skip
   - Checks `account.account_type` — only `affiliate` partners earn referral commissions
   - Counts the user's successful payments — if > 3, skip (cap at first 3 payments per customer)
   - Reads the order's budget and calculates a tiered fixed commission:
     - Budget < $100 → $5
     - Budget < $150 → $10
     - Budget < $200 → $15
     - Budget < $250 → $20
     - Budget >= $250 → $25
   - Creates a Commission record (status: `pending`)
4. Payouts: The `process_payouts` management command batches approved commissions into Payout records and pays them via Stripe Connect.

### Commission Status Lifecycle

`pending` → `approved` (admin action in Django admin) → `paid` (after Stripe transfer)

## Stripe Connect

Partners must complete Stripe Connect onboarding to receive payouts.

1. Partner clicks "Set Up" in the dashboard banner → `POST /api/business-accounts/stripe-connect/onboard/`
2. Backend creates a Stripe Express Account using `partner.country` (set at registration), then creates a Stripe `AccountLink` and returns the hosted onboarding URL.
3. Frontend redirects the partner to Stripe's hosted onboarding pages (`connect.stripe.com/...`). Stripe handles the entire onboarding UX — identity verification, bank details, etc. Country is pre-set from `partner.country` so the partner is not asked to select it again. For referral partners, `business_profile` (industry MCC `7311`, product description, URL) is also pre-filled so they skip those business detail questions entirely.
4. On completion Stripe redirects the partner back to `/stripe-connect/return`, which calls `GET /api/business-accounts/stripe-connect/status/` for an immediate UI refresh.
5. If the AccountLink expires, Stripe redirects to `/stripe-connect/onboarding` which generates a fresh link automatically.
6. `stripe_connect_onboarding_complete` is set to `True` via two paths:
   - **Webhook (primary):** Stripe fires `account.updated` when `payouts_enabled` becomes true on the connected account. `handle_account_updated` in `webhook_handlers.py` updates the flag automatically — works even if the partner abandons mid-flow and is approved later.
   - **Status poll (fallback/UI refresh):** `StripeConnectStatusView` checks `charges_enabled` + `payouts_enabled` live from Stripe and syncs the flag on demand.
7. `process_payouts` command creates `stripe.Transfer` to the partner's connected account.

**Note:** Stripe Connect must be enabled on the platform Stripe account before Express accounts can be created. Enable it at dashboard.stripe.com/connect — this must be done separately for test and live modes.

**Country:** The partner's country (ISO 2-letter code e.g. `AU`, `GB`, `US`) is collected at registration and passed to `stripe.Account.create(country=...)`. This determines which country's Stripe onboarding requirements the partner sees. Stripe Connect does not support every country — if an unsupported country is selected, account creation is silently skipped and the onboard view's fallback will retry when the partner initiates onboarding.

## Partner Dashboard

`GET /api/business-accounts/dashboard/` returns:

- Partner status and details
- `discount_codes` — list of all codes (each with id, code string, amount, is_active, total_uses, created_at)
- Earnings summary (total earned, pending, approved, paid)
- Recent commissions (last 20)
- Payout summary (total paid, total pending)
- Delivery requests (delivery partners only)

`POST /api/business-accounts/discount-codes/` — create a new discount code. Optional `name` field used to generate the code slug (falls back to business name).


## Key Business Rules

1. Discount codes are for new customers only (no previous succeeded payments)
2. Partners can have multiple discount codes; one is created at registration
3. Code only works if partner status is `active`
4. Partners cannot use their own code
5. `user.referred_by_affiliate` is set once on first code application and never changes
6. Non-delivery partners earn tiered referral commissions (capped at 3 payments per customer)
7. Delivery partners do NOT earn commissions — their benefit is receiving fulfillment business
8. Commissions require admin approval before payout
9. Stripe Connect onboarding required for payouts

## Key Files

**Backend:**
- `partners/models/partner.py` — Partner model
- `partners/models/discount_code.py` — DiscountCode model
- `partners/models/discount_usage.py` — DiscountUsage tracking
- `partners/models/commission.py` — Commission model
- `partners/serializers/partner_registration_serializer.py` — Registration logic
- `partners/views/discount_code_views.py` — Create and rename discount codes
- `partners/serializers/validate_discount_code_serializer.py` — Code validation + plan persistence
- `partners/utils/commission_utils.py` — Tiered commission calculation
- `partners/signals.py` — Soft-delete signal for discount codes
- `payments/utils/webhook_handlers.py` — DiscountUsage + commission creation on payment success
- `events/models/order_base.py` — Pricing fields and auto-computed total_amount

**Frontend:**
- `frontend/src/components/partner/PartnerRegistrationForm.tsx` — embedded in the `/florists` and `/affiliates` heroes via `LandingHero`
- `frontend/src/pages/partner/PartnerDashboardPage.tsx`
- `frontend/src/components/form_flow/DiscountCodeInput.tsx`
- `frontend/src/components/summaries/UpfrontSummary.tsx`
- `frontend/src/components/summaries/SubscriptionSummary.tsx`
- `frontend/src/api/businessAccounts.ts`
- `frontend/src/types/Partner.ts`
