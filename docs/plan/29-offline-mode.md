# Plan 29: offline mode for the "Verras me" loop

Issue: #122 · Branch: `feat/offline-mode` · ADRs read: 005, 007, 012 (+ plan 23, plan 28)

## Context

ADR-005/007 promise a PWA with offline support, but none of it exists: there is a `manifest.json` and icons, no service worker, no local store, no offline awareness. Stage 4 of `docs/plan/03-learning-plan.md` is written around modes 1-3, which are gone. The real core loop is `/suggest`, and it is already mostly client-side (`suggestionWeighting.ts`, filters in `useActivities`). Only these touch the network: `GET /activities`, `POST /usage-events` (accept/skip), `PATCH /usage-events/:id` (feedback), `GET /me` (router guard).

**Scope:** open the app with no signal, get suggestions, accept/skip, have events reach the server later. Out of scope: offline activity CRUD (show "je bent offline"), AI suggest, chat, memories, stats, login, Background Sync API (no iOS support).

**Key insight:** usage events are an append-only log, so the outbox needs no conflict resolution. The only hard problem is *identity*: the server mints the event id, and the "klaar" feedback flow needs it. Fix: the client mints the UUID and the server insert is idempotent.

## How we work (Noor's constraint)

Claude writes the code, one chunk at a time. After each chunk: explain the why, the trade-offs and any security/privacy angle, check understanding, then wait before the next chunk. Tests go with each chunk. Noor commits herself; no Claude attribution anywhere.

## Chunks

Order is deliberate: data and logic first, service worker last, so dev isn't confused by cached builds while we iterate.

1. **Backend: idempotent usage events.** `backend/src/routes/activities.ts` (`POST /usage-events`): optional `id` (uuid) in the body schema; one statement (CTE) that inserts `ON CONFLICT (id) DO NOTHING` and bumps the counter only if a row was inserted (today it's two separate queries, so a retry would double-count). Respond 201 `{ ok: true, id }` whether inserted or a duplicate. Optional `created_at`, clamped server-side (not future, not older than N days), so an event accepted offline yesterday doesn't look like "just now" to pending-feedback's 5 min-24 h window. Tests in `backend/tests/Integration/activities.spec.ts`: duplicate id counts once, id collision with another user's event inserts nothing and leaks nothing, clamping.
   *Discuss:* client-supplied primary keys (collision/probing), trusting client clocks, why `ON CONFLICT DO NOTHING` beats check-then-insert.
2. **Frontend: local database layer.** `frontend/src/utils/localDb.ts` on the `idb` wrapper (a lookup, not a decision): stores `activities` (snapshot), `outbox` (pending requests, FIFO by auto-increment key), `meta` (owner user id). Tests with `fake-indexeddb`.
   *Discuss:* IndexedDB vs localStorage (size, async, structured data), schema versioning/`onupgradeneeded`, iOS storage eviction (installed PWA vs Safari tab).
3. **Offline-aware API client.** `frontend/src/api/client.ts`: a `NetworkError` for fetch `TypeError`s (distinct from `ApiError`), not reported to Sentry (the app already skips `navigator.onLine` in `usePostActivityFeedback`; link to #57). Shared `useOnline` composable for UI.
   *Discuss:* why `navigator.onLine` is only a hint (captive portals, lie-fi), so we trust failed requests more than the flag.
4. **Activities snapshot (stale-while-revalidate).** `useActivities.fetchActivities`: render from IndexedDB at once, refresh from the network, write back; offline + no snapshot → existing `StateError`. Create/update/delete (`createActivity` etc.) and their buttons show "je bent offline" instead of failing. Wipe snapshot and outbox in `logout`/`deleteAccount` (hook into the existing `reset*State` calls in `useAuth.ts`); tag data with the owner id and discard on a different user.
   *Discuss:* privacy of data at rest (shared devices, logout wipes), staleness trade-off.
5. **Outbox + flush + local counters.** New `composables/useOutbox.ts`; `useSuggestionFlow.logEvent` generates `crypto.randomUUID()`, bumps local `times_accepted/times_skipped` (weighting stays right offline), enqueues, and tries to flush. The feedback PATCH in `usePostActivityFeedback.finish` goes through the same outbox, so FIFO order guarantees POST lands before PATCH. Flush triggers: `online`, app start, `visibilitychange`. Single-flight flag; two tabs are safe because of the idempotent insert. Rules: network error or 5xx → keep and stop; 401 → keep and stop (wait for a session); other 4xx → drop (a poison message must not block the queue). `SuggestionList`/`ChatPage` event calls stay online-only.
   *Discuss:* at-least-once delivery + idempotency = effectively-once, poison messages, why no Background Sync.
6. **Offline-aware auth boot.** `useAuth.fetchMe` / router guard (`router/index.ts`): on `NetworkError`, trust the cached session (the `unwind-user` flag plus cached user) instead of falling into `deviceLogin` and then `user = null`. The server stays authoritative: the first flush that gets a 401 triggers the normal re-auth path. Respects ADR-012 (device-first, no gate).
   *Discuss:* what a cached session does and doesn't protect, why there is nothing sensitive to guard offline beyond what's already on the device.
7. **PWA shell.** `vite-plugin-pwa` in `frontend/vite.config.ts` (Workbox `generateSW`, `registerType: 'prompt'`): precache build incl. lazy page chunks, `navigateFallback: '/index.html'` with `/api` and `/sentry-tunnel` denied, reuse `public/manifest.json`/icons. Update toast component mounted in `App.vue` plus a small offline indicator. `frontend/nginx.conf`: `location = /sw.js` with `Cache-Control: no-cache` (same trap as plan 23) and the same for the manifest.
   *Discuss:* SW lifecycle (install/waiting/activate, `skipWaiting` and why we prompt), cache-first shell vs network-only API, how a SW can brick an app and the kill-switch story.
8. **Docs and wrap-up.** Amend ADR-007 (scope: "Verras me", append-only outbox, client UUIDs); mark Stage 4 in `03-learning-plan.md` superseded; update plan 23's caveat 2 and the Stage 6 status line in `CLAUDE.md`/`.claude/project_status.md`; add `docs/ops` notes for the iOS checklist. Offer `/adr` for any decision that deserves its own record.

## Critical files

`backend/src/routes/activities.ts`, `frontend/src/api/client.ts`, `frontend/src/composables/{useActivities,useSuggestionFlow,usePostActivityFeedback,useAuth}.ts`, `frontend/src/router/index.ts`, `frontend/src/App.vue`, `frontend/vite.config.ts`, `frontend/nginx.conf`. New: `utils/localDb.ts`, `composables/{useOutbox,useOnline}.ts`, an update-toast component.

## Verification

- `npm test` in `backend/` and `frontend/` (+ `lint:check`, `vue-tsc`) green before every review gate.
- Manual, Chrome DevTools "Offline" then real airplane mode: visit online once, go offline, reload (shell loads), get suggestions, accept/skip, reconnect, check the rows in `usage_events` exist once; accept offline, then "klaar", then verify the feedback lands.
- Deploy twice; confirm the update toast appears and `sw.js` revalidates.
- Logout wipes IndexedDB (DevTools > Application).
- Real Android and iOS device pass; document iOS quirks in `docs/ops`.

## Open decisions (flag during the chunks)

- Clamp window for client `created_at` (chunk 1).
- Whether to route the feedback PATCH through the outbox (recommended) or keep it best-effort online-only (chunk 5).
- Pre-existing, out of scope but noted: `POST /usage-events` bumps the counter of any `activity_id` without an ownership check.
