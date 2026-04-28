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

**Stage 6 — Deployment (in progress, Phase 1 complete).**
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

Stage 6 progress (see `docs/plan/10-deployment-plan.md`):
- Phase 0 (pre-deployment fixes): env var validation on startup, `DELETE /me`
  endpoint with cascade cleanup, `PrivacyPage.vue` with Dutch GDPR notice,
  delete-account button in UserMenu. Bug fixes deferred.
- Phase 1 (Docker): backend + frontend Dockerfiles (multi-stage), nginx.conf
  with API proxy + SSE support, `docker-compose.production.yml` (db, backend,
  frontend), tested locally and working. Host binding set to `0.0.0.0`.
- Next: Phase 2 (VPS setup) + Phase 3 (nginx + HTTPS)

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
