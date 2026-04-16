---
name: Unwind project status
description: Current build stage — Stage 5 (AI integration) complete as of 2026-04-16. All 12 chunks done. Next is Stage 7 (polish).
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

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Using Haiku for both chat and onboarding (sufficient quality, lower cost)
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)

**Next:** Stage 7 (polish) — user-facing memory management, post-conversation fact extraction, mobile styling, and the review panel findings (nav redesign, stress scale rethink, chat quick-replies).
