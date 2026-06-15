---
name: Unwind project status
description: Stage 6 (deployment) complete. App live at https://unwind.nu with full CI/CD via GitHub Actions: push to main triggers tests, builds images to GHCR, SSHes to Hetzner VPS, runs migrations, recreates containers. Phase 0.4 bug fixes deferred.
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
- Login rate limiting (closed 2026-05-08): nginx `limit_req_zone` keyed on `$binary_remote_addr`, applied at exact-match `location = /api/auth/login` with `rate=5r/m burst=10 nodelay`, returning 429. Caps brute-force at 7200/day per IP. Other auth endpoints (`/auth/register`, password reset if added later) are not rate-limited at the proxy layer yet.
- Phase 6 done (2026-05-08): full CI/CD via GitHub Actions.
  - Branching: `development` (long-lived integration) → PR → `main` (protected, deploys). Branch protection on main requires PR + linear history + passing CI checks (`backend`, `frontend`, `secret-scan`). Free-tier rulesets only enforce on **public** repos — repo went public 2026-05-08 after a clean history audit (no committed secrets; `.env.example` was the only `.env*` ever tracked).
  - `ci.yml`: backend (tsc + vitest against postgres:17 service container), frontend (lint:check + vue-tsc + vitest + vite build), gitleaks. Triggers on push to main/development and PRs.
  - `deploy.yml`: builds backend + frontend images, tags `:sha-<commit>` + `:latest`, pushes to **public** GHCR packages (`ghcr.io/nluning/unwind-{backend,frontend}`). Deploy job is gated `if: github.ref == 'refs/heads/main'`. Runs on a fresh runner: provisions deploy SSH key (`SSH_PRIVATE_KEY`) and `SSH_KNOWN_HOSTS` from secrets, SSHes to server, `git pull`s the new compose file, `docker compose pull` images, runs migrations as a one-shot container (`docker compose run --rm backend node dist/db/migrate.js`), then `docker compose up -d --remove-orphans`.
  - Compose file moved from `build:` → `image: ghcr.io/nluning/...:${IMAGE_TAG:-latest}`. Server stops being a build environment. Rollback = SSH in, `IMAGE_TAG=sha-<previous>` for `pull` + `up -d`.
  - Secrets in GitHub repo: `SSH_PRIVATE_KEY` (deploy keypair, passphrase-less ed25519, separate from laptop keys), `SSH_HOST=unwind.nu`, `SSH_USER`, `SSH_KNOWN_HOSTS` (collected via `ssh-keyscan -t ed25519,rsa,ecdsa unwind.nu`), `VITE_SENTRY_DSN`. The deploy keypair's public key is in server `~/.ssh/authorized_keys` with the comment `github-actions-deploy`.
  - `frontend/package.json`: added `lint:check` script (oxlint + eslint, no `--fix`) for CI use.
  - `.vscode/settings.json` committed: format-on-save with Prettier, fix-on-save with ESLint + oxlint, scoped to frontend/. VSCodium uses Open VSX — all required extensions are available there.
  - **Debugging artifact worth remembering**: first deploy hit `denied` on `docker compose pull`. Cause was a stale `noor-169` namespace hardcoded in compose + docs from before Noor's GitHub handle change to `nluning`. Build workflow used dynamic `${{ github.repository_owner }}` (correct, `nluning`), so images existed at the new namespace; compose file looked at the old one. GHCR's failure mode for an unknown namespace is `denied`, not `not found`. Fix: replaced `noor-169` → `nluning` everywhere. Also masking quirk in the log: `***-169` is GHA pattern-masking a secret value (`SSH_USER=noor`) wherever the substring appears.
- Phase 0.4 (bug fixes) still deferred.
- Next: Stage 6 deployment is complete. Open follow-up: GHCR retention policy for old SHA tags (no automation yet).

**Error logging hardening (2026-06-15):**
- Chat (Mode 4: `/chat` + `/chat/stream`) and onboarding (`/onboarding/generate`)
  are now **dead code** — both files marked `// DEAD CODE` at the top. Device-first
  auth dropped onboarding (ADR-012 / plan 17); chat retired. Left in tree with
  explanatory comments rather than deleted.
- Phase A — live AI parse failures now reach Sentry. `Sentry.captureMessage` added
  at the two `generate.ts` parse-failure branches (suggest-from-list /
  suggest-from-answers). Those return `null` (no throw), so they were a Sentry
  blind spot — `setupFastifyErrorHandler` never sees a non-thrown failure. Stable
  message strings (clean issue grouping), `endpoint` tag, raw output (≤500 chars)
  in `extra`. The dead chat/onboarding parse branches were left as comments
  documenting the same blind-spot pattern instead of being instrumented.
- Phase B — release tracking + frontend source maps:
  - `release` = git SHA on both sides. Backend reads `SENTRY_RELEASE` (Dockerfile
    ARG/ENV ← `deploy.yml` build-arg `github.sha`); frontend reads
    `VITE_SENTRY_RELEASE` the same way. Lets Sentry attribute issues to a deploy.
  - Backend user attribution: `Sentry.setUser({ id })` in `requireAuth` middleware
    (id only — no email/PII; request-scoped via Sentry's per-request isolation).
  - Explicit `sendDefaultPii: false` on both `Sentry.init` calls.
  - Frontend source maps: `@sentry/vite-plugin` in `vite.config.ts`, **gated on
    `SENTRY_AUTH_TOKEN`** so local/token-less builds skip upload entirely.
    `build.sourcemap: true`; maps deleted after upload (not served by nginx).
    Token passed as a **BuildKit secret mount** (`RUN --mount=type=secret`), not a
    build-arg, so it never lands in an image layer or the GHA build cache — matters
    because the repo + GHCR images are public. New GitHub secret `SENTRY_AUTH_TOKEN`
    is an **org auth token** (org `script-fs`, project `unwind-frontend`); org +
    project slugs are hardcoded in `vite.config.ts` (non-secret).
  - Skipped by design: a `beforeSend` scrubber (chat/onboarding going dead removed
    the sensitive-content surface) and a 4xx noise filter (Sentry's Fastify
    integration defaults to capturing 5xx only).
  - Backend source maps (project `node`) intentionally NOT done — compiled-TS stack
    traces are readable enough at ~100 users.
- Verify after the next `main` deploy: Sentry **Releases** shows the SHA with
  artifacts attached, and a frontend error resolves to `.vue`/`.ts` frames rather
  than minified bundle positions. Minified frames almost always = release mismatch.

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Haiku for Mode 4 chat (acceptable Dutch quality in short guided format); Sonnet for onboarding (reverted from Haiku on 2026-04-23 — Haiku's Dutch output was stilted for the generated activity list). See ADR-006 addendum.
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)
