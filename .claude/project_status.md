---
name: Unwind project status
description: Current build stage — Stage 6 (deployment) in progress. Phases 0-5 complete (Phase 4 monitoring done with Sentry tunnel mitigating ad-blockers). Phase 6 (CI/CD) is the only remaining deployment phase. App live at https://unwind.nu.
type: project
---

Unwind is an activity suggestion app for neurodivergent brains that struggle to switch off. Four modes: random suggest, stress-filtered, counterbalance, AI chat.

**Stages 0-3** — Complete. Auth, database, three mode pages, UnoCSS migration, themes, loading/error states. 52 tests green.

**Stage 5** — Complete (2026-04-16). All 12 chunks done:
- Mode 4 chat with SSE streaming, system prompt with per-request user context
- Memory system: `user_memories` table, CRUD + batch endpoints, consent gate
- `buildSystemPrompt.ts` injects memories + activity patterns into every chat
- Onboarding: tappable form → Claude generates activities + memories in one call
- Rate limiting: 70 chat requests/day, 3 onboarding attempts total
- Tests for memory CRUD, rate limiting, onboarding response parsing
- First user review panel run (7 personas, report at docs/review/reports/)

**Stage 6 — Deployment (in progress, 2026-05-01):**
- Phase 0 done: env var startup validation, `DELETE /me` endpoint, privacy page, delete-account in menu. One leftover: `?? ''` fallback in chat.ts:97 still there (non-blocking; validateEnv already crashes prod if FRONTEND_URL is missing).
- Phase 1 done: backend + frontend Dockerfiles (multi-stage), nginx.conf (API proxy + SSE), docker-compose.production.yml, tested locally and working.
- Phase 2 done (2026-05-01): Hetzner VPS, SSH hardened (no root login, no password auth, drop-in at `/etc/ssh/sshd_config.d/99-hardening.conf`). Docker installed via official apt repo. Repo cloned via deploy key. Production secrets in a gitignored `.env`. App is up via `docker compose -f docker-compose.production.yml`. Domain `unwind.nu` (TransIP) has A + AAAA records. Build hit one tsc error in config.ts (`as const` array narrowing on `required.push(...PRODUCTION_ONLY)`) — fixed and pushed.
- Phase 3 done (2026-05-07): nginx serves HTTPS via Let's Encrypt certs, ACME challenge plumbed through `/.well-known/acme-challenge/`, `trustProxy: true` set in Fastify so cookies + rate limiting + req.ip work behind nginx. App live at https://unwind.nu.
- Phase 5 done (2026-05-07, ahead of plan order): ufw active (22/80/443 only, default deny, v4+v6); unattended-upgrades installed AND enabled (both `20auto-upgrades` flags = "1"); fail2ban installed with default sshd jail using systemd backend (caught a botnet on first day — 1 IP banned within minutes); Docker security: backend `USER node` in Dockerfile, DB + backend ports not exposed to host (only frontend nginx publishes 80/443), frontend uses official `nginx:alpine` (master root by image design, workers non-root — accepted trade-off for static-file serving at this scope).
- Multi-machine SSH access set up — separate keypairs per laptop; both lines live in `~/.ssh/authorized_keys`. Username + hostname are not stored here on purpose; `ls /home` from the Hetzner console recovers them. Runbook: `docs/ops/server-access.md`.
- Phase 4 done (2026-05-08):
  - Step 1 (`/health` + Docker healthchecks): endpoint runs `SELECT 1` against db, returns 503 if unreachable. Compose healthchecks use `pg_isready` for db, `node -e fetch(...)` for backend (alpine has no curl). Backend `depends_on: db: condition: service_healthy` so first boot waits for db readiness.
  - Step 2 (Pino prod config): reads `LOG_LEVEL` from env (default `info`), redacts `req.headers.cookie`, `req.headers.authorization`, `*.password`. Removed redundant `fastify.log.level = 'info'` from server.ts.
  - Step 3 (Sentry backend): `@sentry/node` + `instrument.ts` (init guarded by `SENTRY_DSN`) + `Sentry.setupFastifyErrorHandler(fastify)` after the existing error handler. `SENTRY_DSN` added to `PRODUCTION_ONLY` env validation. Verified — errors flow into Sentry.
  - Step 4 (Sentry frontend): `@sentry/vue` init in `main.ts` guarded by `VITE_SENTRY_DSN`, build arg wired through Dockerfile + compose. Verified working from Chrome incognito on 2026-05-08.
  - **Debugging artifact worth remembering**: the original "POST 200 but 0 events in dashboard" was *not* a DSN, region, or project-config issue — it was browser ad blockers (uBlock, Brave shields, Firefox ETP) intercepting requests to `*.sentry.io` and returning fake `{}` 200 responses. Sentry's stats showed 0 across every bucket (accepted/filtered/rate-limited/invalid), which is the diagnostic signature: if Sentry had received the events, *something* would be non-zero. Mitigated with a Sentry tunnel — `tunnel: '/sentry-tunnel'` in `Sentry.init`, plus `location = /sentry-tunnel` in `frontend/nginx.conf` proxying to `o4511348432830464.ingest.de.sentry.io` with SNI + hardcoded Host header. Outbound to Sentry happens server-side now, invisible to browser blockers.
  - Testing gotcha: `throw new Error()` typed in DevTools console doesn't fire `window.onerror` (Chrome suppresses console-thrown errors). Use `setTimeout(() => { throw new Error('test') }, 0)` to verify Sentry capture.
  - Sentry org context: `script-fs` (EU region — `de.sentry.io` ingest), org id `4511348432830464`, project id `4511348616396880`. Full DSN in server `.env` as `VITE_SENTRY_DSN`. The org + project IDs are now hardcoded in `frontend/nginx.conf` for the tunnel — if rotated, that file needs updating too.
- Phase 0.4 (bug fixes) still deferred.
- Adjacent gap: `/auth/login` has no IP-based rate limiting — fail2ban only watches SSH, so brute-force against the web login is currently unmitigated.
- Next: Phase 6 (CI/CD) is the only remaining deployment phase.

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Haiku for Mode 4 chat (acceptable Dutch quality in short guided format); Sonnet for onboarding (reverted from Haiku on 2026-04-23 — Haiku's Dutch output was stilted for the generated activity list). See ADR-006 addendum.
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)
