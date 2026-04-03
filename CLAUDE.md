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

**Stage 5 — AI integration (in progress).**
Stages 0-2 complete (API, database, auth — 52 tests green). Stage 3 modes 1-3
frontend complete: three mode pages (Suggest, Stress, Counterbalance) with
shared `useSuggestionFlow` composable, ActivityCard component, BottomNav with
active state detection, `createActivity` composable ready for Mode 4, usage
event tracking, and Dutch i18n. UnoCSS installed. Themes/UnoCSS migration and
loading/error states deferred to polish pass. Frontend tests moved to separate
branch.

Stage 5 progress (Chunks 1-2 of 10 done):
- `POST /chat` endpoint with auth, Fastify schema validation, Anthropic SDK
  integration (Haiku), token usage logging, error handling (429/503)
- System prompt designed: adaptive tone (stress-aware), creative activity
  suggestions, Dutch-first with language switching, JSON activity format
- `buildSystemPrompt()` for per-request context injection (stress level,
  categories done today)
- Test script (`backend/scripts/test-prompt.ts`) for manual prompt iteration
- AI memory & personalization plan documented (`docs/plan/12-ai-memory.md`)
- Next: SSE streaming (Chunk 3), chat composable (Chunk 4), chat UI (Chunk 5)

## Key decisions

See `docs/adr/INDEX.md` for a quick-reference table mapping each ADR to the
area of code it governs. **Before modifying code in an area covered by an ADR,
read the relevant ADR first.** Summary:

- Vue 3 + Fastify + PostgreSQL + Claude API
- PWA, offline-first for modes 1-3
- Raw SQL (no ORM) — intentional; direct control over queries
- Claude Haiku for Mode 4 chat, Sonnet for onboarding
- Docker on VPS, incremental deployment from Stage 0

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

## Intentionally excluded

- **State management library (Pinia/Vuex)** — use Vue's built-in reactivity
  and composables. Add Pinia only if state management becomes painful.
- **ORM or query builder** — raw SQL via `pg`. See ADR-003.
- **Monitoring beyond Sentry + Pino** — sufficient at ~100 users.
