# Admin Dashboard

This document explains the admin system — what it does, how it works, and why it was built the way it was.

---

## Philosophy

Bloomprint is not a marketplace. There is no third-party florist integration, no automated ordering API, and no fulfillment engine. Every single delivery is placed manually: the admin receives notification of an upcoming event, goes to a third-party florist website (e.g. FTD, Interflora, a local florist), places the order there, and then records that it was done. The admin system exists to support this workflow without making it painful.

The core design principle is **reducing friction for the person doing the work**. Every piece of information needed to place a flower order — recipient name, full address, budget, flower preferences, delivery date — is presented flat on a single screen. There is no clicking around to find the plan, then the recipient, then the preferences. It is all there at once.

The second principle is **keeping a clear paper trail**. When the admin marks an event as ordered, they paste in the confirmation number or order details. When they mark it delivered, they note how they confirmed it. This evidence lives on the event record permanently, so there is never any ambiguity about whether something was done or what was ordered.

The third principle is **proactive reminding, not reactive checking**. The admin should not have to log in and check whether anything needs ordering. The system should reach out. Notifications are created automatically when events are generated (at payment time) and are sent via the daily cron job — email and SMS — at 7 days and 3 days before each delivery.

---

## Why It Lives Inside the User Dashboard

The admin section is not a separate application. It lives inside `/dashboard/admin/*`, under the same `UserDashboardLayout` that every logged-in user uses. This was a deliberate choice:

- **No duplicate auth infrastructure.** The existing JWT auth, `ProtectedRoute`, and `useAuth` context handle everything. The `AdminGuard` component simply checks `user.is_staff || user.is_superuser` and redirects if false.
- **No separate nav shell to maintain.** The admin sidebar section appears conditionally in the existing sidebar — same pattern as the partner section — and disappears for non-staff users.
- **Simpler routing.** Admin routes are nested inside the `/dashboard` route block in `App.tsx`. They benefit from the same layout and lazy-loading setup as everything else.
---

## The Delivery Lifecycle

Every delivery follows a strict four-status lifecycle on the `Event` model:

```
scheduled → ordered → delivered
                ↘ cancelled (if the plan is cancelled)
```

**`scheduled`** — The event has been created (at payment time) and is waiting to be ordered. This is the default state.

**`ordered`** — The admin has placed the order with a third-party florist and recorded the evidence. The event now has an `ordered_at` timestamp and `ordering_evidence_text`.

**`delivered`** — The admin has confirmed the delivery was made. The event now has a `delivered_at` timestamp and `delivery_evidence_text`.

Status transitions are enforced on the backend — the mark-ordered endpoint rejects anything that is not `scheduled`, and mark-delivered rejects anything that is not `ordered`. This prevents double-submits and state confusion.

---

## The Task Queue

The Admin Dashboard page (`/dashboard/admin`) is the operational heart of the system. It shows three buckets:

**To Order** — Events with status `scheduled` and a delivery date within the next 14 days. These are the things that need action now. Cards are sorted by delivery date ascending. Urgency indicators highlight events that are ≤ 7 days away (orange) or ≤ 3 days away (red). Each card has a "Place Order" button that goes directly to the mark-ordered form.

**Ordered** — Events with status `ordered`. These are in-flight: the florist has been engaged, but delivery hasn't been confirmed yet. Each card has a "Confirm Delivery" button.

**Delivered** — The last 50 completed events, sorted by delivery date descending. This is for reference and audit purposes. Capped at 50 to avoid loading all historical data on every page load.

The 14-day cutoff on the "To Order" bucket is intentional. Events further out than that are not shown — they will appear when the window approaches. This keeps the queue focused on what needs attention now rather than showing everything scheduled for the next two years.

---

## The Event Detail Page

Each event card links to a detail page (`/dashboard/admin/events/:id`) which presents everything in two sections:

**Order Details** — All the information needed to place an order with a florist: full recipient name and address (as a single copyable line), delivery date, preferred time window, delivery notes, budget, plan type, frequency, flower type preferences, flower notes, and the card message. The customer's name and email are also included in case the admin needs to contact them.

**Status & Evidence** — The current status badge, plus the recorded timestamps and evidence text once an event has been ordered or delivered. Action buttons (Place Order / Confirm Delivery) are contextual to the current status.

