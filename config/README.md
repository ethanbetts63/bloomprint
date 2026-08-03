# Bloom Print - Django Project Configuration

## Purpose

This is the Django project configuration package. It contains settings, root URL routing, WSGI/ASGI entry points, and sitemap configuration.

## Files

### settings.py
Central configuration for the Django project.

**Key configuration areas:**
- **Database:** MySQL via `mysqlclient`, credentials from environment variables
- **Authentication:** JWT via `djangorestframework-simplejwt` + session auth for admin
- **REST Framework:** Default authenticated permissions, rate limiting (200/day anon, 500/day user)
- **Caching:** File-based cache in `django_cache/`
- **Static files:** Serves built React frontend from `frontend/dist/`
- **External services:** Stripe, Mailgun, Twilio (all configured via env vars)

**Business rule settings:**
- `MIN_DAYS_BEFORE_CREATE = 3` - Lead time for new orders
- `MIN_DAYS_BEFORE_EDIT = 7` - Lead time for modifying active orders
- `SUBSCRIPTION_CHARGE_LEAD_DAYS = 6` - Days before delivery to charge subscription

### urls.py
Root URL routing:
- `/admin/` - Django admin panel
- `/api/users/` - User management (users app)
- `/api/payments/` - Payment processing (payments app)
- `/api/data/` - Content management (data_management app)
- `/api/events/` - Orders and deliveries (events app)
- `/api/token/` + `/api/token/refresh/` - JWT authentication
- `/sitemap.xml` - SEO sitemap
- `*` (catch-all) - React SPA (serves `index.html`)

### sitemaps.py
Generates XML sitemap for SEO with static page URLs.

### wsgi.py / asgi.py
Standard Django entry points for WSGI (production) and ASGI servers.

## Installed Apps

1. `users` - User management and authentication
2. `events` - Orders, deliveries, preferences, pricing
3. `payments` - Stripe payment processing
4. `data_management` - Content, blocklists, T&C, data utilities
5. `partners` - Partner lifecycle, dashboards, and delivery requests

## Required Environment Variables

See `.env.example` for the full list. Critical variables:
- `SECRET_KEY` - Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`
- `SITE_URL`, `HASHING_SALT`, `ADMIN_EMAIL`, `ADMIN_NUMBER`
