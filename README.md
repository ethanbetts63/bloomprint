# Bloom Print

**Live Site:** [https://www.bloomprint.app/]

## Tech Stack

*   **Backend:** Django, Django Rest Framework
*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
*   **Database:** MySQL
*   **Payments:** Stripe
*   **Email:** Mailgun
*   **Messaging:** Twilio
*   **Testing:** Pytest

## Core Backend Concepts

The Django project is organized into several applications:

*   `users`: Manages the custom user model, authentication, and user profile data..
*   `events`: Handles the creation, management, and scheduling of events and handles contracts. 
*   `payments`: Integrates with Stripe to process payments for different service tiers.
*   `data_management`: Manages static and semi-static content like FAQs and Terms & Conditions.

## Getting Started

Follow these instructions to set up a local development environment.

### Prerequisites

*   Python 3.9+
*   Node.js 20.x+
*   MySQL server

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <https://github.com/ethanbetts63/bloomprint>
    cd bloomprint
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/Scripts/activate  # On Windows
    # source venv/bin/activate    # On macOS/Linux
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the project root directory. This file stores sensitive configuration.
    ```env
    # Django Settings
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    HASHING_SALT=your_hashing_salt

    # Database Settings
    DB_NAME=bloomprint_db
    DB_USER=root
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=3306

    # API/Service Keys
    STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    STRIPE_SECRET_KEY=your_stripe_secret_key
    MAILGUN_API_KEY=your_mailgun_api_key
    MAILGUN_DOMAIN=your_mailgun_domain

    # The public base URL of the site, used for creating absolute URLs
    # (password reset links, Stripe Connect return URLs, unsubscribe links)
    SITE_URL=http://127.0.0.1:8000
    ```

5.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Create a superuser (optional):**
    This allows you to access the Django admin interface.
    ```bash
    python manage.py createsuperuser
    ```

7.  **Run the backend development server:**
    ```bash
    python manage.py runserver
    ```
    The backend will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Set up frontend environment variables:**
    Create a `.env` file in the `frontend` directory.
    ```env
    # Where the Next server and the /api rewrite reach Django.
    # Defaults to http://127.0.0.1:8000 if unset.
    DJANGO_API_URL=http://127.0.0.1:8000

    # Stripe publishable key. This must match the mode of the backend's
    # STRIPE_SECRET_KEY — a live key here against a test-mode secret on the
    # backend leaves the payment form permanently blank.
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    ```
    `NEXT_PUBLIC_*` values are inlined at build time rather than read at
    runtime, so in production they must be set in the hosting environment that
    runs `next build` (Vercel's project settings). This file is gitignored and
    never reaches a deploy.

4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000`. Next.js rewrites
    `/api/*` requests to `DJANGO_API_URL` (see `next.config.ts`).

## Running Tests

To run the backend test suite, execute the following command from the project root:

```bash
pytest
```
The tests are configured via the `pytest.ini` file.

## Development Utilities

### Database Reset (Windows PowerShell)

The project includes a PowerShell script `reset_django.ps1` to completely reset the local development environment. This is useful if your local database schema is out of sync or you want to start from a clean slate.

**Warning:** This is a destructive operation. It will delete all data in your local database.

To run the script:

```powershell
.\reset_django.ps1
```

The script performs the following actions:
1.  Prompts you to manually drop and recreate the MySQL database.
2.  Deletes all `__pycache__` directories and old migration files.
3.  Creates new database migrations.
4.  Applies the migrations.
5.  Runs several custom management commands to populate the database with initial data.

### Custom Management Commands

The project includes several custom Django management commands to help with development:
*   `python manage.py generate --terms`: Populates the database with the latest terms and conditions.
*   `python manage.py fix_site_domains`: Corrects the domain name in the Django Sites framework, which is useful for local development.

You can run these commands individually after setting up the project.

## License

This project is licensed under the **Functional Source License 1.1 (FSL-1.1-MIT)**.

### What this means:
* **Personal & Internal Use:** You are free to use, modify, and distribute this code for personal projects, internal business tools, and educational purposes.
* **Non-Compete:** You **cannot** use this code to create a commercial product or service that competes with **Bloom Print**.
* **Future Open Source:** This specific version of the code will automatically become fully open-source under the **MIT License** on **December 23, 2027**.

For the full legal terms, please see the [LICENSE.md](./LICENSE.md) file.