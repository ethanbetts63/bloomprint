# Payouts

## Overview

Two types of partners can receive payouts:

- **Affiliates (referral / non-delivery partners)** — earn a commission each time a customer they referred makes a payment.
- **Florists (delivery partners)** — earn a commission when a customer they signed up declines a delivery request, or a delivery payment when they fulfil one.

All payments move via **Stripe Connect**. Customer money lands in our platform balance first. We initiate transfers to each partner's connected Express account at our discretion. Stripe then automatically moves the money to the partner's bank (typically 2 business days).

---

## Data Model

### `Commission`
Records an amount owed to a partner. Created automatically when the triggering event occurs (payment, declined delivery). Admin reviews and actions these.

| Field | Description |
|---|---|
| `partner` | FK → Partner |
| `payment` | FK → Payment (nullable) |
| `event` | FK → Event (nullable) |
| `commission_type` | `referral` or `fulfillment` |
| `amount` | Decimal |
| `status` | `pending` → `approved` → `processing` → `paid`; or `denied` |
| `note` | Optional text |

### `Payout`
Records a single Stripe Transfer. Created at the moment a commission is actioned by admin.

| Field | Description |
|---|---|
| `partner` | FK → Partner |
| `payout_type` | `commission` or `fulfillment` |
| `amount` | Decimal |
| `currency` | 3-letter ISO, e.g. `AUD` |
| `stripe_transfer_id` | Stripe `tr_...` ID |
| `status` | `pending` → `processing` → `completed`; or `failed` |

### `PayoutLineItem`
Links a `Payout` to the specific `Commission` (or `DeliveryRequest`) it covers. A payout may have multiple line items in future batch-pay flows, but currently is always 1:1.

---

## Phase 1 — Stripe Connect Onboarding

Every partner must have a connected Stripe Express account before they can receive money. This is set up immediately during registration, before admin approval.

### Flow

1. **Registration** — Partner submits the registration form. The backend creates `User`, `BusinessAccount`, and `DiscountCode` records, then immediately calls `stripe.Account.create(type='express')`. The returned account ID (e.g. `acct_123abc`) is saved to `BusinessAccount.stripe_connect_account_id`.

2. **Embedded onboarding** — The backend calls `stripe.AccountSession.create()` and returns a short-lived `client_secret`. The frontend renders the Stripe embedded onboarding form using `@stripe/react-connect-js`. No redirect — partner stays on our site. They enter bank details and identity information, then land on their partner dashboard.

3. **Webhook confirmation** — Stripe fires `account.updated`. If `payouts_enabled` is `True`, we set `BusinessAccount.stripe_connect_onboarding_complete = True` via `handle_account_updated()` in `payments/utils/webhook_handlers.py`.

4. **Admin approval (separate)** — Admin approves the partner via the admin dashboard. This activates their discount code. No Stripe interaction at this step.

5. **Incomplete onboarding banner** — If `stripe_connect_onboarding_complete` is `False`, a banner on the partner dashboard links back to `/stripe-connect/onboarding`. A new `AccountSession` is generated on each visit, so the partner can resume from where they left off.

### Relevant fields on `BusinessAccount`
- `stripe_connect_account_id` — the `acct_...` pointer used for all future transfers.
- `stripe_connect_onboarding_complete` — `True` only after Stripe confirms `payouts_enabled` via webhook.

---

## Phase 2 — Commission Creation

### Referral commissions (affiliates)

Triggered automatically inside the Stripe webhook handlers (`payments/utils/webhook_handlers.py`) whenever a payment succeeds — both one-off payments (`payment_intent.succeeded`) and recurring subscription charges (`invoice.payment_succeeded`).

The utility `process_referral_commission(payment)` in `partners/utils/commission_utils.py`:
1. Checks if the paying customer was referred by a partner (`user.referred_by_affiliate`).
2. Skips if that partner is a delivery partner (only `affiliate` partners earn referral commissions).
3. Skips if the customer has already made more than 3 successful payments (commission is capped at first 3 payments per customer).
4. Reads the plan budget and looks up the commission amount from the tier table.
5. Creates a `Commission` record with `status='pending'`.

### Commission tier table

Defined in `REFERRAL_COMMISSION_TIERS` in `partners/utils/commission_utils.py`:

| Budget | Commission per payment |
|--------|----------------------|
| < $100 | $5 |
| < $150 | $10 |
| < $200 | $15 |
| < $250 | $20 |
| ≥ $250 | $25 |

The commission amount is calculated at payment time from the plan budget. It is stored on `Commission.amount` and does not change if tier rates are updated later.

### Declined delivery commissions (florists)

When a florist declines a delivery request and the customer was originally referred by that same florist, a `Commission` record (`commission_type='referral'`, `status='pending'`) is created in `DeliveryRequestRespondView`. The amount uses the snapshotted `event.commission_amount` if set, otherwise falls back to calculating from the order budget via the tier table.

### Fulfillment commissions (florists — delivery payment)

The `Commission` model supports `commission_type='fulfillment'` and the admin payment flow handles it correctly (creates a `Payout` with `payout_type='fulfillment'`). **However, the automatic creation of fulfillment commissions for fulfilled deliveries is not yet implemented.** Marking an event as delivered does not yet create a Commission record. This is a planned future addition.

---

## Phase 3 — Admin Payout Management

### Commission status lifecycle

