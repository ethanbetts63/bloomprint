# Marketing

Podcast outreach tool. Scrapes iTunes for podcast leads, stores them in a JSONL file, and sends personalised cold emails from the dev Gmail account.

## Flow

To run the whole thing, hand Claude `marketing/spinup_instructions.md` and it will coordinate every phase below, stopping for confirmation before anything is sent. The individual steps are:

1. **Scrape** — run the scrape command to populate `podcasts.jsonl` with qualifying podcast leads
2. **Country review** — bring `podcasts.jsonl` to Claude with `country_instructions.md`. Claude sorts each podcast into `aus` / `not_aus` / `unsure` in `country_review.json`, then `apply_country_review` drops everything that isn't Australian
3. **Fill in the blanks** — open `podcasts.jsonl` and bring a batch to Claude. Claude writes the `subject` and `custom_intro` for each entry based on the podcast and latest episode
4. **Promote** — run `promote_outreach` to move filled entries from `podcasts.jsonl` into `outbox/` as individual JSON files
5. **Upload** — run `upload` from your local machine to push `outbox/` files to the live server's `inbox/`
6. **Send** — run `send_outreach` on the server to fire off emails from `inbox/`. Sent entries are moved to `contacted_podcasts.jsonl` automatically

## Commands

```bash
# Scrape the next N qualifying podcasts into podcasts.jsonl
python manage.py scrape_pods --batch 10

# Drop non-Australian entries using Claude's country_review.json decisions
python manage.py apply_country_review

# Promote enriched entries from podcasts.jsonl into outbox/
python manage.py promote_outreach

# Upload outbox/ to the live server inbox/ (run locally)
python manage.py upload

# Upload to local dev server instead
python manage.py upload --dev

# Send a one-off test email
python manage.py send_email --to you@example.com --subject "Test" --body "Hello."

# Send outreach emails from inbox/ (run on server)
python manage.py send_outreach --count 5
```

## Key Files

- `marketing/podcasts.jsonl` — leads to be contacted (gitignored)
- `marketing/contacted_podcasts.jsonl` — sent entries, moved here after successful send (gitignored)
- `marketing/outbox/` — enriched entries ready to upload, one JSON file per recipient (gitignored)
- `marketing/inbox/` — entries received from upload, waiting to be sent (gitignored)
- `marketing/email.txt` — the outreach email template. The `__________________________________________` placeholder is replaced with each entry's `custom_intro`
- `marketing/spinup_instructions.md` — orchestration prompt. Drop this on Claude to run the whole pipeline end to end
- `marketing/country_instructions.md` — Claude's instructions for the country review step
- `marketing/country_review.json` — country decisions, three lists keyed by `feed_url` (gitignored)
- `marketing/searched_terms.py` — iTunes search terms already queried (aa → zz), prevents re-searching
- `marketing/searched_feeds.py` — RSS feed URLs already attempted, prevents duplicate fetches across terms
- `marketing/utils/scraper.py` — scraping logic
- `marketing/utils/emailer.py` — Gmail SMTP sender

## Upload Endpoint

`POST /api/marketing/upload/` — receives a single podcast JSON entry and writes it to `inbox/`. Requires the `X-Internal-API-Key` header matching `INTERNAL_API_KEY` in settings.

## Environment Variables

| Variable | Where needed | Purpose |
|---|---|---|
| `INTERNAL_API_KEY` | Local + server | Shared secret for the upload endpoint |
| `MARKETING_SERVER_URL` | Local only | Upload destination (defaults to `https://www.bloomprint.app`) |

## JSONL Entry Format

| Field | Description |
|-------|-------------|
| `subject` | Email subject line — filled in by Claude |
| `custom_intro` | Personalised opening line referencing a specific episode — filled in by Claude |
| `email` | Contact email pulled from the podcast RSS feed |
| `podcast_name` | Podcast title |
| `host_name` | Host name from RSS |
| `website` | Podcast website |
| `episode_count` | Total episodes published |
| `latest_episode_title` | Title of the most recent episode |
| `latest_episode_description` | Description of the most recent episode |
| `feed_url` | RSS feed URL |
| `apple_url` | Apple Podcasts URL |
| `genre` | Primary genre from iTunes |
| `last_release_date` | Date of most recent episode |

## Scrape Filters

Podcasts are only kept if they pass all of the following:
- No more than 100 episodes published (targeting smaller shows)
- Released an episode within the last 30 days
- Language is English
- RSS feed contains: email, host name, website, latest episode title and description
- The contact email's domain resolves in DNS — stale feeds often advertise dead domains, and a hard bounce risks getting the sending Gmail account throttled

Search queries hit the iTunes **AU** store (`country=AU`), but that only reflects
which catalog is queried — it does not mean the podcast is Australian. Roughly
four in five results are foreign shows that happen to be listed in Australia.
The country review step is what actually enforces the Australian filter.
