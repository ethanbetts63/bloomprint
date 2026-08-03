# Notifications

Bloom Print sends notifications via two channels: **email** (Mailgun) and **SMS** (Twilio). There are two delivery mechanisms: immediate direct API calls, and a queued system processed by a daily cron job.

---

## Architecture

### Queued notifications
Most notifications are stored as `Notification` records in the database and sent by a daily management command:

```
python manage.py send_notifications
```

This queries all `Notification` objects with `status='pending'` and `scheduled_for <= today`, then calls `send_notification()` on each. Results are written back to the record (`status`, `sent_at`, `error_message`).

**Key files:**
- `data_management/models/notification.py` — the model
- `data_management/utils/send_notification.py` — sends a single notification via Mailgun or Twilio
- `data_management/utils/notification_factory.py` — creates notification records at the right times
- `data_management/management/commands/send_notifications.py` — the cron command

### Immediate notifications
Some notifications bypass the queue and are sent directly at the moment an event occurs (e.g. payment received). These use the same Mailgun/Twilio APIs but are not stored as `Notification` records.

**Key files:**
- `payments/utils/send_admin_payment_notification.py`
- `payments/utils/send_customer_payment_notification.py`

### SMS copy
All SMS message strings are defined centrally in:
- `data_management/utils/sms_messages.py`

Edit this file to change the wording of any text message without touching business logic.

### Email templates
All emails are rendered from Django HTML templates before being sent. Templates use a shared base layout.

**Base template:** `events/templates/notifications/emails/base.html`
**Child templates:** `data_management/templates/notifications/emails/`
**Password reset:** `users/templates/users/emails/password_reset_email.html`

---

## All Notification Triggers

### Immediate — fire at the moment the event occurs

| # | Recipient | Channel | Trigger | File |
|---|-----------|---------|---------|------|
| 1 | Admin | Email + SMS | Payment received (any plan type) | `send_admin_payment_notification.py` |
| 2 | Customer | Email | Payment received (upfront or first subscription payment only) | `send_customer_payment_notification.py` |
| 3 | Admin | Email + SMS | Customer cancels a plan that has already-ordered events | `send_admin_payment_notification.py` |
| 4 | Customer | Email | Forgot password request | not yet implemented |
| 5 | Admin | Email | Forgot password request | not yet implemented |
| 6 | Partner | Email | Forgot password request | not yet implemented |

### Queued — stored in the database, sent by daily cron

| # | Recipient | Channel | Scheduled for | Created when | Template |
|---|-----------|---------|---------------|--------------|----------|
| 7 | Admin | Email | T-7 days before delivery | Event created at payment | `admin_notification.html` |
| 8 | Admin | SMS | T-7 days before delivery | Event created at payment | `sms_messages.admin_event_reminder()` |
| 9 | Admin | Email | T-3 days before delivery | Event created at payment | `admin_notification.html` |
| 10 | Admin | SMS | T-3 days before delivery | Event created at payment | `sms_messages.admin_event_reminder()` |
| 11 | Customer | Email | Delivery day | Event created at payment | `customer_delivery_day.html` |
| 12 | Admin | Email | Delivery day | Admin marks event as ordered | `admin_notification.html` |
| 13 | Admin | SMS | Delivery day | Admin marks event as ordered | `sms_messages.admin_delivery_day()` |

---

## Notification Lifecycle

When an event is created (payment received):
1. T-7 and T-3 admin reminders are queued (#7–10)
2. Customer delivery-day notification is queued (#11)

When admin marks an event as **ordered** (florist confirmed):
1. The T-7 and T-3 pending notifications are cancelled
2. Delivery-day admin reminders are queued in their place (#12–13)

When a plan is **cancelled** by the customer:
1. All `pending` notifications for cancelled events are set to `status='cancelled'`
2. If any events were already ordered (florist contacted), admin is alerted immediately (#3)

When a **subscription is deleted** via Stripe webhook:
1. All `pending` notifications for that subscription's events are cancelled

When a **user account is deleted**:
1. All `pending` notifications for that user's events are cancelled

---

## Adding a New Notification

1. **Define the SMS copy** (if applicable) in `data_management/utils/sms_messages.py`
2. **Create an HTML template** in `data_management/templates/notifications/emails/` extending `notifications/emails/base.html`
3. **Create the notification record** using `Notification.objects.create()` or add a factory function in `notification_factory.py`
4. **For immediate sends**, call Mailgun/Twilio directly following the pattern in `send_admin_payment_notification.py`
5. **Test** with `python manage.py test_notification --channel email --subject "..." --body "..."`

---

## Known Gaps

- Forgot password emails (#4–6) are not yet implemented
- Partner SMS/email notifications are stubbed out with TODOs in `partners/management/commands/process_delivery_notifications.py`
- Recurring subscription renewals notify admin (#1) but do not send the customer an order confirmation (#2)