```
pending ──► approved ──► processing ──► paid
    │                          │
    └──────────► denied ◄───── ┘  (denied is terminal; processing cannot be denied)
```

- `pending` — created automatically, awaiting admin review.
- `approved` — optional intermediate status (can be set manually; the approve action works from either `pending` or `approved`).
- `processing` — Stripe Transfer has been initiated; awaiting `transfer.created` webhook confirmation.
- `paid` — confirmed by the `transfer.created` webhook. Terminal, successful state.
- `denied` — cancelled by admin. No Stripe call made. Terminal.

### Admin UI entry points

**Dashboard** (`/dashboard/admin/`) — Shows a "Pending Payouts" section with the 5 most recent pending commissions and a count. Links to the full payout list.

**Payout list** (`/dashboard/admin/payouts`) — All commissions across all partners, filterable by status (`pending / approved / processing / paid / denied`) and type (`referral / fulfillment`), ordered newest-first.

**Payout detail** (`/dashboard/admin/payouts/:id`) — Full commission detail: partner link, type, amount, status badge, event link, Stripe onboarding status. Shows Approve and Deny action buttons when the commission is actionable. Shows contextual state messages when processing, paid, or denied.

**Business account detail** (`/dashboard/admin/accounts/:id`) — The existing "Pay Out" button on the Commissions & Payouts section of a partner's detail page still works and uses the same processing flow.

### API endpoints

| Method | URL | View | Description |
|--------|-----|------|-------------|
| GET | `/api/business-accounts/admin/commissions/` | `AdminCommissionListView` | List all commissions. Optional `?status=` and `?commission_type=` filters. |
| GET | `/api/business-accounts/admin/commissions/<id>/` | `AdminCommissionDetailView` | Single commission with business-account Stripe fields. |
| POST | `/api/business-accounts/admin/commissions/<id>/approve/` | `AdminApproveCommissionView` | Fire Stripe Transfer, set status to `processing`. |
| POST | `/api/business-accounts/admin/commissions/<id>/deny/` | `AdminDenyCommissionView` | Set status to `denied`. No Stripe call. |
| POST | `/api/business-accounts/admin/<account_id>/commissions/<id>/pay/` | `AdminPayCommissionView` | Legacy endpoint used by the Pay Out button on the business account detail page. Same Stripe + processing flow. |

All endpoints require `IsAdminUser`.

### Approve flow (detail)

`AdminApproveCommissionView.post()`:
1. Rejects if `commission.status` is already `processing`, `paid`, or `denied` (HTTP 400).
2. Rejects if `partner.stripe_connect_onboarding_complete` is `False` (HTTP 400).
3. Calls `stripe.Transfer.create()` with:
   - `amount` — commission amount in cents
   - `currency` — from `event.order.currency`, defaulting to `aud`
   - `destination` — `partner.stripe_connect_account_id`
   - `transfer_group` — `"commission_{commission.id}"`
4. Creates a `Payout` record (`status='processing'`).
5. Creates a `PayoutLineItem` linking the payout to the commission.
6. Sets `commission.status = 'processing'`.
7. Returns `{ status, stripe_transfer_id, payout_id }`.

If the Stripe call fails, nothing is persisted and the commission remains in its original status.

### Deny flow (detail)

`AdminDenyCommissionView.post()`:
1. Rejects if `commission.status` is `paid` or `processing` (HTTP 400).
2. Sets `commission.status = 'denied'`.
3. Returns `{ status: 'denied' }`.

No Stripe call is made.

---

## Phase 4 — Webhook Confirmation

### `transfer.created`

Handled by `handle_transfer_created(transfer)` in `payments/utils/webhook_handlers.py`, dispatched from `StripeWebhookView` in `payments/views/stripe_webhook.py`.

1. Looks up the `Payout` by `stripe_transfer_id`.
2. If already `completed`, skips (idempotent).
3. Sets `Payout.status = 'completed'`.
4. Finds the linked `Commission` via `PayoutLineItem` and sets `Commission.status = 'paid'`.

This is the step that moves a commission from `processing` to `paid`. The admin action only initiates the transfer; Stripe's webhook confirms it landed.

---

## Partner-Facing Payout View

Partners can see their own payout history in their dashboard. These views require only `IsAuthenticated` and scope all queries to the requesting user's partner profile.

| Method | URL | View | Description |
|--------|-----|------|-------------|
| GET | `/api/business-accounts/payouts/` | `PayoutListView` | List of all payouts for the authenticated partner. |
| GET | `/api/business-accounts/payouts/<id>/` | `PayoutDetailView` | Single payout with line items and `stripe_transfer_id`. |

---

## Edge Cases

- **Insufficient platform balance** — Stripe Transfer fails. HTTP 400 returned. Commission remains in its previous status; nothing is persisted.
- **Partner not onboarded** — Approve is blocked with HTTP 400 if `stripe_connect_onboarding_complete` is `False`. The Deny action does not require onboarding.
- **Double-processing** — Both Approve and Pay Out reject if the commission is already `processing`, `paid`, or `denied`.
- **Webhook replay** — `handle_transfer_created` is idempotent: if the payout is already `completed` it skips silently.
- **Refunds** — Not yet handled. If a customer is refunded after a commission is `pending`, the commission should be manually denied. If already `processing` or `paid`, a manual Stripe Transfer reversal may be required.
