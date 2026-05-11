# Unwind

Activity suggestion app for neurodivergent brains that struggle to switch off.
Suggests relaxation activities tailored to the user.

This project has a dual purpose: build a genuinely useful app **and** develop
the skills that matter in an AI-driven development landscape. The focus is on
higher-order skills that AI can't replace — architecture decisions, system
design, deployment, and understanding what happens under the hood — rather than
framework-specific syntax. The stack (Node.js/Fastify instead of Laravel,
raw SQL instead of an ORM) is deliberately chosen to build fundamental
knowledge: understanding what a framework like Laravel abstracts away. 
See `docs/plan/03-learning-plan.md` for the full rationale.

## Architecture

Monorepo: `frontend/` (Vue 3 + Vite) and `backend/` (Fastify + TypeScript).
PostgreSQL for persistence, raw SQL via `pg`. Custom session-based auth using
oslo crypto primitives (`@oslojs/crypto`, `@node-rs/argon2`) with device-based
anonymous flow and email upgrade path. Refresh tokens in httpOnly cookies.
Dutch-only UI with vue-i18n. See `docs/plan/` for detailed design docs and
`docs/adr/` for architecture decisions.

## Project status

**Stage 6 — Deployment (complete).** App live at https://unwind.nu with full CI/CD via GitHub Actions: push to `main` triggers tests → builds + pushes images to GHCR → SSH-deploys to the Hetzner VPS (compose pull, migrate, up -d). Branching: `development` → PR → protected `main`.
Stages 0-3 complete (API, database, auth, modes 1-3 frontend, UnoCSS migration,
themes, loading/error states). Six theme variants (calm/warm/playful × dark/light)
with `useTheme` composable. Dark mode default. `LinkButton` shared component.
Mobile-first styling still deferred.

Stage 5 (all 12 chunks done):
- Mode 4 chat: `POST /chat` + `/chat/stream` with auth, Anthropic SDK (Haiku),
  SSE streaming, token usage logging, error handling (429/503)
- `buildSystemPrompt.ts`: per-request context injection — user memories,
  activity patterns (accept/skip history), stress level, conversation limits
- `useChat` composable, ChatPage.vue with streaming, auto-scroll, reset
- `parseActivity.ts`: JSON extraction, save-to-list button in chat UI
- Memory system: `user_memories` table, CRUD + batch endpoints, `memory_enabled`
  consent flag (default false, opt-in via onboarding)
- Onboarding: tappable form (setting/social/interests), Claude generates 10-15
  personalized activities + 3-5 user memories in one API call, batch-inserted
  in a single transaction. Decision: form over conversation (review panel showed
  typing is a dealbreaker for depleted users). Uses Sonnet (reverted from Haiku
  2026-04-23 — Dutch quality of generated activities was stilted; see ADR-006).
- Rate limiting: `api_usage` table, 70 chat requests/day (≈7 conversations),
  3 onboarding attempts total. `createRateLimiter` middleware factory.
- Tests: memory CRUD, rate limiting, onboarding response parsing
- First user review panel run: `docs/review/reports/001-general-concept.md`

Stage 6 progress (see `docs/plan/10-deployment-plan.md` for the plan and
`.claude/project_status.md` memory for the live state):
- Phase 0 done: env var validation on startup, `DELETE /me` with cascade
  cleanup, `PrivacyPage.vue` with Dutch GDPR notice, delete-account button.
  Phase 0.4 bug fixes deferred.
- Phase 1 done: Dockerfiles (multi-stage), nginx.conf with API proxy + SSE,
  `docker-compose.production.yml`. Backend bound to `0.0.0.0`.
- Phase 2 done: Hetzner Cloud VPS, SSH key-only auth, repo via deploy key,
  production secrets in gitignored `.env`.
- Phase 3 done: Let's Encrypt + certbot, nginx HTTPS termination for
  unwind.nu, ACME challenge plumbed through `/.well-known/acme-challenge/`,
  `trustProxy: true` in Fastify so cookies + rate limiting + req.ip work
  behind nginx.
- Phase 4 done: `/health` does `SELECT 1` (also Docker HEALTHCHECK), Pino
  redacts cookie/auth/password paths, `@sentry/node` on backend,
  `@sentry/vue` on frontend via a tunnel through nginx (`/sentry-tunnel` →
  ingest) that bypasses browser ad blockers which otherwise silently drop
  requests to `*.sentry.io`.
