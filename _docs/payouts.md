# Payouts

How money reaches a partner. Two kinds of partner get paid, for different reasons:

- **Florists** — paid for each delivery they claim and fulfil.
- **Affiliates** — paid a referral commission when a customer they referred pays.

Florists do **not** earn referral commissions, and affiliates never fulfil
deliveries. All money moves via Stripe Connect: customer payments land in the
Bloom Print platform balance, and admin initiates a transfer to the partner's
connected Express account per payout.

---

## The money split

Defined once in `events/utils/fee_calc.py` and surfaced through
`Event.money_breakdown()`, which is the single source for the florist brief PDF,
the claim board, the job sheet, and the payable.

| Piece | Rule |
|---|---|
| `budget` | What the customer chose for flowers |
| `delivery_fee` | `$DELIVERY_FEE` when budget is under `$DELIVERY_INCLUDED_THRESHOLD`, otherwise `$0` — the budget absorbs delivery above the threshold |
| `platform_commission` | `FLORIST_COMMISSION_RATE` × budget. **Never** taken on the delivery fee |
| `florist_budget` | `budget − platform_commission` — what the florist spends on flowers |
| `florist_total` | `florist_budget + delivery_fee` — **what the florist is paid** |

Bloom Print therefore keeps exactly the commission rate of the budget on every
order, and the delivery fee passes to the florist untouched. Below the delivery
threshold the florist is paid *more* than the budget, because the customer paid
the fee on top.

These figures are **snapshotted onto the Event at creation** (`florist_budget`,
`platform_commission`, `delivery_fee`). Changing the rate later cannot alter what
a florist was already promised.

> **Margin warning.** The affiliate referral tiers in
> `partners/utils/commission_utils.py` were set against a 15% commission rate.
> At 10% they equal the entire platform commission at $100, $150 and $250, so a
> referred order nets roughly zero — and negative once the $5 discount code is
> applied. Revisit the tiers or the rate before scaling affiliates.

---

## Data model

### `Commission`
Money owed to a partner. `commission_type` is either:

- `referral` — an affiliate's cut, created automatically on payment.
- `fulfillment` — a florist's delivery payment, created when a delivery is
  marked delivered. Despite living on a model called Commission, this is the
  florist's revenue, not a commission.

Status: `pending → approved → processing → paid`, or `denied`.

### `Payout`
One Stripe Transfer. Currently always one payout per delivery — `Payout` and
`PayoutLineItem` support batching, but nothing batches.

### `PayoutLineItem`
Links a `Payout` to the `Commission` it covers.

### `DeliveryRequest`
A florist's **claim** on a delivery. The name is historical: it was an offer
under the old push-assignment model. A row exists only because a florist took the
job, hence its single `accepted` status.

---

## Florist payouts

1. Customer pays → `Event(status='scheduled')`, announced to every eligible
   florist (see `_docs/deliveries.md`).
2. A florist claims it → `DeliveryRequest`, and `Event.status = 'claimed'` in the
   same locked transaction.
3. Delivery is marked delivered, by either:
   - the florist, at `POST /api/business-accounts/delivery-requests/<id>/mark-delivered/`
   - admin, at `POST /api/data/admin/events/<id>/mark-delivered/`
4. Either path calls `create_fulfillment_payable()`
   (`partners/utils/fulfillment.py`), which writes a `Commission` for
   `florist_total`. Idempotent — both parties can mark the same delivery.
5. Admin approves it, which fires the Stripe Transfer.
6. The `transfer.created` webhook confirms it.

## Affiliate commissions

Created inside the payment webhooks by `process_referral_commission()` when a
payment succeeds. Skipped if the customer was not referred, if the referrer is a
florist, or after the customer's third successful payment.

Tiers (`REFERRAL_COMMISSION_TIERS`): `<$100 → $5`, `<$150 → $10`, `<$200 → $15`,
`<$250 → $20`, `≥$250 → $25`.

---

## Paying out

`partners/utils/payouts.py::pay_commission()` is the only code that moves money.
Both admin entry points delegate to it:

| Method | URL | Description |
|---|---|---|
| GET | `/api/business-accounts/admin/commissions/` | All commissions, filterable by `status` and `commission_type` |
| GET | `/api/business-accounts/admin/commissions/<id>/` | One commission |
| POST | `/api/business-accounts/admin/commissions/<id>/approve/` | Pay it |
| POST | `/api/business-accounts/admin/commissions/<id>/deny/` | Deny it. No Stripe call |
| POST | `/api/business-accounts/admin/<account_id>/commissions/<id>/pay/` | Same as approve, reached from the account page |

`pay_commission` refuses if the commission is already `processing`, `paid` or
`denied`, or if the partner has not completed Stripe onboarding. On Stripe
failure nothing is persisted, so the commission is unchanged and retryable.
On success it creates the `Payout` and `PayoutLineItem` and moves the commission
to `processing`.

Payouts are **manual** — there is no scheduled payout job. Admin approves each
one.

### `transfer.created`
`handle_transfer_created()` marks the `Payout` completed and its `Commission`
paid. Idempotent on replay. This is what moves a commission from `processing` to
`paid`; the admin action only initiates the transfer.

---

## Partner-facing views

| Method | URL | Description |
|---|---|---|
| GET | `/api/business-accounts/payouts/` | The partner's own payouts |
| GET | `/api/business-accounts/payouts/<id>/` | One payout with line items |

---

## Edge cases

- **Insufficient platform balance** — the Transfer fails, HTTP 400, nothing persisted.
- **Partner not onboarded** — approve is blocked. Deny is not.
- **Double-marking delivered** — `create_fulfillment_payable` is idempotent.
- **Webhook replay** — `handle_transfer_created` skips a completed payout.
- **Mis-clicked "delivered"** — creates a payable with no un-deliver path. Known gap.
- **Refunds** — not handled. Deny a `pending` commission manually; anything
  already `processing` or `paid` needs a manual Stripe reversal.
