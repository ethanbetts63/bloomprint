# Podcast Country Review Prompt

You are reviewing scraped podcast leads and deciding which ones are Australian.

Read:

```text
C:\Users\ethan\coding\bloomprint\marketing\podcasts.jsonl
```

Update:

```text
C:\Users\ethan\coding\bloomprint\marketing\country_review.json
```

---

## Task

For each entry in `podcasts.jsonl`, decide whether the podcast is:

- `aus`: the host or producer is based in Australia
- `not_aus`: the host or producer is based somewhere else
- `unsure`: you cannot confidently decide

The test is where the **people making the show** are based, not what the show
is about. A US-hosted travel show that covers Australia is `not_aus`. A
Melbourne-based show about American football is `aus`.

---

## How to decide

Start with the data already in the entry. Each one gives you `podcast_name`,
`host_name`, `website`, `latest_episode_title` and
`latest_episode_description`. Often that is enough on its own:

- A `.au` domain in `website` or `email` is a strong signal for `aus`
- A non-English-speaking country's domain (`.se`, `.de`, `.nl`) is a strong
  signal for `not_aus`
- Descriptions that name Australian places, teams, or institutions
  (Sydney, Melbourne, AFL, NRL, ABC, Centrelink) point to `aus`
- A well-known national broadcaster or network in the host name usually
  settles it either way

- Company registration details settle a lot of cases: "registered in England
  and Wales", an `LLC` or `Inc` suffix (US), or `Pty Ltd` and an ABN (Australia)
- A shop or checkout defaulting to a currency (£, US$, A$) points to the
  country the business operates from

Only search the web when the entry itself is inconclusive. Search the podcast
name plus a location word:

```text
"<podcast name>" podcast host
"<podcast name>" podcast where based
"<host name>" "<podcast name>" location
```

Use the podcast's own site, its Apple or Spotify listing, or the host's
public profiles. The site footer, About page, contact page, and privacy
policy are the usual places a location or registration detail appears.

Spend about three lookups on an entry. If it is still unclear after that,
stop and mark it `unsure` — that is a normal outcome, not a failure.

Do not guess. In particular, a search result for someone with the same name
as the host is not evidence unless it also ties back to this podcast. Common
names collide, and a confident-looking match on the wrong person is worse
than `unsure`.

---

## Output Format

`country_review.json` must stay valid JSON with this shape:

```json
{
  "aus": [
    {
      "feed_url": "https://example.com/feed-a.rss",
      "podcast_name": "Example Podcast A"
    }
  ],
  "not_aus": [
    {
      "feed_url": "https://example.com/feed-b.rss",
      "podcast_name": "Example Podcast B"
    }
  ],
  "unsure": []
}
```

Rules:

- Use `feed_url` exactly as it appears in `podcasts.jsonl`. It is the key that
  matches decisions back to entries.
- `podcast_name` is there so the file is readable. It is not used for matching.
- Put each podcast in exactly one of the three lists.
- This file is a **cumulative ledger**. It keeps every decision ever made, so
  most entries in it will not be in `podcasts.jsonl` — those have already been
  applied and cleared from the queue. That is expected. Never remove them.
- Preserve existing decisions unless you have a clear reason to correct one.
- Only add podcasts that are currently in `podcasts.jsonl`.

---

## To finish

When you are done run:

```powershell
python manage.py apply_country_review
```

This drops the `not_aus` and `unsure` entries from `podcasts.jsonl`, leaving
only Australian podcasts in the queue.

Both buckets are treated the same way at this step, so mark `unsure` honestly
rather than defensively — an `unsure` podcast will not be emailed. Its decision
and `feed_url` stay in this file permanently, so it can be recovered later by
re-fetching that feed, but it will not re-enter the pipeline on its own.

Once that has run, move on to `ai_instructions.md` to write the subject lines
and intros for the remaining entries.
