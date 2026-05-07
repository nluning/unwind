---
name: Unwind project status
description: Current build stage — Stage 6 (deployment) in progress. Phases 0-3, 5 complete; Phase 4 mostly done (steps 1-3 verified, step 4 frontend Sentry blocked on DSN mismatch). App live at https://unwind.nu.
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
- Phase 4 in progress (2026-05-07):
  - Step 1 done & deployed: `/health` endpoint moved to its own route file, runs `SELECT 1` against db, returns 503 if unreachable. Compose healthchecks: `pg_isready` for db, `node -e fetch(...)` for backend (alpine has no curl). Backend `depends_on: db: condition: service_healthy` so first boot waits for db readiness.
  - Step 2 done: Pino config now reads `LOG_LEVEL` from env (default `info`) and redacts `req.headers.cookie`, `req.headers.authorization`, `*.password` paths. Removed redundant `fastify.log.level = 'info'` from server.ts.
  - Step 3 done & verified: `@sentry/node` + `instrument.ts` (init guarded by `SENTRY_DSN`) + `Sentry.setupFastifyErrorHandler(fastify)` after the existing error handler. `SENTRY_DSN` added to `PRODUCTION_ONLY` env validation. Backend errors confirmed flowing into Sentry (test route was added then removed).
  - Step 4 (frontend Sentry) IN PROGRESS — code in place: `@sentry/vue` init in `main.ts` guarded by `VITE_SENTRY_DSN`, build arg wired through Dockerfile + compose. Deployed to server. Test errors are reaching Sentry's ingest endpoint (POST 200) but not appearing in the unwind-frontend project dashboard. **DSN is correct** — project ID in DSN (`4511348616396880`) matches unwind-frontend's project ID in Settings. So the DSN is *not* the problem. Open question for next session: why are 200-response events not landing in the project view? Things to check: dashboard time-range filter, full POST response body (not just status), Sentry stats per-project (was 0 accepted earlier — implies ingest is acknowledging but not attributing). Possible angles: EU-region routing oddity, project misconfig, or events being deduplicated/binned by Sentry.
  - Sentry org context: `script-fs` (EU region — `de.sentry.io` ingest), org id `4511348432830464`, project id `4511348616396880`, full DSN saved in server `.env` as `VITE_SENTRY_DSN`.
- Phase 0.4 (bug fixes) still deferred.
- Adjacent gap noted but not yet addressed: `/auth/login` has no IP-based rate limiting — fail2ban only watches SSH, so brute-force against the web login is currently unmitigated.
- Next: finish Phase 4 step 4 (frontend Sentry DSN fix); then Phase 6 (CI/CD) is the only remaining deployment phase.

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Haiku for Mode 4 chat (acceptable Dutch quality in short guided format); Sonnet for onboarding (reverted from Haiku on 2026-04-23 — Haiku's Dutch output was stilted for the generated activity list). See ADR-006 addendum.
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)
