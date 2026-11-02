# ADR-007: Offline-first with IndexedDB

## Status: Accepted, amended 2026-11-02 (see "Amendment" at the end)

## Context

Target users may use the app without reliable connectivity — on the couch, on a
train, on flaky WiFi. Modes 1-3 (Suggest, Stress, Counterbalance) are filtering
and randomization over the user's activity list. They don't need a server.

Offline-first architecture is also a genuinely advanced skill that most junior
developers never encounter. Building it from scratch — service workers, IndexedDB,
sync queues, cache strategies — develops understanding of the browser as a
platform, not just a rendering engine.

## Decision

Offline-first architecture. Sync the user's activity list to IndexedDB on login
and periodically thereafter. Modes 1-3 read from the local copy as their primary
data source; the server is the sync target, not the source of truth at read time.

Actions taken while offline (accept, skip, usage events) are queued locally and
synced when connectivity returns. Cache-first for the app shell, network-first
for API data. Last-write-wins conflict resolution — sufficient at ~100 users
where simultaneous edits to the same record are effectively impossible.

## Consequences

- Core features feel fast: no network round-trip for suggestions.
- Adds complexity: IndexedDB API, a sync queue, and conflict resolution logic.
  This is accepted as a learning investment — understanding cache strategies
  (cache-first vs. network-first) and sync patterns transfers to any
  application that deals with unreliable connectivity.
- Only Mode 4 (AI chat) strictly requires connectivity.
- Service worker setup needed for app shell caching (aligns with PWA decision
  in ADR-005).

## Amendment (2026-11-02, plan 29)

Modes 1-3 no longer exist, so the original scope no longer matches the app. The
decision stands, narrowed to what the app actually does now: the "Verras me"
loop (`/suggest`). Details and chunk history: `docs/plan/29-offline-mode.md`.

- **Scope.** Offline: open the app, get suggestions, accept/skip, give "klaar"
  feedback. Online only: activity create/update/delete, AI suggestions, chat,
  memories, stats, login.
- **Append-only outbox instead of a general sync queue.** Usage events are a log,
  so there is nothing to merge and no conflict resolution is needed (the
  last-write-wins clause above never came into play). The outbox is FIFO, so a
  feedback PATCH can never overtake the POST it belongs to.
- **Client-minted UUIDs, idempotent insert.** The client generates the event id
  and the server inserts `ON CONFLICT (id) DO NOTHING`. Delivery is at-least-once;
  with the idempotent insert the result is effectively-once. The client's
  `created_at` is clamped server-side to the last 7 days, never in the future.
- **Stale-while-revalidate for the activity list.** The IndexedDB snapshot renders
  at once and is refreshed from the network. The snapshot is tagged with the owner
  id and wiped on logout and account deletion.
- **Cache strategy.** The app shell is precached by a Workbox service worker
  (`vite-plugin-pwa`, `generateSW`, `registerType: 'prompt'`): cache-first for the
  shell, network-only for `/api` and `/sentry-tunnel`. The original "network-first
  for API data" was replaced by the snapshot plus outbox, which handle offline
  explicitly instead of through a cache.
- **Updates are opt-in.** A waiting service worker only takes over when the user
  taps "Vernieuwen", so a reload never interrupts a half-finished flow.
- **No Background Sync API.** Not supported on iOS. The outbox flushes on app start,
  the `online` event and returning to the foreground; nothing is delivered while
  the app is closed.
- **Offline auth boot.** On a network error the cached session is trusted; the
  server stays authoritative and the first 401 re-runs the normal auth path.
