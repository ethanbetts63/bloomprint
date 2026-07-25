# Remove Guest User Accounts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop creating a `User` per guest checkout; store customer identity on the `Order`; remove all now-dead customer-account code.

**Architecture:** Three deployable phases — (1) add Order/Notification fields + backfill data, (2) switch every reader/writer to the order fields and stop creating guest users, (3) drop dead FKs/models/endpoints/frontend and delete guest User rows. Django + DRF backend, Next.js frontend, MySQL, Stripe.

**Tech Stack:** Django 6, DRF, SimpleJWT, Stripe, pytest, Next.js.

## Global Constraints

- Every phase leaves `pytest users/ partners/ events/ payments/ data_management/` green (excluding the pre-existing broken `partners/tests/view_tests/test_partner_registration_view.py`, fixed in Task 0).
- Guest accounts are identified by `username__endswith='@checkout.invalid'` (`GUEST_USERNAME_SUFFIX` in `users/models/user.py`).
- TDD: failing test → minimal code → green → commit. One logical change per commit.
- Do not break existing paid Stripe subscriptions: `stripe_customer_id` must move to the order before any user deletion.
- Real accounts (staff/superuser/partner, `Partner.user`) are out of scope and must remain untouched.

---

## Task 0: Baseline — commit session fixes, fix broken test

**Files:**
- Modify: `partners/tests/view_tests/test_partner_registration_view.py:33` (fix `IndentationError`)

- [ ] Commit the already-made session bug-fixes (password-reset, `.real()` manager, migration `0002`) as a checkpoint so the refactor starts from a clean tree.
- [ ] Fix the over-indented `assert partner.status == 'pending'` at line 33.
- [ ] Run `pytest partners/tests/view_tests/test_partner_registration_view.py -q` → collection passes, tests green.
- [ ] Commit.

---

## PHASE 1 — Additive fields + backfill (no behavior change)

### Task 1: Add customer fields to Order

**Files:**
- Modify: `events/models/order.py`
- Test: `events/tests/model_tests/test_order_model.py` (create if absent)

**Produces:** `Order.customer_email`, `Order.customer_first_name`, `Order.customer_last_name`, `Order.stripe_customer_id`, `Order.terms_accepted_at`, `Order.accepted_terms` (FK→`TermsAndConditions`, null, PROTECT). `Order.user` still present (dropped in Phase 3).

- [ ] Write failing test: an `Order` can be created with `customer_email`/names/`stripe_customer_id`/`terms_accepted_at` and reads them back.
- [ ] Add the fields (all nullable/blank). Keep `Order.user` for now.
- [ ] `python manage.py makemigrations events` → additive migration.
- [ ] Run test → pass. Commit.

### Task 2: Add recipient_email to Notification

**Files:**
- Modify: `data_management/models/notification.py`
- Test: `data_management/tests/model_tests/test_notification_model.py` (create if absent)

**Produces:** `Notification.recipient_email` (EmailField, null, blank).

- [ ] Write failing test: notification stores/reads `recipient_email`.
- [ ] Add field; makemigrations; test → pass. Commit.

### Task 3: Backfill data migration

**Files:**
- Create: `events/migrations/00NN_backfill_customer_from_guest.py` (data migration; depends on Tasks 1–2 migrations)
- Test: `events/tests/migration_tests/test_backfill.py`

**Interfaces:** Uses historical models via `apps.get_model`. Copies from guest `User` (username ends `@checkout.invalid`) to its orders.

- [ ] Write test using `django_test_migrations` or a hand-rolled fixture: create guest user + order + customer Notification + TermsAcceptance, run migration function, assert order.customer_* / stripe_customer_id populated and notification.recipient_email set.
- [ ] Implement `forwards`:
  - For each `Order` whose `user` is a guest: set `customer_email=user.email`, `customer_first_name=user.first_name`, `customer_last_name=user.last_name`, `stripe_customer_id=user.stripe_customer_id`.
  - For each `Notification` with `recipient_type='customer'` and `recipient_user`: set `recipient_email=recipient_user.email`.
  - For each customer `TermsAcceptance`: for each of that user's orders lacking `terms_accepted_at`, set `terms_accepted_at=accepted_at` and `accepted_terms=terms`.
  - Guard all against NULLs. `reverse_code = migrations.RunPython.noop`.
- [ ] Run test → pass. Run full suite → green. Commit.

---

## PHASE 2 — Switch readers/writers to order fields; stop creating guest users

### Task 4: Stripe customer keyed on order

**Files:**
- Modify: `payments/utils/checkout.py` (`ensure_stripe_customer`, `_start_one_time_payment`, `_start_subscription_payment`, `_record_pending_payment`)
- Test: `payments/tests/util_tests/test_checkout.py`

