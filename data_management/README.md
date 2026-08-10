# Data Management App

## Purpose

The `data_management` app handles email blocklisting, Terms and Conditions versioning, database backup/restoration, and data generation utilities.

## Models

### BlockedEmail
Stores email addresses that have opted out of communications. Used by the password reset and notification systems to suppress emails.

**Fields:** `email` (unique, indexed), `created_at`

### TermsAndConditions
Versioned legal documents. Users link to a specific version via `agreed_to_terms` FK on the User model.

**Fields:** `version` (unique), `content` (HTML), `published_at`

## API Endpoints

All under `/api/data/`:

- `GET /blocklist/block/<signed_email>/` - Unsubscribe link handler. Verifies Django-signed email, creates BlockedEmail record, redirects to success page. (Public)
- `GET /blocklist-success/` - Placeholder success endpoint. (Public)
- `GET /terms/latest/` - Returns most recent Terms and Conditions. Cached for 24 hours. (Public)

## Management Commands

### `python manage.py generate`
Data generation orchestrator with flags:
- `--terms` - Generates TermsAndConditions from HTML files in `data/` matching `terms_v*.html`
- `--flowers` - Populates FlowerType model from `data/flowers.json`
- `--archive` - Archives current database to JSON files

### `python manage.py update`
- `--archive` - Restores database from latest backup (destructive, requires confirmation)

### `python manage.py resize_images <path>`
Batch resizes images to responsive widths (default: 320, 640, 768, 1024, 1280). Outputs WebP format at quality 75.

### `python manage.py fix_site_domains`
Updates Django Sites framework domain from `example.com` to `www.bloomprint.com.au`.

### `python manage.py send_test_email`
Tests email sending. Supports `--template_name`, `--context` (JSON), and `--reminder_test` flags.

### `python manage.py test_mailgun`
Direct Mailgun API connectivity test.

## Utilities

### Database Archiving (`utils/archive_db/`)
- `DatabaseArchiver` - Exports all models to individual JSON files via `manage.py dumpdata`
- `load_db_from_latest_archive()` - Flushes DB and restores from most recent backup in dependency order
- `ModelLister` - Discovers all installed models with optional app exclusions

### Data Generation (`utils/generation_utils/`)
- `TermsUpdateOrchestrator` - Parses HTML files for T&C versions
- `ColorGenerator` - Loads colors from JSON
- `FlowerGenerator` - Loads flower types from JSON

## Data Files

- `data/colors.json` - Color reference data (name + hex)
- `data/flowers.json` - Flower type names
- `data/terms_v*.html` - Terms and Conditions HTML content
- `data/archive/db_backups/` - Database backup storage (per-date directories)
