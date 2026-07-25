# Remove guest User accounts — put customer data on the Order

**Date:** 2026-07-25
**Status:** Approved design, ready for implementation planning

## Goal

Stop creating a `User` row for every guest checkout. Store the customer's
identity directly on the `Order`. Customers never authenticate (confirmed
product decision), so a customer-side `User` is pure overhead: it exists only
as a data holder and, because many guest rows end up sharing one real email, it
is the root cause of a whole class of bugs.

## Motivation

Every customer order today creates a placeholder `User`
(`guest-<uuid>@checkout.invalid`, unusable password). Its `email` is later set
to the buyer's real address. Because one buyer produces many orders, many `User`
rows share one email. That duplication has already caused, this week alone:

- login "no active account" confusion (username vs email),
- `MultipleObjectsReturned` crashing password reset (`.get(email=...)`),
- registration/email-change wrongly blocked by guest rows (worked around with a
  `User.objects.real()` manager).

Those workarounds are patches on a design smell. Removing the guest `User`
deletes the smell: no duplicate emails, no collisions, no `.real()` filter
needed.

## Confirmed decisions

1. **Customers never log in.** Order management is admin-only; customers receive
   email/private links. The authenticated customer dashboard and its endpoints
   are dead code.
2. **Remove all dead code — backend and frontend.**
3. **Drop `Order.user` entirely** (it would be permanently null).

## Current architecture

The guest `User` holds four data points nothing else stores: `email`,
`first_name`, `last_name`, `stripe_customer_id`.

Five models point at it:

| Model | Field | on_delete | Role for customer orders |
|-------|-------|-----------|--------------------------|
| `events.Order` | `user` | CASCADE | owner |
| `payments.Payment` | `user` | CASCADE | who paid |
| `data_management.Notification` | `recipient_user` | SET_NULL (nullable) | customer email target |
| `data_management.TermsAcceptance` | `user` | CASCADE | checkout consent |
| `partners.DiscountUsage` | `user` | CASCADE | "one code per email" |

`partners.Partner.user` (OneToOne) is a **real** account and is out of scope.

Notable readers of `order.user`:
- `payments/utils/checkout.py` — `ensure_stripe_customer(order.user)`,
  `order.user.stripe_customer_id`, `Payment(user=order.user)`.
- `payments/utils/webhook_handlers.py` — `send_customer_payment_notification(order.user, ...)`,
  `DiscountUsage(user=payment.user)`, `Payment defaults user=order.user`.
- `data_management/utils/notification_factory.py` — `recipient_user=order.user`,
  `first_name`.
- `data_management/utils/send_notification.py` — `resolve_recipient` reads
  `notification.recipient_user.email` for `recipient_type='customer'`.
- `events/views/guest_checkout_view.py` — name/email display, terms, discount.
- Admin serializers — `admin_event_serializer` (`order.user.*`),
  `admin_plan_serializer` / `admin_plan_detail_serializer` (`user.email`).

## Target architecture

### Order gains customer fields

Add to `events.Order`:

- `customer_email` (EmailField, nullable/blank — set at claim)
- `customer_first_name`, `customer_last_name` (CharField, blank)
- `stripe_customer_id` (CharField, blank/null)
- `terms_accepted_at` (DateTimeField, null) and `accepted_terms`
  (FK → `TermsAndConditions`, null, `on_delete=PROTECT`) — records the customer's
  consent at checkout in place of a `TermsAcceptance` row.

Remove `Order.user` (and `related_name='orders'`). `Order.__str__` stops using
`self.user.username`.

`CheckoutSession.customer_email` is now redundant with `Order.customer_email`;
consolidate onto the order (the session already links to its order).

### The five FKs

- **Payment.user** → dropped. Identity is `payment.order.customer_email`.
  `Payment.__str__` uses the order instead. (Real users never create payments.)
- **Notification.recipient_user** → add `recipient_email` (EmailField, null).
  `resolve_recipient` for `customer` returns `notification.recipient_email`.
  `recipient_user` is dropped after backfill.
- **TermsAcceptance (customer)** → replaced by `Order.terms_accepted_at` /
  `accepted_terms`. The `TermsAcceptance` model **stays** for real users
  (partners accepting florist/affiliate terms via `AcceptTermsView`). Only the
  customer usage moves.
- **DiscountUsage.user** → dropped. The "one code per email" check re-sources
  from `payment__order__customer_email__iexact=email`. `DiscountUsage.__str__`
  stops using `user.email`.

### Stripe customer

`ensure_stripe_customer` takes an `order` (not a user): if
`order.stripe_customer_id` is empty, create the Stripe customer from
`order.customer_email` / names and store the id on the order. All
`order.user.stripe_customer_id` reads become `order.stripe_customer_id`.

### Guest checkout view

