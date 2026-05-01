---
name: Unwind project status
description: Current build stage — Stage 6 (deployment) in progress. Phase 2 (VPS + DNS) complete as of 2026-05-01. App live at http://unwind.nu but not safe to use until HTTPS (Phase 3).
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
- Phase 2 done (2026-05-01): VPS at Hetzner CX23 (Falkenstein, Ubuntu 24.04). SSH hardened (no root login, no password auth, drop-in at `/etc/ssh/sshd_config.d/99-hardening.conf`). Docker installed via official apt repo. Repo cloned to `~/unwind` via deploy key (`~/.ssh/github_deploy`). Production `.env` lives next to the compose file with secrets. App is up via `docker compose -f docker-compose.production.yml`. Domain `unwind.nu` (TransIP) has A + AAAA records pointing to Hetzner. Build hit one tsc error in config.ts (`as const` array narrowing on `required.push(...PRODUCTION_ONLY)`) — fixed and pushed.
- Phase 0.4 (bug fixes) still deferred.
- Next: Phase 3 (nginx + HTTPS) — required because `secure: true` cookies silently drop on HTTP, so login/anonymous flow doesn't work end-to-end yet. Plan calls Phase 2+3 atomic — don't share URL until Phase 3.

**Key decisions made in Stage 5:**
- Onboarding is a form, not a conversation (review panel: typing is a dealbreaker)
- Memory consent is opt-in (default false, asked during onboarding)
- Haiku for Mode 4 chat (acceptable Dutch quality in short guided format); Sonnet for onboarding (reverted from Haiku on 2026-04-23 — Haiku's Dutch output was stilted for the generated activity list). See ADR-006 addendum.
- Rate limiting counts API requests, not conversations (70/day ≈ 7 conversations)
