# Offline mode and the PWA shell

How the offline "Verras me" loop and the service worker behave, how to test
them, and how to recover when something goes wrong. Background and decisions:
`docs/plan/29-offline-mode.md`, ADR-007 (amended 2026-11-02).

## What works offline

Open the app, get suggestions, accept/skip, give "klaar" feedback. Events are
queued in IndexedDB (`outbox`) and sent later. Everything else (activity
create/edit/delete, AI suggestions, chat, memories, stats, login) needs a
connection and shows "je bent offline".

## When the outbox flushes

App start (once a user is loaded), the browser's `online` event, and the tab
becoming visible again. Nothing is sent while the app is closed (no Background
Sync on iOS).

Known gap: if the device says it is online but the server is unreachable
(server down, captive portal), no `online` event fires, so queued events wait
until the next app start or tab switch. Entries are never lost. A retry timer
would close the gap; deliberately not built at ~100 users.

## Service worker lifecycle

- Generated at build time by `vite-plugin-pwa` (`generateSW`) into `dist/sw.js`.
  It precaches the build (JS/CSS chunks, fonts, icons, manifest, `index.html`).
- `/api/*` and `/sentry-tunnel` are never answered from the cache.
- A new deploy installs a new worker that **waits**. The "Nieuwe versie" toast
  (`UpdateToast.vue`) activates it when the user taps "Vernieuwen".
- Update checks: on navigation, every hour, and when the app returns to the
  foreground (an installed PWA can stay open for days).
- nginx serves `/sw.js` and `/manifest.json` with `Cache-Control: no-cache`.
  A stale `sw.js` pins users to an old build, so never cache it.

## Testing locally

`npm run dev` does **not** register a service worker. To test the shell:

```
cd frontend
npm run build-only
npm run preview -- --port 5173 --strictPort
```

Use port 5173: the backend's CORS allows only `FRONTEND_URL`
(`http://localhost:5173` locally). On another port every API call fails with a
CORS error, which the app reads as "offline".

Afterwards, unregister the worker and clear site data for `localhost:5173`
(DevTools > Application), or `npm run dev` may serve the cached build.

Browser quirks seen so far:

- Firefox's DevTools "Offline" throttle does not fire the `online` event, so
  the outbox flushes only after a tab switch or reload. Chrome and real
  airplane mode do fire it.
- DevTools throttling may not block the service worker's own update fetch, so
  an update toast can appear while "offline". Real airplane mode is the
  reliable test.

## Recovering from a bad service worker (kill switch)

If a broken build ships and users are stuck on it, deploy a `sw.js` that removes
itself and its caches. Browsers re-fetch `sw.js` without the HTTP cache, so
users pick it up on their next update check:

```js
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', async () => {
  const keys = await caches.keys()
  await Promise.all(keys.map((key) => caches.delete(key)))
  await self.registration.unregister()
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) => client.navigate(client.url))
})
```

Users on a version that can never fetch `sw.js` again (e.g. cached at a proxy)
need to clear site data manually, which is why the `no-cache` header matters.

## Device checklist (iOS and Android, not yet done)

Run on real devices; record results here. Expected trouble spots on iOS:

- [ ] Add to Home Screen, open once online, then airplane mode: the app opens.
- [ ] Suggestions, accept/skip work offline; "Offline" pill shows.
- [ ] Reconnect: outbox empties without a manual reload (does `online` fire?).
- [ ] Accept offline, tap "klaar" offline, reconnect: both events land, once.
- [ ] Deploy a new version: the update toast appears after returning to the app.
- [ ] Installed PWA and Safari have separate storage (ADR-005): data and the
      session in one do not appear in the other.
- [ ] Storage eviction: after days unused, does IndexedDB survive? (Safari may
      evict script-writable storage for unused sites; installed PWAs are
      treated more leniently. Verify rather than assume.)
- [ ] Logout wipes IndexedDB (`unwind` database).