- Phase 5 done: ufw (22/80/443 only), unattended-upgrades, fail2ban (sshd
  jail). Backend container runs as non-root; db + backend ports not
  published to host. Login endpoint rate-limited at nginx (5r/m, burst 10
  per IP) to mitigate brute-force.
- Phase 6 done (2026-05-08): full CI/CD via GitHub Actions.
  - Repo went public 2026-05-08 (free-tier rulesets only enforce on public
    repos). Branch protection on `main`: PR required, linear history,
    `backend`/`frontend`/`secret-scan` checks must pass.
  - `ci.yml`: backend (tsc + vitest against postgres:17 service container),
    frontend (lint:check + vue-tsc + vitest + vite build), gitleaks.
    Runs on push to main/development and PRs.
  - `deploy.yml`: builds backend + frontend, tags `:sha-<commit>` + `:latest`,
    pushes to public GHCR (`ghcr.io/nluning/unwind-{backend,frontend}`).
    Deploy job (gated to `main`) provisions the deploy SSH key from secrets,
    SSHes to the server, pulls compose + images, runs migrations as a
    one-shot container, then `docker compose up -d`. Compose moved from
    `build:` → `image:` with `${IMAGE_TAG:-latest}` so rollback is just a
    different tag.
  - Secrets in GitHub: `SSH_PRIVATE_KEY` (dedicated deploy keypair, separate
    from laptop keys), `SSH_HOST`, `SSH_USER`, `SSH_KNOWN_HOSTS`,
    `VITE_SENTRY_DSN`. See `docs/ops/ci-cd.md` for the full runbook
    including rollback and key rotation.
  - Branching: see `docs/ops/branching.md`.
- Phase 0.4 (bug fixes) still deferred. Open Stage 6 follow-up: GHCR
  retention policy for old SHA tags (manual cleanup for now).

## Key decisions

See `docs/adr/INDEX.md` for a quick-reference table mapping each ADR to the
area of code it governs. **Before modifying code in an area covered by an ADR,
read the relevant ADR first.** Summary:

- Vue 3 + Fastify + PostgreSQL + Claude API
- PWA, offline-first for modes 1-3
- Raw SQL (no ORM) — intentional; direct control over queries
- Claude Haiku for Mode 4 chat, Sonnet for onboarding
- Docker on VPS, incremental deployment from Stage 0

## Memory

Store all memories in `.claude/` in this repo — **not** in the local
`.claude/projects/.../memory/` directory. Noor works on multiple machines, so
local memory won't persist. Read `.claude/MEMORY.md` for the index. When saving
new memories, write files to `.claude/` and update `.claude/MEMORY.md`.

## Working preferences

- Explain architecture and *why* before *how*
- Don't over-engineer — this is ~100 users, not enterprise scale
- When in doubt about scope, ask
- Dutch-only UI, i18n-ready from the start
- Privacy-sensitive data (stress levels, behavioral patterns) — handle accordingly

## AI collaboration workflow

AI writes code in small, reviewable chunks (a migration, a route, a composable
— not a whole feature). Each chunk is reviewed before moving on using three
question types:

- **Why** — tests conceptual understanding ("Why hash the session token before
  storing it?")
- **What if** — tests consequence awareness ("What happens if you remove the
  `httpOnly` flag?")
- **Trace** — tests end-to-end reasoning ("Walk through what happens from
  login request to cookie being set.")

Wrong answers are signal, not failure — they identify gaps to fill before
moving on. When a pattern repeats later, I write it independently before
seeing the AI version, to verify retention.

See `docs/plan/08-review-based-learning.md` for the full methodology and
session logs.

### Principles for AI

- **Concept first, then code.** Explain reasoning before writing implementation.
- **Syntax is a lookup, not a decision.** Don't gatekeep library APIs or
  framework conventions. Focus review questions on design decisions: data
  modeling, API contracts, state management.
- **Surface confusion early.** If a request is ambiguous or the direction
  seems wrong, flag it immediately rather than guessing.
- **Never read .env files directly.** If you need to check    
  whether a variable is set, ask the user, or use printenv VAR_NAME to read a single value, or grep for the key name only (e.g. grep -c '^VAR=' .env).

## Intentionally excluded

- **State management library (Pinia/Vuex)** — use Vue's built-in reactivity
  and composables. Add Pinia only if state management becomes painful.
- **ORM or query builder** — raw SQL via `pg`. See ADR-003.
- **Monitoring beyond Sentry + Pino** — sufficient at ~100 users.
