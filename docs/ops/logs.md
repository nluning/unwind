# Accessing logs

Reference for where Unwind's runtime logs and errors actually live, and how
to pull them when something's broken in production.

## Container logs (Pino, on the server)

The backend logs structured JSON via Pino (`LOG_LEVEL` env var, default
`info`). Nginx also logs access/error lines for both containers' proxy
traffic. Both live on the VPS, not anywhere centralized — SSH in to read them
(see `docs/ops/server-access.md` if `ssh unwind` isn't set up on your
machine).

```bash
ssh unwind
cd ~/unwind
docker compose -f docker-compose.production.yml logs backend --tail 200
docker compose -f docker-compose.production.yml logs backend -f          # follow live
docker compose -f docker-compose.production.yml logs backend --since 24h
docker compose -f docker-compose.production.yml logs db nginx           # other services
```

Useful filters while chasing a specific failure:

```bash
docker compose -f docker-compose.production.yml logs backend --since 24h \
  | grep -i -E 'anthropic|credit|balance|error'
```

Pino writes one JSON object per line — pipe through `jq` if you want it
readable:

```bash
docker compose -f docker-compose.production.yml logs backend --since 1h \
  | grep -o '{.*}' | jq .
```

## Sentry

Two separate Sentry projects, one per app half:

- **Backend** — initialized in `backend/src/instrument.ts`, guarded by
  `SENTRY_DSN`. Captures unhandled route errors (via
  `Sentry.setupFastifyErrorHandler`), explicit `Sentry.captureException`
  calls in `errorHandler.ts` (Anthropic 503/529, credit-balance 400s, and
  the generic 500 fallback), `chat.ts`'s SSE stream (which bypasses Fastify's
  normal error handling once `writeHead` has fired, so it captures
  manually), `generate.ts`'s parse-failure branches, and — as of the
  `onUncaughtExceptionIntegration`/`onUnhandledRejectionIntegration` config —
  any uncaught exception or unhandled promise rejection anywhere in the
  process.
- **Frontend** — initialized in `frontend/src/main.ts`, guarded by
  `VITE_SENTRY_DSN`, tunneled through nginx at `/sentry-tunnel` (dodges ad
  blockers that silently drop direct requests to `*.sentry.io`). Vue's
  global error handler is wired automatically since `Sentry.init` receives
  the `app` instance. The shared `api()` client (`frontend/src/api/client.ts`)
  captures every failed request except expected 401 (session expired) and
  429 (rate limited) states.

Check the dashboard at Sentry → the `unwind-backend` / `unwind-frontend`
projects. Filter/search by tag — e.g. `anthropic_error:credit_balance` or
`endpoint:/chat/stream` — to jump straight to a known failure class instead
of scrolling the unfiltered issue stream.

**Sentry only shows what's been deployed.** A capture-side fix committed
locally doesn't appear in Sentry until it's shipped through the normal
`development` → `main` pipeline (see `docs/ops/ci-cd.md`).

## What's *not* currently captured

- `backend/src/db/migrate.ts` reports failures to Sentry (added
  2026-07-16) but only if `SENTRY_DSN` is set in the migration container's
  env — confirm it's passed through if a migration failure isn't showing up.
- `backend/src/routes/health.ts`'s DB-unreachable branch logs via Pino only,
  not Sentry — deliberate, to avoid flooding Sentry with one event per
  Docker `HEALTHCHECK` poll during a real outage. If the DB actually goes
  down, that already surfaces through every other route's error path.
- `backend/src/routes/onboarding.ts` is dead code (unregistered in `app.ts`)
  and isn't held to the same standard.

## Anthropic-specific checks

If the failure looks AI-related (`"AI service is temporarily unavailable"`,
503/529, or a 400 mentioning credit balance), two additional places to check
beyond the app's own logs:

- **Anthropic Console** → Settings → Billing — shows current credit balance
  directly.
- A trivial direct API call reproduces whatever error the backend is
  hitting, without needing server access at all:

  ```bash
  curl https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d '{"model": "claude-haiku-4-5", "max_tokens": 1, "messages": [{"role": "user", "content": "hi"}]}'
  ```

  A credit-balance failure returns HTTP 400 with a body like
  `{"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low..."}}`.
  A rate-limit or overload issue returns 429/503/529 instead, with a
  different message.
