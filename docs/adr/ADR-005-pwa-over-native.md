# ADR-005: PWA over native app

## Status: Accepted

## Context

The app needs to feel native on phones — installable, offline-capable, fast to
open. Options considered: native iOS/Android, React Native, Capacitor wrapper
around the Vue app, or a Progressive Web App with service worker.

The core interaction pattern is: open the app, tap a button, read a suggestion,
close the app. There are no features that require native hardware APIs (camera,
Bluetooth, sensors). The user base is ~100 people.

## Decision

Build as a Progressive Web App with a service worker for offline caching and
IndexedDB for local data persistence.

### Why

- For the interaction pattern (open, tap, read, close), a PWA is
  indistinguishable from a native app once installed.
- No App Store deployment. iOS costs $99/year; Google Play costs $25 one-time.
  Neither is worth it for ~100 users.
- One codebase. The Vue frontend is the app — no separate mobile project, no
  bridge layer, no build toolchain for native targets.
- Offline support for modes 1-3 is straightforward with a service worker
  pre-caching the activity data and static assets.

### Known tradeoffs

- **iOS Safari kills service workers aggressively** when the app is in the
  background. Cached data persists (IndexedDB, Cache API), but background sync
  and push won't fire reliably.
- **iOS PWAs run in a separate storage context** from Safari. Cookies and
  localStorage are not shared. This can cause auth confusion if users switch
  between the browser and the installed PWA.
- **Push notifications on iOS require "Add to Home Screen" first.** Users who
  only use the browser tab never get push support.
- ~30% of Dutch smartphone users are on iOS, so these limitations affect a
  meaningful portion of the audience.

Mitigation: explicit iOS testing checkpoint during development. Capacitor
remains available as an escape hatch — it wraps the existing Vue app without a
rewrite, adding native capabilities if they become necessary.

## Consequences

- Works on all platforms (desktop, Android, iOS) from a single codebase.
- iOS limitations are real but acceptable for modes 1-3, which only need cached
  data and don't rely on background processing or push.
- If native features (reliable push, background sync, app store presence)
  become critical later, Capacitor can wrap the Vue app without rewriting it.
- No native development skills or toolchains required — the entire app stays
  in the Vue/TypeScript ecosystem Noor already knows.
