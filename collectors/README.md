# RoamReady source collectors

The collector creates local **review candidates**; the separate importer can copy those candidates into Supabase. Neither step creates approved facts, calls the RoamReady API, or publishes guidance. A teammate must confirm the claim, traveler jurisdiction, source date, and wording before it can be added to the product.

## Automated update monitoring

The currently approved automated sources are the GOV.UK FCDO Content API pages for Japan, Paraguay, Qatar, Saudi Arabia, and South Africa. All five appear in the research bank and publish structured JSON under the Open Government Licence. Their source definitions live in [`monitored_sources.json`](monitored_sources.json).

The adapter checks the site's live `robots.txt` policy before every fetch, uses a descriptive User-Agent, limits responses to 5 MB, times out slow requests, and waits between requests. It normalizes each section and fingerprints its title and text. The fingerprint becomes part of the candidate ID: repeated runs deduplicate unchanged versions, and a changed section creates a new candidate in Supabase. Candidates are never published automatically. The FCDO content is UK government advice and retains that jurisdiction in every record.

Run from the repository root with Python 3.10 or newer:

```bash
python -m collectors.govuk_fcdo --source-id govuk-fcdo-japan
```

Use the other configured IDs (`govuk-fcdo-paraguay`, `govuk-fcdo-qatar`, `govuk-fcdo-saudi-arabia`, and `govuk-fcdo-south-africa`) to collect those pages. Each output includes cleaned source text, source and update metadata, an OGL attribution, collection time, and a SHA-256 digest. Do not remove the jurisdiction or review status when importing selected claims.

After setting `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` in your local environment, import the file:

```bash
python -m collectors.import_candidates data/candidates/govuk-fcdo-japan.json
```

The importer writes only to `source_candidates`, uses the content-version candidate ID to avoid duplicates, and leaves existing rows unchanged. Review candidates in the Supabase Table Editor. To publish guidance, rewrite and verify it, then add it as a separate row in `travel_facts` with source citations and `published = true`.

## Daily schedule

GitHub Actions runs the five monitored pages daily at 09:17 UTC and also supports a manual run from the Actions tab. The matrix runs one request at a time so the collector does not hit GOV.UK pages concurrently. To enable it, add these repository Actions secrets in GitHub Settings → Secrets and variables → Actions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never use the publishable key here)

Schedule events can be delayed by GitHub Actions, so this is daily polling rather than an instant notification. A newly imported version appears in the Supabase review queue; a teammate still has to verify and publish it.

## Source intake rules

Before enabling another source, record its owner, canonical URL/API, jurisdiction, reuse terms, robots policy, update frequency, and contact or attribution requirement. Prefer a documented API or downloadable dataset. Keep sources that prohibit automated access or reuse in a link-only/manual research list. Never work around bot blocks, logins, CAPTCHAs, or rate limits.

The four CSVs contain 491 URLs across 258 domains. This first monitor only automates the five GOV.UK API sources whose reuse terms and robots policy are clear. The workbook's CDC source is marked as blocking bots, so it is not automated. JNTO's terms restrict copying/storing its materials, so use it as a link for manual research unless the project obtains permission. State Department and the remaining websites stay manual until their current access rules, terms, and source formats have been reviewed. Never work around bot blocks, logins, CAPTCHAs, or rate limits.

## Candidate to product flow

1. Run an enabled collector and review each candidate against the source page.
2. Rewrite the material in RoamReady's own traveler-facing language; keep short excerpts only when needed and allowed.
3. Confirm it applies to the selected traveler profile and destination.
4. Record the reviewer and verification date, then add the approved fact through the planned backend workflow.

No candidate output is committed by default; `data/candidates/` is ignored by Git.
