# Users App

## Purpose

The `users` app handles user identity, authentication, and profile management.

## Model

### User (extends AbstractUser)
Custom user model with additional fields for:
- **Password reset throttling:** `password_reset_last_sent_at`
- **Legal compliance:** `agreed_to_terms` (FK to TermsAndConditions)
- **Stripe integration:** `stripe_customer_id`
- **Affiliate attribution:** `referred_by_affiliate` (FK to `BusinessAccount`)
- **Deletion tracking:** `deleted_at`

## Key Flows

### Registration
1. User submits email, password, first_name, and last_name to `POST /api/users/register/`
2. Account created with email as username
3. JWT tokens (access + refresh) returned immediately
4. No email verification currently required

### Password Reset
1. `POST /api/users/password-reset/request/` - Sends reset email via Mailgun (rate limited to 1 per 60 seconds per user)
2. Always returns 200 regardless of whether email exists (prevents user enumeration)
3. Checks BlockedEmail list before sending
4. `POST /api/users/password-reset/confirm/<uidb64>/<token>/` - Sets new password (token valid for 1 hour)

### Account Deletion
Only partners (florists/affiliates) have accounts to delete — customers check out as guests and have no login. `DeleteUserView` sets `is_active = False` and records a `deleted_at` timestamp. There is no PII anonymization step; a proper data-erasure workflow will be built once the business has real customer data subject to that obligation.

## API Endpoints

All under `/api/users/`:

- `POST /register/` - Create account (public)
- `GET/PATCH /me/` - View/update profile (authenticated)
- `DELETE /delete/` - Deactivate account (authenticated)
- `PUT /change-password/` - Change password (authenticated)
- `POST /password-reset/request/` - Request reset email (public)
- `POST /password-reset/confirm/<uidb64>/<token>/` - Confirm reset (public)

## Utilities

- `send_password_reset_email(user)` - Mailgun API email with signed unsubscribe link

## Templates

- `users/emails/password_reset_email.html` - HTML password reset email
- `users/emails/password_reset_email.txt` - Plain text fallback