**Produces:** `ensure_stripe_customer(order)` creates the Stripe customer from `order.customer_email`/names, stores `order.stripe_customer_id`. Payment creation no longer passes `user`.

- [ ] Failing test: `ensure_stripe_customer(order)` on an order with no `stripe_customer_id` calls `stripe.Customer.create` with the order's email and sets `order.stripe_customer_id` (mock stripe).
- [ ] Change signature to take `order`; replace `order.user.stripe_customer_id` reads with `order.stripe_customer_id`; `_record_pending_payment` stops setting `user` (see Task 7 for Payment.user nullability — until then pass `user=None` is invalid, so order Task 7 **before** removing user column; here keep writing `user=order.user` guarded `if order.user`). NOTE: sequence Task 7 nullability migration is Phase 3; in Phase 2 keep `Payment.user=order.user` working since guest users still exist for old orders but NEW orders are user-less → make `_record_pending_payment` set `user=order.user` only when present. Confirm Payment.user is nullable first (fold the nullable migration into Task 4).
- [ ] Make `Payment.user` nullable (migration) as part of this task so user-less orders can record payments.
- [ ] Run tests → pass. Commit.

### Task 5: Notification factory + sender use email

**Files:**
- Modify: `data_management/utils/notification_factory.py` (`create_customer_delivery_day_notification`)
- Modify: `data_management/utils/send_notification.py` (`resolve_recipient`)
- Test: `data_management/tests/util_tests/test_send_notification.py`, existing notification-factory tests

**Produces:** customer notifications set `recipient_email=order.customer_email` (no `recipient_user`); `resolve_recipient` returns `notification.recipient_email` for `recipient_type='customer'`.

- [ ] Failing test: `resolve_recipient` on a customer notification with `recipient_email` set returns that email (no user).
- [ ] `resolve_recipient` customer branch → `return notification.recipient_email, None`.
- [ ] `create_customer_delivery_day_notification`: `first_name = order.customer_first_name or ''`; set `recipient_email=order.customer_email` instead of `recipient_user`.
- [ ] Run tests → pass. Commit.

### Task 6: Guest checkout view — no user creation

**Files:**
- Modify: `events/views/guest_checkout_view.py`
- Test: `events/tests/view_tests/test_guest_checkout_*.py`

**Produces:** `start` creates only an `Order`; `claim` writes `order.customer_*`; `accept-terms` sets `order.terms_accepted_at`/`accepted_terms`; GET `order`, `_has_accepted_current_terms`, discount checks read order fields. No `User` import / `GUEST_USERNAME_SUFFIX` usage.

- [ ] Failing test: `POST start` creates an Order and **no** new `User` row (`User.objects.count()` unchanged).
- [ ] Failing test: `POST claim` sets `order.customer_email/first_name/last_name`; `POST accept-terms` sets `order.terms_accepted_at`.
- [ ] Rewrite `start` to `Order.objects.create(billing_mode='one_time')` (no user). Rewrite `claim` to write order fields + `session.customer_email`. Rewrite `accept_terms` to set order terms fields. Replace `session.order.user.first_name/last_name/email` reads in GET with `order.customer_*`. `_discount_already_used_by_email` unchanged (still email-based) — but update `DiscountUsage` query in Task 8.
- [ ] Remove `GUEST_USERNAME_SUFFIX` import and guest-user lines.
- [ ] Run guest-checkout tests → pass. Commit.

### Task 7: Webhooks + admin serializers read order fields

**Files:**
- Modify: `payments/utils/webhook_handlers.py` (`_create_first_event` → `send_customer_payment_notification`; `DiscountUsage.create`; Payment defaults)
- Modify: `data_management/serializers/admin_event_serializer.py`, `admin_plan_serializer.py`, `admin_plan_detail_serializer.py`
- Modify: `payments/utils/send_customer_payment_notification.py` (accept order/email)
- Test: `payments/tests/...`, `data_management/tests/...`

**Produces:** all admin customer fields sourced from `order.customer_*`; payment-success notification uses order email; `DiscountUsage` created without `user`.

- [ ] Failing tests: admin event serializer returns `order.customer_email`; webhook success sends customer notification via order email.
- [ ] `admin_event_serializer`: `source='order.customer_email'`, `order.customer_first_name/last_name`; drop `customer_id` or set to `order.id`. `admin_plan_*`: `source='customer_email'`.
- [ ] `send_customer_payment_notification(order)`; webhook passes `order`.
- [ ] `DiscountUsage.objects.create(discount_code=..., payment=...)` (no `user`; needs Task 8 nullable).
- [ ] Run tests → pass. Commit.

### Task 8: DiscountUsage email-sourced; misc order.user readers

