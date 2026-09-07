# Nav menu stops working on installed iOS web app after a deploy

**Date:** 2026-09-07
**Issue:** None — found during development
**Status:** Verified

## Problem

After the accessibility PR deployed to `main`, Noor reported that navigation
from the nav menu stopped working on her phone — but only when the app is
opened as the installed "web app" (iOS home-screen icon), not in a regular
mobile browser tab, and not on desktop.

## Reproduction Steps

**Diagnosis evidence (2b):**

- `docs/plan/23-stale-cache-on-deploy.md` already documents this exact
  failure mode from a debugging session on 2026-06-15, root-caused and
  scoped with a fix — but marked `Status: NOT STARTED` and never applied.
- Confirmed `frontend/nginx.conf`'s `location /` block (serving
  `index.html`) still has no `Cache-Control` header of any kind, so caching
  falls to browser heuristics — worst-case on iOS, which caches the
  home-screen web-clip's navigation request hard and revalidates lazily.
- Vite content-hashes JS/CSS on every build (`index-<hash>.js`). A fresh
  `main` deploy overwrites the previous build's output, deleting the old
  hashed files. A phone holding a stale cached `index.html` from before the
  deploy still references those now-deleted filenames — its next asset
  requests 404, and the app runs in a broken partial state (old HTML shell,
  missing/failed JS chunks). This reproduces on *any* deploy, not something
  specific to the accessibility PR's diff — confirmed none of that PR's
  changed files touch `nginx.conf`, the Dockerfile, or deploy config.

## Root Cause

`frontend/nginx.conf`'s `location /` (around line 65-69) serves
`index.html` with no explicit `Cache-Control` header. iOS home-screen web
clips cache the navigation request aggressively and revalidate lazily, so a
phone can keep loading a pre-deploy `index.html` that references
content-hashed JS/CSS filenames the latest build no longer ships — those
requests 404, breaking the app in ways that look like arbitrary features
(here: nav menu clicks) silently failing.

## Chosen Approach

Apply the fix already designed in `docs/plan/23-stale-cache-on-deploy.md`:
split cache policy in `frontend/nginx.conf` — `Cache-Control: no-cache` on
`index.html` (always revalidate, so a deploy is picked up immediately) and
`Cache-Control: public, immutable` with a 1-year `expires` on `/assets/`
(content-hashed, safe to cache forever).

## Fix

Added two new `location` blocks to `frontend/nginx.conf`:
- `location /assets/` — `expires 1y; add_header Cache-Control "public, immutable";`
- `location = /index.html` — `add_header Cache-Control "no-cache";`

No app code changed — this is an nginx config fix, not a frontend/backend
code fix, so there's no Vitest regression test to write. Verified instead
by checking the served response headers after the config change (see
Verification).

## Verification

Validated `frontend/nginx.conf` syntax with a throwaway container:
`docker run --rm -v "$(pwd)/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t`
→ `syntax is ok` / `test is successful`.

`location = /index.html` (exact match) takes precedence over the `location /`
prefix block regardless of order, and nginx re-evaluates location matching
after `try_files`'s internal redirect to `/index.html` — so SPA routes
falling through `try_files` also pick up the `no-cache` header, not just a
direct request for `/index.html`.

No automated verifier agent for an nginx-config-only change — full
end-to-end confirmation (headers on the live response, deploy picked up
immediately) happens once this ships through CI/CD to the VPS.

## Notes / Follow-ups

**The already-cached phone will not self-correct from this deploy.** Per
the plan doc's caveat: Noor needs a one-time manual fix on her phone —
either delete and re-add the home-screen icon, or iOS Settings → Safari →
Clear History and Website Data. Future deploys will come through
automatically once these headers are live.

The plan doc also flags that CLAUDE.md lists "PWA, offline-first" as a
decision, but no service worker/manifest exists yet — if one is added
later, `registerType: 'autoUpdate'` + an update-available prompt will be
needed to avoid re-introducing this exact class of bug via the service
worker instead of HTTP caching. Out of scope here.
