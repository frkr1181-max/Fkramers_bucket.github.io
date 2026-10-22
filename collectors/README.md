# RoamReady source collectors

The collector creates local **review candidates**; the separate importer can copy those candidates into Supabase. Neither step creates approved facts, calls the RoamReady API, or publishes guidance. A teammate must confirm the claim, traveler jurisdiction, source date, and wording before it can be added to the product.

## First collector: GOV.UK Japan advice

The GOV.UK Content API is the first automated source because GOV.UK publishes structured JSON for reuse under the Open Government Licence. This collector reads `robots.txt` before fetching, uses a descriptive User-Agent, caps response size, and waits between requests. It records the FCDO source's UK jurisdiction so its guidance is not presented as US advice.

Run from the repository root with Python 3.10 or newer:

```bash
python -m collectors.govuk_fcdo
```

The output is `data/candidates/govuk-fcdo-japan.json`. It includes cleaned source text, source and update metadata, an OGL attribution, collection time, and a SHA-256 digest of the fetched response. Do not remove the jurisdiction or review status when importing selected claims.

After setting `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` in your local environment, import the file:

```bash
python -m collectors.import_candidates data/candidates/govuk-fcdo-japan.json
```

The importer writes only to `source_candidates`, uses the candidate ID to avoid duplicates, and leaves existing rows unchanged. Review candidates in the Supabase Table Editor. To publish guidance, rewrite and verify it, then add it as a separate row in `travel_facts` with source citations and `published = true`.

## Source intake rules

Before enabling another source, record its owner, canonical URL/API, jurisdiction, reuse terms, robots policy, update frequency, and contact or attribution requirement. Prefer a documented API or downloadable dataset. Keep sources that prohibit automated access or reuse in a link-only/manual research list. Never work around bot blocks, logins, CAPTCHAs, or rate limits.

The current workbook's CDC source is marked as blocking bots, so it is not automated. JNTO's terms restrict copying/storing its materials, so use it as a link for manual research unless the project obtains permission. State Department collection is not enabled until its policy is confirmed. These sources can still be cited by a human researcher after review.

## Candidate to product flow

1. Run an enabled collector and review each candidate against the source page.
2. Rewrite the material in RoamReady's own traveler-facing language; keep short excerpts only when needed and allowed.
3. Confirm it applies to the selected traveler profile and destination.
4. Record the reviewer and verification date, then add the approved fact through the planned backend workflow.

No candidate output is committed by default; `data/candidates/` is ignored by Git.
