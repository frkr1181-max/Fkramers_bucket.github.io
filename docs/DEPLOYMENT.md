# Render deployment

The active frontend is David's `site/`, imported from `hifi-site` commit `c2be951551535550401c585afd084f4e0ad69c6a`. Earlier prototypes are preserved under `.archive/` and are not served by FastAPI.

`render.yaml` prepares one Python web service. FastAPI serves `site/` at `/`, with API routes under `/api` and docs at `/docs`. This keeps the browser and API on the same origin; GitHub Pages is optional.

## Create the service

1. Push the reviewed changes to your chosen GitHub branch.
2. In Render, create a Blueprint from that repository and branch, using `render.yaml`.
3. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the existing project. Do not supply the service-role key: this web service does not need it.
4. Deploy. Confirm `/api/health`, `/api/destinations`, and a Japan guide request return successfully, then open the root page.
5. In Supabase Auth URL configuration, set Site URL to the Render URL and allow the root URL as an email-confirmation redirect. Include the local root URLs while developing. Keep email confirmation enabled; do not change project policies to make a test pass.
6. Test sign-up and the confirmation email with your own email; then log in, plan Japan, save, refresh, log out and back in, and reopen it from Saved trips. Use a second account to check that the first account's trip URL cannot be opened.

Auto-deploy is disabled in the Blueprint. The free plan can sleep; the site shows loading, and guide data has a labeled saved-copy fallback with Retry live guide. Account operations never use the snapshot and never claim a save until the API confirms it.

## Optional GitHub Pages frontend

GitHub Pages uses GitHub Actions as its source. `.github/workflows/deploy-pages.yml` publishes only `site/` after main-branch frontend changes; it also supports manual runs. The public URL is https://frkr1181-max.github.io/Fkramers_bucket.github.io/. The site includes the saved research. On GitHub Pages, guides explicitly use this labeled saved copy while `apiBase` is empty, because Pages cannot host the API. Set `apiBase` to Render to restore live API requests. Sign-in and saved-trip operations require that backend. Set `DEPLOYMENT.apiBase` in `site/js/config.js` to the exact HTTPS Render URL before publication. Add the GitHub Pages origin (scheme and hostname, without a path) to Render's `FRONTEND_ORIGINS`. Add the complete Pages base URL to Supabase's allowed email redirects. Run the same checks on Pages and on a narrow mobile viewport.

## Local preview

Install `requirements-dev.txt` in a Python 3.12 environment, then run `uvicorn app.main:app --host 127.0.0.1 --port 8000`. Open http://127.0.0.1:8000/ . A separate frontend server may use port 5500, which is already allowed by CORS.

Sign-in uses the official pinned Supabase Auth client, stored locally under `site/js/vendor/` with a license and SHA-256 lock record. Sessions persist in this browser until sign-out. Trips and checklist progress are stored through the existing owner-scoped API. The optional description remains in memory and is explicitly labeled as not saved; it is not sent in the trip payload.
