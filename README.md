# Unwind

Activity suggestion app for brains that struggle to switch off.

**Live demo:** [unwind.nu](https://unwind.nu) — Dutch-only UI.

> A portfolio project, built in the open. 

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
- **Claude API integration** — server-side proxy, two on-demand generation
  endpoints (a 3-question quick suggestion, and ideas derived from the user's
  own activity list), rate limiting via a `createRateLimiter` middleware
  factory. See [ADR-006](docs/adr/ADR-006-claude-model-strategy.md). An
  earlier SSE-streaming chat mode and a conversational onboarding flow were
  built and shipped, then retired once user-review evidence (see below)
  favoured a device-first, no-onboarding entry — the code is still in the
  repo but unreachable from the UI; see [ADR-012](docs/adr/ADR-012-device-first-auth.md).
- **A persona-based AI review panel as a stand-in for real users** — with no
  live user base yet, UX and product decisions are pressure-tested against 8
  neurodivergent-user personas and 3 expert lenses (clinical psychology,
  HCI), run as parallel AI agents in character against real screens and copy.
  9 review runs so far have driven concrete, shipped decisions — not just
  polish suggestions. See [Review panel](#review-panel) below.
- **Documented architectural direction** — design docs and ADRs for
  offline-first PWA behaviour ([ADR-005](docs/adr/ADR-005-pwa-over-native.md),
  [ADR-007](docs/adr/ADR-007-offline-first-indexeddb.md)) are in place; the
  implementation is deferred (see roadmap).

Full ADR index: [docs/adr/INDEX.md](docs/adr/INDEX.md). The broader rationale
for the "build without scaffolding" approach is in
[docs/plan/03-learning-plan.md](docs/plan/03-learning-plan.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User's phone                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         Vue 3 app                         │  │
│  │         - hub-and-spoke nav (home button + menu)          │  │
│  │              - swipe gestures, themes, i18n               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │ API calls                        │
└──────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VPS (Docker)                           │
│                                                                 │
│  ┌──────────┐    ┌──────────────────────┐    ┌──────────────┐   │
│  │  Nginx   │───▶│     Fastify API      │───▶│  PostgreSQL  │   │
│  │ (HTTPS)  │    │     (TypeScript)     │    │              │   │
│  │          │    │                      │    │   - users    │   │
│  └──────────┘    │        - auth        │    │ - activities │   │
│                  │   - activity CRUD    │    │ - categories │   │
│                  │    - AI idea gen     │    │ - usage logs │   │
│                  └──────────────────────┘                       │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                           │ API calls (server-side only)
                           ▼
                  ┌────────────────────┐
                  │     Claude API     │
                  │    (Anthropic)     │
                  │                    │
                  │  - quick-suggest   │
                  │ - ideas from list  │
                  └────────────────────┘
```

The app uses a hub-and-spoke navigation model, not a fixed set of numbered
"modes": a single core suggestion screen ("iets voor nu") is the hub, and a
persistent home button always returns to it from every other screen (activity
list, AI idea generators, account). Two flows use the Claude API for
on-demand idea generation (see below); the rest is plain CRUD. Offline-first
behaviour for the core suggestion flow (loading from a local IndexedDB copy)
is designed in the ADRs but deferred — see roadmap.

## Status

Stage 6 of 7 complete: app is live at [unwind.nu](https://unwind.nu) with full
CI/CD. Push to `main` runs tests, builds + pushes Docker images to GHCR, and
SSH-deploys to the VPS. Branch protection on `main`, gitleaks secret scanning
on every PR.

What works end-to-end:

- Device-based anonymous accounts by default, no login wall and no forced
  onboarding — login/registration is an opt-in upgrade of the existing
  session (see [ADR-012](docs/adr/ADR-012-device-first-auth.md))
- Core suggestion hub ("iets voor nu") with optional stress-level and
  category filters, plus swipe-to-accept/reject gestures on mobile
- A self-curated activity list (add/edit/delete your own activities)
- Two AI idea generators, each rate-limited to 10 requests/day: a 3-question
  quick flow that returns one tailored suggestion, and suggestions generated
  from the user's own activity list
- HTTPS, nginx hardening, Sentry on backend + frontend with release tracking,
  uploaded source maps, and an ad-blocker bypass tunnel; Pino logs with
  sensitive paths redacted
- three theme variants (calm/warm/playful)
- A 9-report persona/expert review panel that has driven several shipped UX
  decisions — see [Review panel](#review-panel)

An earlier AI chat mode and conversational onboarding flow (with per-request
memory injection) were built and worked, but were retired in favour of the
above device-first flow; the code remains in the repo, unreachable from the
UI.

What's deferred or in progress is in the roadmap below.

## Roadmap

Honest but incomplete list of what's known to be incomplete. Items are ordered roughly by
priority, not by how easy they'd be to fix:

- **Backend test coverage — partial.** Integration tests hit a real Postgres
  test container (correct call — see CLAUDE.md); unit + integration specs
  cover auth, activities, rate limiting, memory, and the two AI generation
  endpoints, but coverage is still gappy in places.
- **Mobile-first styling pass — in progress.** Swipe-to-accept/reject
  gestures shipped for the core suggestion screen; the rest of the app is
  functional but was developed desktop-first, and a broader mobile-first
  refactor is still pending.
- **Offline-first PWA behaviour.** Designed in
  [ADR-005](docs/adr/ADR-005-pwa-over-native.md) and
  [ADR-007](docs/adr/ADR-007-offline-first-indexeddb.md) (IndexedDB-backed
  local copy of the activity list, service worker install, pending-sync
  queue) but implementation was deferred to prioritise getting the AI
  features and deployment shipped.
- **Stage 7 — keeping the activity library relevant.** Mechanisms for
  refreshing/pruning the personalized activity list over time. Rough outline
  exists in [docs/plan/](docs/plan/).
- **GHCR retention policy for old image tags.** Currently manual cleanup;
  needs an automated policy or scheduled prune.
- **Phase 0.4 deferred bug fixes** from the Stage 6 deployment plan.

## Review panel

With no live user base to validate UX against yet, Unwind uses a structured
substitute: a panel of 8 neurodivergent-user personas (sensory sensitivity,
decision paralysis, alexithymia, burnout, gifted-ND ideation-freeze, and
more) plus 3 expert lenses (a giftedness psychologist, a neurodivergence
psychologist, an average/below-average-IQ psychologist), run as parallel AI
agents that review real screens, flows, and copy *in character*. Findings
across all reviewers are compiled into a single report before a decision
ships.

It's not a rubber stamp — the panel has reversed and reshaped real product
decisions:

- **Onboarding became a tappable form, not a conversation** — the panel
  flagged free-text input as a dealbreaker for users in a depleted/shutdown
  state.
- **The login-wall-first entry point was scrapped** for the current
  device-first anonymous flow, after 6 of 7 personas independently flagged
  that the up-front navigation choice itself induced decision stress — see
  [ADR-012](docs/adr/ADR-012-device-first-auth.md).
- **Two navigation/menu restructures**, including the current hub-and-spoke
  model with a persistent home button, were built directly off panel
  verdicts (`docs/review/reports/003`, `007`, `008`, `009`).

9 review runs so far, each with a written report. Full methodology, persona
and expert definitions, and every report: [docs/review/](docs/review/).

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
