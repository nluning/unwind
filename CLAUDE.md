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
event tracking, and Dutch i18n. UnoCSS migration complete: all scoped CSS
replaced with utility classes referencing CSS custom property theme tokens.
Six theme variants (calm, warm, playful × dark/light) with `useTheme`
composable and `ThemeSelector` component, stored in localStorage. Dark mode
is the default (less intense for overstimulated users). CSS custom property
tokens include `--c-card` for dark-mode card separation. Loading spinners, error
states with retry, and exhausted states added to all mode pages. `LinkButton`
shared component extracted. Frontend tests moved to separate branch.
Mobile-first styling (Step 15) still deferred.

Stage 5 progress (Chunks 1-6 of 10 done):
- Chunks 1-2: `POST /chat` + `/chat/stream` endpoints with auth, Fastify
  schema validation, Anthropic SDK (Haiku), SSE streaming, token usage logging,
  error handling (429/503), manual CORS headers for SSE
- System prompt: adaptive tone (stress-aware), Dutch-first with language
  switching, JSON activity format, soft/hard conversation limits (20 messages)
- `buildSystemPrompt()` for per-request context injection (stress level,
  categories done today, message count warnings)
- Chunks 3-5: `useChat` composable (streaming via EventSource), ChatPage.vue
  with message list, input, "Nieuw gesprek" reset, auto-scroll, route +
  BottomNav wiring
- Chunk 6: `parseActivity.ts` — JSON extraction (fenced + bare strategies),
  `toCreatePayload` mapping, save button in chat UI
- Next: Chunk 7 (memory storage layer), Chunk 8 (memory → system prompt),
  Chunk 9 (onboarding prototype), Chunk 10 (onboarding endpoint + UI),
  Chunk 11 (rate limiting), Chunk 12 (tests)

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

## Intentionally excluded

- **State management library (Pinia/Vuex)** — use Vue's built-in reactivity
  and composables. Add Pinia only if state management becomes painful.
- **ORM or query builder** — raw SQL via `pg`. See ADR-003.
- **Monitoring beyond Sentry + Pino** — sufficient at ~100 users.
