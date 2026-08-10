# Deliveries: matching, claiming, fulfilling

How a paid order reaches a florist. This replaced an assignment model in which a
cron picked one florist per delivery and waited for them to accept or decline.

## Lifecycle

```
scheduled  →  claimed  →  delivered
                  ↘  cancelled
```

- **scheduled** — paid for, on the claim board, nobody has taken it.
- **claimed** — a florist has taken it. Set in the same locked transaction as the
  `DeliveryRequest`, so the event status and the claim row cannot disagree.
- **delivered** — fulfilled. Creates the florist's payable.

There is no `ordered` state. It meant "Bloomprint has sourced the flowers by
hand", which the claiming florist now does. `events/migrations/0014` maps any
remaining `ordered` rows to `claimed`.

## Geocoding

Florist matching is a pure distance test, so an order **must** have
`Order.latitude` / `Order.longitude` or it can never reach a florist. Addresses
are geocoded via Nominatim (OpenStreetMap) in `events/utils/geocoding.py`:
full street address first, falling back to suburb, then suburb without postcode.

> **Known limitation.** Geocoding runs **synchronously inside the request** that
> saves the address (`OrderSerializer.update`). Nominatim's usage policy allows
> one request per second, enforced by a module-level lock, so concurrent address
> saves *serialise* — ten at once means a ~11 second tail on a web worker. This
> is acceptable at current volume and should move to a background job before it
> isn't. Doing it in-request is deliberate for now: a failure is visible while
> the customer is still on the page.

An order with no coordinates is an admin problem, not a silent one — it shows as
"Not geocoded" on the admin order and event pages, and is filterable in Django
admin. `manage.py geocode_orders` backfills.

## Matching

`partners/utils/matching.py` holds one predicate read from both ends, so a
florist can never be emailed about a job their board won't show:

- `eligible_florists_for_event(event)` — drives the fan-out.
- `claimable_events_for_florist(florist)` — drives the board.

A florist matches when they are `account_type='florist'`, `status='active'`, have
coordinates, and the delivery is within their `service_radius_km` by haversine.
Because haversine cannot run in SQL, both sides prefilter with a lat/lng bounding
box and refine in Python.

`active_florist_for(user)` is the single gate every florist-facing view uses.

## Fan-out

On payment, `notify_florists_of_new_delivery()` emails **every** eligible florist
at once — first come, first served. Rows are written to `Notification` and sent
immediately rather than queued, because a daily cron would decide the race by
schedule. Failures stay `pending` for the cron to retry.

The email carries the **request** variant of the florist brief PDF: area, date,
occasion, preferences, and the full money breakdown, but **no recipient name,
street address, delivery notes, or card message**. Every florist in radius
receives it and most will never claim, and an emailed PDF cannot be recalled.
Its QR points at `/florists`.

Subscription renewals fan out exactly like first deliveries.

## Claiming

`POST /api/business-accounts/available-deliveries/<event_id>/claim/`

Inside one transaction: `select_for_update()` on the Event, re-verify the florist
covers it server-side, re-verify it is claimable, then write the
`DeliveryRequest` and flip the event to `claimed`. The loser of a race gets 409.

The row lock is the concurrency guarantee — MySQL has no partial unique indexes,
so "one accepted claim per event" cannot be a constraint.

Claiming also cancels the pending unclaimed-delivery warnings, schedules the
admin delivery-day reminder, and emails the florist the **claimed** brief — the
full document, with the address, the card message, and "Card from" so they can
sign the card. Its QR points at `/login`.

## Admin alerts

`create_admin_event_notifications()` schedules email + SMS at T-7 and T-3 saying
a delivery is **still unclaimed**. They are cancelled the moment a florist claims,
so receiving one means nobody has taken the job. They previously said "order the
flowers", from when admin sourced every bouquet.

## Fulfilling

Both mark-delivered paths call `create_fulfillment_payable()`. See
`_docs/payouts.md`.

## Security notes

Every florist endpoint requires an authenticated, **active** florist, and the job
sheet and mark-delivered are additionally scoped to the caller's own claims. The
pre-claim board deliberately withholds recipient PII.

Earlier builds addressed the job sheet by an unguessable token with
`AllowAny`, which exposed the recipient's address to anyone holding the URL and —
once marking delivered created a payable — allowed an unauthenticated financial
write. Both token endpoints are gone and `DeliveryRequest.token` has been dropped.
