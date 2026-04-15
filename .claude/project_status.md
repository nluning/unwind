---
name: Unwind project status
description: Current build stage — Stage 5 (AI integration) in progress. Chunks 1-6 of 12 done. Chat streaming, UI, and activity parsing complete. Memory storage pulled forward before onboarding.
type: project
---

Unwind is an activity suggestion app for neurodivergent brains that struggle to switch off. Four modes: random suggest, stress-filtered, counterbalance, AI chat.

**Stages 0-2** — Complete. Auth working (device auth, upgrade flow, 52 tests green).

**Stage 3** — Complete. Vue Router, API client, auth composable, three mode pages (Suggest, Stress, Counterbalance) with shared `useSuggestionFlow` composable, ActivityCard, BottomNav, usage event tracking, Dutch i18n. UnoCSS migration done. Six theme variants (calm/warm/playful × dark/light). Loading/error/exhausted states. Mobile styling (Step 15) still deferred.

**Stage 5** — In progress (as of 2026-04-15). Chunks 1-6 of 12 done:
- Chunks 1-2: `/chat` and `/chat/stream` endpoints (Anthropic Haiku, SSE, auth, schema validation, token logging)
- Chunk 3: `useChat` composable (streaming via EventSource)
- Chunk 4-5: ChatPage.vue with message list, input, "Nieuw gesprek" reset, auto-scroll, route + BottomNav wiring
- Chunk 6: `parseActivity.ts` — JSON extraction (fenced + bare strategies), `toCreatePayload` mapping, save button in chat UI
- Next: Chunk 7 (memory storage layer — `user_memories` migration + CRUD),
  Chunk 8 (inject memories into system prompt), Chunk 9 (onboarding prototype),
  Chunk 10 (onboarding endpoint + UI), Chunk 11 (rate limiting), Chunk 12 (tests)

**Why:** Stage 5 turns the app from a random-suggestion tool into an AI-powered conversational experience — the core differentiator.

**How to apply:** Memory storage layer was pulled forward so onboarding can seed user memories alongside activities, avoiding rework. User-facing memory management (view/edit/delete) stays in Stage 7. Review questions from Chunks 5-6 are still open.
