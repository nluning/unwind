---
name: Unwind project status
description: Current build stage — Stage 6 (deployment) in progress. Phase 1 (Docker) complete as of 2026-04-17. Next is VPS + HTTPS.
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

**Stage 6 — Deployment (in progress, 2026-04-17):**
- Phase 0 done: env var startup validation, `DELETE /me` endpoint, privacy page, delete-account in menu
- Phase 1 done: backend + frontend Dockerfiles (multi-stage), nginx.conf (API proxy + SSE), docker-compose.production.yml, tested locally and working
- Phase 0.4 (bug fixes) deferred — not blocking deployment
- Next: Phase 2 (VPS setup) + Phase 3 (nginx + HTTPS)

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Using Haiku for both chat and onboarding (sufficient quality, lower cost)
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)