The flat structure of the serializer (`AdminEventSerializer`) is what makes this page possible without additional API calls. Everything is returned in a single response.

---

## The Mark-Ordered and Mark-Delivered Forms

Both forms (`/dashboard/admin/events/:id/mark-ordered` and `.../mark-delivered`) follow the same pattern:

- Load the event on mount to show a summary header (who, when)
- A datetime-local input defaulting to now
- A textarea for evidence (confirmation number, delivery notes, etc.)
- Submit → POST to backend → navigate to `/dashboard/admin` on success
- Toast error on failure

The datetime input defaults to the current time because in practice the admin is filling this in at the moment they are doing the action. They can adjust it if they are recording something retrospectively.

---

## The Notification System

Notifications are not sent inline — they are created as database records and dispatched by a daily management command (`send_notifications`).

### When notifications are created

**At payment time** (inside webhook handlers): When an event is created — whether for an upfront plan bulk, a subscription first delivery, or a subscription recurring delivery — `create_admin_event_notifications` is called. This creates up to 4 pending `Notification` records:
- Email at `delivery_date - 7 days`
- SMS at `delivery_date - 7 days`
- Email at `delivery_date - 3 days`
- SMS at `delivery_date - 3 days`

Notifications are skipped if `scheduled_for` would be in the past (e.g. a very near-term delivery that was just paid for).

**When the admin marks an event as ordered**: All pending notifications for that event are cancelled (no longer needed — the order is placed). Two new delivery-day notifications are created (email + SMS) scheduled for `delivery_date` itself: a reminder to confirm once delivered.

### The cron job

`python manage.py send_notifications` — run daily. It queries all `Notification` records with `status='pending'` and `scheduled_for__lte=today`, then calls `send_notification()` on each. If a day is missed, the next run picks up everything overdue.

`send_notification()` resolves the recipient (admin email/phone from settings, partner from FK, customer from FK), sends via Mailgun (email) or Twilio (SMS), and updates the record status to `sent` or `failed`. It never raises — failures are logged and recorded but do not crash the cron job.

### Immediate payment notifications

Separate from the cron system, `send_admin_payment_notification()` is called directly from the webhook handlers at the moment of payment. This gives the admin an instant "new order received" alert with recipient name, delivery date, and budget — so they are aware of new orders in real time, not just when the cron runs.

---

## File Map

| File | Purpose |
|---|---|
| `events/models/event.py` | Status field (scheduled/ordered/delivered/cancelled) + evidence fields |
| `data_management/models/notification.py` | Notification model — stores pending/sent/failed/cancelled records |
| `data_management/serializers/admin_event_serializer.py` | Flat serializer — everything to place an order in one response |
| `data_management/views/admin_dashboard_view.py` | `GET /api/data/admin/dashboard/` — three-bucket response |
| `data_management/views/admin_event_detail_view.py` | `GET /api/data/admin/events/<pk>/` |
| `data_management/views/admin_mark_ordered_view.py` | `POST /api/data/admin/events/<pk>/mark-ordered/` |
| `data_management/views/admin_mark_delivered_view.py` | `POST /api/data/admin/events/<pk>/mark-delivered/` |
| `data_management/utils/notification_factory.py` | Creates and cancels Notification records |
| `data_management/utils/notification_sender.py` | Resolves recipient, sends via Mailgun/Twilio, updates record |
| `data_management/management/commands/send_notifications.py` | Daily cron — sends all due pending notifications |
| `payments/utils/webhook_handlers.py` | Wires notification creation into event creation at payment time |
| `payments/utils/send_admin_payment_notification.py` | Immediate payment alert (not cron — fires at webhook time) |
| `frontend/src/pages/admin/AdminDashboardPage.tsx` | Task queue UI |
| `frontend/src/pages/admin/AdminEventDetailPage.tsx` | Full event detail |
| `frontend/src/pages/admin/MarkOrderedPage.tsx` | Mark-ordered form |
| `frontend/src/pages/admin/MarkDeliveredPage.tsx` | Mark-delivered form |
| `frontend/src/components/AdminGuard.tsx` | Route guard — redirects non-staff to `/dashboard` |
| `frontend/src/api/admin.ts` | API calls for all four admin endpoints |
| `frontend/src/types/Admin.ts` | TypeScript types for admin data |
