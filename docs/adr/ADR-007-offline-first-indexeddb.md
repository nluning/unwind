# ADR-007: Offline-first with IndexedDB

## Status: Accepted

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