- `start`: create only an `Order` (no `User`, no `set_unusable_password`).
- `claim`: write `customer_email/first_name/last_name` onto the order.
- `accept-terms`: set `order.terms_accepted_at` + `accepted_terms`.
- `_has_accepted_current_terms`, discount checks, GET `order` response: read the
  order's customer fields instead of `order.user`.
- Drop the `GUEST_USERNAME_SUFFIX` placeholder machinery and the `User` import.

### Dead code to remove (customers-never-log-in)

**Backend:**
- `events/views/order_view.py` `OrderViewSet` (customer read/edit/cancel) and its
  route. *Confirm* nothing admin depends on it before deleting; admin uses
  `data_management` endpoints.
- `events/views/event_view.py` `EventViewSet` and its route.
- `users/views/register_view.py` + `RegisterSerializer` + `/register/` route
  (unused by frontend).
- `data_management/views/terms_acceptance_view.py` customer path — keep only if
  partners use it; otherwise remove. (Partners accept terms during partner
  registration — verify.)
- `users` customer `change-password` if only reachable by customers (verify vs
  partner use).

**Frontend:**
- `src/app/dashboard/orders/**`, `src/app/dashboard/account/**`.
- `src/api/orders.ts`, customer parts of `src/api/events.ts`, `src/api/users.ts`
  (`/me`) if unused elsewhere.
- Any nav links pointing at the removed pages.

> Each removal must be justified by "no remaining caller" — grep before deleting.
> `password-reset` and partner flows stay.

## Data migration

One data migration (after the additive schema migration), reversible where
practical:

1. For each `Order` with a guest `user`: copy `user.email` →
   `customer_email`, `user.first_name/last_name` → `customer_*`,
   `user.stripe_customer_id` → `stripe_customer_id`.
2. For each customer `Notification` (`recipient_type='customer'`): set
   `recipient_email = recipient_user.email`.
3. For each customer `TermsAcceptance`: set the linked order's
   `terms_accepted_at` / `accepted_terms` from the acceptance (best-effort — map
   via the order if resolvable; otherwise set `terms_accepted_at` only).
4. Null out `Payment.user` / `DiscountUsage.user` references (they are being
   dropped; email is now sourced from the order).
5. Delete guest `User` rows (`username__endswith='@checkout.invalid'`).

Guard every step against missing/NULL data. Verify counts before/after.

## Phasing

Each phase is independently deployable and leaves the test suite green.

- **Phase 1 — Additive.** Add the new `Order` fields, `Notification.recipient_email`.
  Run the backfill data migration. No behavior change; nothing reads the new
  fields yet.
- **Phase 2 — Switch.** Point all readers/writers at the order fields
  (checkout/Stripe, webhooks, notification factory + sender, guest checkout view,
  admin serializers, discount check). Stop creating guest users. Guest orders now
  run entirely user-less.
- **Phase 3 — Drop & clean.** Drop `Order.user`, `Payment.user`,
  `Notification.recipient_user`, `DiscountUsage.user`. Delete guest User rows.
  Remove all dead backend + frontend code. Remove the now-unnecessary
  `User.objects.real()` manager and its `.real()` call sites (revert to plain
  duplicate-email checks) — the collisions it guarded against can no longer occur.

## Testing strategy

- Unit tests for the backfill migration (build guest users + orders + related
  rows, run migration, assert data landed on orders and guest rows deleted).
- Guest checkout flow tests updated: no `User` created; `claim` sets order
  fields; `accept-terms` sets `terms_accepted_at`; discount per-email still
  enforced via `customer_email`.
- Payment/webhook tests: Stripe customer created from order; `DiscountUsage`
  recorded and per-email reuse still blocked.
- Notification tests: customer notification resolves to `recipient_email` and
  sends.
- Admin serializer tests: customer fields come from the order.
- Full `users/ partners/ events/ payments/ data_management/` suites green.
- Fix the pre-existing `IndentationError` in
  `partners/tests/view_tests/test_partner_registration_view.py:33` so collection
  passes (tracked separately, but blocks a clean full run).

## Risks / open items

- **Existing paid subscriptions.** Recurring orders reference a Stripe customer
  currently stored on the guest user. The migration must copy
  `stripe_customer_id` to the order so subscription webhooks keep resolving.
  Verify no code path still needs the user after Phase 2.
- **`TermsAcceptance` order linkage.** A customer `TermsAcceptance` has no direct
  FK to the order (only user+terms). Migration maps it via the user's order(s);
  where ambiguous, set `terms_accepted_at` without a specific `accepted_terms`.
- **Admin "customer" views.** With no customer `User`, any admin user-list view
  that showed customers now shows only staff/partners. Admin customer visibility
  shifts to order-based views — confirm this matches admin expectations (may be a
  follow-up).
- **Frontend removals** must be grepped for stray imports/routes to avoid build
  breaks.
