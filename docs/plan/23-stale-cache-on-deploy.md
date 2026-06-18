# Stale app after deploy (iOS home-screen) — fix plan

**Status: NOT STARTED.** Logged 2026-06-15 from a debugging session. Scoped, not yet built.

## The symptom

A deploy lands on the server, but the iPhone home-screen icon keeps showing the
old app. Reported by Noor 2026-06-15 after a push+deploy didn't come through.

## Root cause — it's HTTP caching, not a service worker

This looks like the classic "PWA serves stale cache" problem, but it isn't:
**we have no service worker and no web app manifest.** No `vite-plugin-pwa`,
nothing in `index.html`, no `navigator.serviceWorker.register(...)`. So
"Add to Home Screen" on iOS just created a **web clip** (a bookmark with an
icon that opens Safari full-screen), not an installed PWA.

The stale-update problem is plain **HTTP caching of `index.html`**:

- `frontend/nginx.conf` `location /` (lines 67–71) serves the built files with
  **no explicit `Cache-Control` headers**, so caching falls to browser
  heuristics. iOS home-screen web clips are the worst case — WebKit caches the
  navigation request (`index.html`) hard and revalidates lazily.
- Vite content-hashes JS/CSS (`index-a1b2c3.js`), which are safe to cache
  forever. But `index.html` is the un-hashed entry point that *references* those
  hashed files. A stale `index.html` → requests for the old bundle names → old
  app, even though the new files are already on the server.

## The fix — split cache policy in nginx

In `frontend/nginx.conf`, give the two file types opposite policies:

```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}

# Hashed build assets — content-addressed, so cache forever.
location /assets/ {
    root /usr/share/nginx/html;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# index.html — the entry point. Must revalidate every load so a deploy
# is picked up immediately. Without this, iOS holds a stale copy.
location = /index.html {
    root /usr/share/nginx/html;
    add_header Cache-Control "no-cache";
}
```

`no-cache` means "always revalidate before using," not "never store." The
browser sends a conditional request; unchanged → cheap `304`; after a deploy →
new HTML + new hashed bundles. Standard SPA setup, and the right baseline
whether or not we ever add a real service worker.

Ships through the normal CI pipeline (one-file edit → push → deploy).

## Caveats

1. **The already-cached phone won't clear itself for this update.** One-time
   manual clear needed: iOS Settings → Safari → Clear History and Website Data,
   or delete + re-add the home-screen icon. Future deploys come through on their
   own once the headers are live.
2. **The manifest/SW gap contradicts CLAUDE.md**, which lists "PWA,
   offline-first for modes 1-3" as a decision. That's not built yet. If/when we
   add `vite-plugin-pwa`, we re-introduce the service-worker version of this
   exact problem and will want `registerType: 'autoUpdate'` + an "update
   available" prompt. The nginx headers above are a prerequisite either way.
   Decide separately whether real PWA/offline support is still in scope.