**Files:**
- Modify: `partners/models/discount_usage.py` (`__str__`), make `user` nullable (migration)
- Modify: `events/views/guest_checkout_view.py` `_discount_already_used_by_email` → `payment__order__customer_email__iexact`
- Modify: `partners/serializers/validate_discount_code_serializer.py`, `partners/views/delivery_request_views.py`, `partners/management/commands/process_delivery_notifications.py`, `data_management/serializers/admin_user_detail_serializer.py` (remove order-by-user history), any remaining `order.user` readers
- Test: relevant existing tests

**Produces:** no runtime code reads `order.user`; per-email discount enforcement via `order.customer_email`.

- [ ] Failing test: a code used on a paid order with email X is blocked for a second order with email X (via `customer_email`, no users).
- [ ] Update `_discount_already_used_by_email` query and every remaining `order.user`/`user=order.user` reader to order fields or removal. Make `DiscountUsage.user` nullable.
- [ ] `grep -rn "order\.user\|order__user\|\.user\b" --include=*.py` over app code → only real-user (Partner) references remain.
- [ ] Run full suite → green. Commit.

---

## PHASE 3 — Drop dead FKs/models, delete guest rows, remove dead code

### Task 9: Delete guest User rows (data migration)

**Files:**
- Create: `users/migrations/00NN_delete_guest_users.py`
- Test: migration test

- [ ] Test: guest users deleted, real users retained.
- [ ] `forwards`: null any remaining `Payment.user`/`DiscountUsage.user`/`Notification.recipient_user` pointing at guests, then delete `User.objects.filter(username__endswith='@checkout.invalid')`. `reverse=noop`.
- [ ] Run → pass. Commit.

### Task 10: Drop the dead FK columns

**Files:**
- Modify: `events/models/order.py` (remove `user`, fix `__str__`), `payments/models/payment.py` (remove `user`, fix `__str__`), `data_management/models/notification.py` (remove `recipient_user`), `partners/models/discount_usage.py` (remove `user`, fix `__str__`)
- Migrations for each app

- [ ] Remove the four fields; `makemigrations`; `migrate`.
- [ ] `Order.__str__` → `f"Order {self.id} ({self.billing_mode})"`; `Payment.__str__` → order-based; `DiscountUsage.__str__` → order-email-based.
- [ ] Run full suite → green. Commit.

### Task 11: Remove dead backend endpoints

**Files:**
- Delete: `events/views/order_view.py`, `events/views/event_view.py`, `users/views/register_view.py`, `users/serializers/register_serializer.py`, `data_management/views/terms_acceptance_view.py` (verify no partner dependency first)
- Modify: `events/urls.py` (drop `orders`/`''` routes), `users/urls.py` (drop `register`), `data_management/urls.py` (drop terms accept), remove related tests

- [ ] `grep` each for remaining callers (backend + frontend) before deleting.
- [ ] Delete views/serializers/routes and their tests. Keep partner terms acceptance if partners use it.
- [ ] Run full suite → green. Commit.

### Task 12: Remove dead frontend

**Files:**
- Delete: `frontend/src/app/dashboard/orders/**`, `frontend/src/app/dashboard/account/**`, `frontend/src/api/orders.ts`; prune unused parts of `frontend/src/api/events.ts`, `frontend/src/api/users.ts`
- Modify: nav/links referencing removed routes

- [ ] `grep` for imports/links to removed pages/clients; remove them.
- [ ] `npm run build` (or `next build`) → passes.
- [ ] Commit.

### Task 13: Remove the now-unnecessary `.real()` workaround

**Files:**
- Modify: `users/models/user.py` (remove `CustomUserManager.real()` if nothing else needs it; keep `GUEST_USERNAME_SUFFIX` only if still referenced), `users/serializers/register_serializer.py`, `partner_registration_serializer.py`, `user_profile_serializer.py` (revert `.real().filter` → `.filter`)
- Modify: `users/views/password_reset_request_view.py` can keep the eligible-filter (still correct)

- [ ] With guest users gone, duplicate emails can't occur; revert `.real()` calls to plain `.filter(email__iexact=...)`.
- [ ] Remove `CustomUserManager`/manager migration only if fully unused; otherwise leave. (Password-reset eligible-filter stays — it's correct regardless.)
- [ ] Run full suite → green. Commit.

---

## Self-review notes

- Spec coverage: Order fields (T1), Notification email (T2), backfill (T3), Stripe (T4), notifications (T5), guest view (T6), webhooks/admin (T7), discount/readers (T8), delete guests (T9), drop columns (T10), dead backend (T11), dead frontend (T12), revert workaround (T13). All spec sections mapped.
- Sequencing risk: `Payment.user`/`DiscountUsage.user` nullability migrations are folded into Tasks 4/8 (before user-less orders write payments), columns dropped only in T10 after all readers gone and guest rows deleted (T9).
- Stripe subscription safety: `stripe_customer_id` copied to orders in T3 before any deletion in T9.
