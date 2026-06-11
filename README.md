# Unwind

Activity suggestion app for brains that struggle to switch off.
Suggests relaxation activities tailored to the user through four modes:
random suggestion, stress-filtered, counterbalance-based, and AI-guided
conversation.

**Live demo:** [unwind.nu](https://unwind.nu) — Dutch-only UI.

> A portfolio project, built in the open. The author is on holiday through
> mid-June 2026; if the live demo misbehaves, please open an issue and I'll
> address it on my return.

## What this project demonstrates

A deliberately chosen "fewer abstractions" stack — Node/Fastify instead of a
batteries-included framework, raw SQL via `pg` instead of an ORM, custom
session auth via crypto primitives instead of a library like Auth.js — to
exercise and demonstrate fundamentals rather than framework-specific syntax.
The reasoning behind each major choice is recorded in an ADR so the trade-offs
are visible:

- **Custom session auth** — argon2id password hashing, hashed session tokens,
  refresh tokens in httpOnly cookies, device-based anonymous flow with an
  email upgrade path. See [ADR-004](docs/adr/ADR-004-oslo-session-auth.md) and
  [ADR-012](docs/adr/ADR-012-device-first-auth.md).
- **Raw SQL over an ORM** — direct control over queries; migration discipline
  via plain `.sql` files. See [ADR-003](docs/adr/ADR-003-raw-sql-over-orm.md).
- **Self-managed VPS over PaaS** — Docker on Hetzner, nginx + Let's Encrypt,
  ufw + fail2ban, full GitHub Actions CI/CD pipeline (test → build → push to
  GHCR → SSH-deploy → migrate). See [ADR-008](docs/adr/ADR-008-vps-over-managed-hosting.md)
  and the [CI/CD runbook](docs/ops/ci-cd.md).
- **Claude API integration** — server-side proxy, SSE streaming for chat,
  per-request context injection (user memories + behavioral patterns), rate
  limiting via a `createRateLimiter` middleware factory. See
  [ADR-006](docs/adr/ADR-006-claude-model-strategy.md).
- **Documented architectural direction** — design docs and ADRs for
  offline-first PWA behaviour ([ADR-005](docs/adr/ADR-005-pwa-over-native.md),
  [ADR-007](docs/adr/ADR-007-offline-first-indexeddb.md)) are in place; the
  implementation is deferred (see roadmap).

Full ADR index: [docs/adr/INDEX.md](docs/adr/INDEX.md). The broader rationale
for the "build without scaffolding" approach is in
[docs/plan/03-learning-plan.md](docs/plan/03-learning-plan.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's phone                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Vue 3 app                        │    │
│  │  - modes 1-4                                        │    │
│  │  - themes                                           │    │
│  │  - i18n                                             │    │
│  └────────────────────────────┬────────────────────────┘    │
│                               │ API calls                   │
└───────────────────────────────┼─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Docker)                             │
│                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │  Nginx   │───▶│  Fastify API     │───▶│ PostgreSQL   │   │
│  │  (HTTPS) │    │  (TypeScript)    │    │              │   │
│  │          │    │                  │    │ - users      │   │
│  └──────────┘    │  - auth (oslo)   │    │ - activities │   │
│                  │  - activity CRUD │    │ - categories │   │
│                  │  - mode logic    │    │ - usage logs │   │
│                  │  - AI proxy      │    └──────────────┘   │
│                  └────────┬─────────┘                       │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ API calls (server-side only)
                            ▼
                  ┌──────────────────┐
                  │  Claude API      │
                  │  (Anthropic)     │
                  │                  │
                  │  - onboarding    │
                  │  - mode 4 chat   │
                  └──────────────────┘
```

All four modes currently require a connection. Offline-first behaviour for
modes 1-3 (loading from a local IndexedDB copy) is designed in the ADRs but
deferred — see roadmap.

## Status

Stage 6 of 7 complete: app is live at [unwind.nu](https://unwind.nu) with full
CI/CD. Push to `main` runs tests, builds + pushes Docker images to GHCR, and
SSH-deploys to the VPS. Branch protection on `main`, gitleaks secret scanning
on every PR.

What works end-to-end:

- Device-based anonymous accounts with email upgrade
- All four suggestion modes (random, stress-filtered, counterbalance, AI chat)
- AI-guided onboarding that generates 10-15 personalized activities + 3-5
  long-term user memories in a single Claude call, batch-inserted in one
  transaction
- Rate limiting (70 chat requests/day, 3 onboarding attempts/account)
- HTTPS, nginx hardening, Sentry on backend + frontend (with an ad-blocker
  bypass tunnel), Pino logs with sensitive paths redacted
- three theme variants (calm/warm/playful)

What's deferred or in progress is in the roadmap below.

## Roadmap

Honest but incomplete list of what's known to be incomplete. Items are ordered roughly by
priority, not by how easy they'd be to fix:

- **Frontend test coverage — currently zero.** Backend has 7 test files
  covering auth, activities, memory, rate limiting, and onboarding parsing,
  but the Vue side has no Vitest/component tests yet. Highest-priority next
  chunk.
- **Backend test coverage — partial.** Integration tests hit a real Postgres
  test container (correct call — see CLAUDE.md), but route coverage is gappy
  and there are no tests for the streaming chat endpoint or the SSE error
  paths.
- **Sentry doesn't capture caught backend errors.** Errors thrown by the
  Anthropic SDK inside `try/catch` are logged via Pino but never reach
  Sentry, so upstream incidents go silent. Needs an explicit
  `Sentry.captureException()` in the chat + onboarding catch blocks, or a
  Pino → Sentry transport.
- **Chat error messages collapse all upstream errors into one string.**
  The SSE error event surfaces `"AI service is temporarily unavailable"` for
  anything that isn't a 429 — including billing, auth, or 4xx errors that
  won't self-resolve. Needs error-class differentiation.
- **Mobile-first styling pass.** The app is functional on mobile but the
  styling was developed desktop-first; a deliberate mobile-first refactor is
  pending.
- **Offline-first PWA behaviour.** Designed in
  [ADR-005](docs/adr/ADR-005-pwa-over-native.md) and
  [ADR-007](docs/adr/ADR-007-offline-first-indexeddb.md) (IndexedDB-backed
  local copy of the activity list for modes 1-3, service worker install,
  pending-sync queue) but implementation was deferred to prioritise getting
  the AI features and deployment shipped.
- **Stage 7 — keeping the activity library relevant.** Mechanisms for
  refreshing/pruning the personalized activity list over time. Rough outline
  exists in [docs/plan/](docs/plan/).
- **GHCR retention policy for old image tags.** Currently manual cleanup;
  needs an automated policy or scheduled prune.
- **Phase 0.4 deferred bug fixes** from the Stage 6 deployment plan.

## Documentation

For reviewers / curious readers:

- [docs/adr/INDEX.md](docs/adr/INDEX.md) — every architectural decision with
  rationale and trade-offs (12 ADRs)
- [docs/ops/ci-cd.md](docs/ops/ci-cd.md) — full deployment runbook including
  rollback and key rotation
- [docs/ops/branching.md](docs/ops/branching.md) — branching strategy
- [docs/plan/](docs/plan/) — design docs for each stage
- [docs/learning/](docs/learning/) — concept write-ups (Fastify, nginx,
  TypeScript patterns, data access + privacy)
- [docs/review/](docs/review/) — user-testing methodology + reports

## Project structure

```
unwind/
├── frontend/          # Vue 3 + Vite + UnoCSS
├── backend/           # Fastify + TypeScript + raw SQL
├── docs/adr/          # Architecture Decision Records
├── docs/plan/         # Design docs and build plan
├── docs/ops/          # Operations runbooks
└── docker-compose.yml # PostgreSQL (local dev)
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Start the database

From the project root:

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5555`.

### 2. Configure the backend environment

```bash
cp backend/.env.example backend/.env
```

The defaults match the Docker database above. If you changed ports or
credentials in `docker-compose.yml`, update `.env` to match.

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:3000`. Check it works: open
`http://localhost:3000/health`.

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

### 5. Set up the database

Run migrations and seed the base activity list:

```bash
cd backend
npm run migrate
npm run seed
```

### 6. Run backend tests

Tests run against a separate `unwind_test` database:

```bash
docker exec -it unwind-db-1 psql -U unwind -c "CREATE DATABASE unwind_test;"
```

Make sure `.env.test` exists in `backend/` with the test DB credentials, then:

```bash
cd backend
npm test
```

Migrations run on the test DB automatically before the suite starts.

### Stopping everything

- Frontend/backend: `Ctrl+C` in their terminals
- Database: `docker-compose down` from the project root
