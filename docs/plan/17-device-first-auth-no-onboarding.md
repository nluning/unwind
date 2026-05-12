# Device-first auth + no onboarding gate

**Status: planned, not started.**

## What this document covers

Two adjacent UX changes packaged as one PR because they share a frontend
boot sequence and a router refactor:

1. **No onboarding gate.** A new visitor lands on `/suggest` with the base
   activity library available, not on a forced 4-question intake form.
2. **No login gate.** A new visitor is given an anonymous device-scoped
   account transparently on first app load. Login and account creation
   become menu actions ("Maak een account") that *upgrade* the existing
   anonymous user via `POST /auth/upgrade`.

Background and rationale: `docs/review/reports/002-onboarding-source-choice.md`
and `docs/adr/ADR-012-device-first-auth.md`.

Most of the underlying code already exists. This plan is largely a
**deletion + reorganisation**, not a build. Specifically:

- `POST /auth/device` — already implemented and tested.
- `POST /auth/upgrade` — already implemented; `email IS NULL` guard
  prevents clobbering an existing email account.
- `ActivitiesListPage.vue` — already has a CRUD form for adding custom
  activities. Just needs to be more discoverable.
- `UserMenu.vue` — already routes to `/activities`, `/stress`,
  `/counterbalance`, `/privacy`.
- `POST /onboarding/generate` — keeps working unchanged; becomes
  invoked from a menu action rather than a forced first-run flow.

## Design decisions

- **Device auth happens transparently in `useAuth.initialize()`, not in
  a route guard.** The initializer is the natural place: it already runs
  once per app boot, before the first router navigation. Putting the
  device-auth fallback there keeps the router clean and means every code
  path that calls `initialize()` (router, page mounts, manual refresh)
  gets the same behavior.
- **The `/login` route stays.** It's the destination for returning email
  users on a fresh browser. It's just no longer where unauthenticated
  visitors get redirected.
- **`needsOnboarding` stays defined.** The router stops gating on it,
  but the property is read elsewhere (analytics, possibly Mode 4 system
  prompt context). Leaving the computed in place avoids ripple. The
  onboarding_completed_at column survives this PR — its removal is a
  separate cleanup.
- **Logout button is hidden for anonymous users.** "Logout" without an
  email account is incoherent — the user has nothing to log out of, and
  invalidating the session would just trigger a fresh device-auth on
  next navigation. For anonymous users the slot is filled by
  "Maak een account" (which routes to the upgrade flow).
- **No contextual upgrade nudge in this PR.** Defer until the no-onboarding
  shape is live and we can see who actually invests vs. bounces. Saves
  scope and avoids designing the nudge before we know which trigger
  matters (N custom activities? AI-generated count? memory count?).
- **No welcome card in this PR.** Optional polish, can land in a
  follow-up if Lisa-type users find the empty entry too bare.

What we are NOT doing here:
- Removing `users.onboarding_completed_at`. Vestigial after this PR but
  kept for now.
- Adding a contextual "save your data" nudge after the user accumulates
  custom activities. Deferred.
- Welcome card / first-open tooltip. Deferred.
- Mode 4 cold-start mitigation (memory injection without onboarding).
  Mode 4 is nobody's primary per 001; the 002 follow-up notes this as
  acceptable.

---

## Phase 1 — Frontend: transparent device-auth on boot

### Why this phase matters

This is the only piece that fundamentally changes app behavior. Until
`initialize()` device-auths a fresh visitor, removing the login redirect
just leaves visitors stuck on `/me` returning 401.

### 1.1 Teach `useAuth.initialize()` to device-auth on miss

In `frontend/src/composables/useAuth.ts`, change `fetchMe()` so that if
the `/me` call fails (no session), it calls `deviceLogin()` with the
localStorage `unwind-device-id` (creating one if absent) instead of
silently leaving `user.value = null`.

Sketch:

```ts
async function fetchMe() {
  try {
    user.value = await api<User>('/me')
    localStorage.setItem('unwind-user', 'true')
  } catch {
    // No valid session — bootstrap an anonymous device-scoped one.
    try {
      const deviceId = getOrCreateDeviceId()
      await deviceLogin(deviceId)
    } catch {
      // Device-auth itself failed (network down, server error).
      // Leave user.value null; router still falls through to /login
      // as a defensive fallback. See Phase 2.
      user.value = null
      localStorage.removeItem('unwind-user')
    }
  }
}

function getOrCreateDeviceId(): string {
  const key = 'unwind-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
```

The existing `getOrCreateDeviceId` helper currently lives in
`LoginPage.vue`. Move it into `useAuth.ts` so both the boot path and the
LoginPage (for the explicit "use without account" button, if kept) share
one implementation.

### 1.2 Remove the unauthenticated-route redirect

In `frontend/src/router/index.ts`:

```ts
// before
if (!isPublic && !isLoggedIn.value) {
  return { name: 'login' }
}

if (isLoggedIn.value && needsOnboarding.value && !isOnboardingRoute && !isPublic) {
  return { name: 'onboarding' }
}
```

After:

```ts
// Auth bootstrap happens in initialize(). If we still don't have a user
// here (device-auth itself failed), fall through to /login as a defensive
// fallback for the rare server-error case.
if (!isPublic && !isLoggedIn.value) {
  return { name: 'login' }
}
```

Drop the `needsOnboarding` redirect entirely. Drop the `onboarding: true`
meta flag (the route stays but is no longer reachable via auto-redirect —
it's reached from a menu action; see Phase 3.2).

The `/login` fallback stays as a defensive measure for the case where
`POST /auth/device` itself errors. It is not the default destination of
a successful boot.

### 1.3 Tests

In `frontend/tests` (or `frontend/src/__tests__/`, follow whichever the
repo already uses for composable tests):

- `useAuth.initialize()` with no existing session → ends with
  `isLoggedIn.value === true` and `user.value.email === null`.
- `useAuth.initialize()` with a valid `/me` session → no `/auth/device`
  call is made.
- `useAuth.initialize()` with both endpoints failing → ends with
  `user.value === null` (the defensive fallback path).
- Router guard: anonymous user visiting `/suggest` resolves without
  redirect.
- Router guard: anonymous user visiting `/onboarding` resolves directly
  (no longer auto-redirected there, but the route is still reachable from
  the menu — see Phase 3.2).

---

## Phase 2 — Backend: nothing changes

The endpoints in `backend/src/routes/auth.ts` already do what we need:

- `POST /auth/device` — issues a session for a device_id; creates the
  user row if absent.
- `POST /auth/upgrade` — adds email + password to an existing anonymous
  user. Guarded by `email IS NULL` so it can't clobber a logged-in
  account.
- `POST /onboarding/generate` — unchanged; will be called from a menu
  action instead of a forced first-run page.

No migrations. No new endpoints. No schema changes.

A small backend test to add for paranoia:

- `tests/Integration/auth.spec.ts`: verify `POST /auth/upgrade` returns
  the same `id` it received and the row's `device_id` is preserved
  (i.e. upgrade is a column update, not a new user). Probably already
  tested — confirm before adding.

---

## Phase 3 — Frontend: menu reorganisation

### 3.1 Hide logout for anonymous, surface upgrade instead

In `frontend/src/components/UserMenu.vue`:

- Replace the unconditional "Logout" button with a conditional render
  based on `isAnonymous` from `useAuth`.
- For anonymous: render "Maak een account" → `router.push('/login')`
  with a query flag or state so the LoginPage knows to show the upgrade
  flow instead of the email/password login. (Or: a dedicated `/account`
  route that mounts the LoginPage with `mode="upgrade"`.) Recommend the
  query flag — fewer routes, same component.
- For email users: render the existing "Logout" button unchanged.

### 3.2 Add "Verzin activiteiten voor me" to the menu

Add a new entry in `UserMenu.vue`'s `navLinks` (or a separate action
block — it's not navigation, it triggers a flow):

```
{ to: '/onboarding', label: 'menu.generateActivities' }
```

The `OnboardingPage.vue` already drives the 4-question form and calls
`/onboarding/generate`. When invoked from the menu rather than as a
first-run gate, the same component works. The done-state's "Naar de
suggesties" button still routes to `/suggest`. Confirm
`handleGenerate` doesn't behave oddly for already-onboarded users (it
shouldn't — the backend's `UPDATE … WHERE onboarding_completed_at IS
NULL` is a no-op on refresh, and the activities are appended).

Optionally rename the page header copy for the menu-driven case ("Verzin
nieuwe activiteiten" instead of the welcome heading). Out of scope
unless trivial.

### 3.3 Ensure "Voeg activiteit toe" is discoverable

The menu already links to `/activities`. Verify the existing entry's
label phrasing reads as an invitation, not a list — e.g.
"Voeg activiteit toe" is more action-coded than "Mijn activiteiten".
Update the i18n key if needed.

### 3.4 LoginPage handles the upgrade case

In `frontend/src/pages/LoginPage.vue`:

- Read a query flag (e.g. `?mode=upgrade`) on mount.
- When `mode=upgrade` and `isAnonymous.value === true`, hide the
  "use without account" button (no longer relevant — the user is
  already device-authed) and submit the form via
  `POST /auth/upgrade` instead of `POST /register`.
- Success → `router.push('/suggest')` and refresh the user via
  `fetchMe()` so the menu re-renders without the upgrade entry.

The email/password login path (`?mode=login` or default) stays as it is
for returning users on fresh browsers.

### 3.5 Tests

- E2E or component test: anonymous user clicks "Maak een account" →
  fills form → ends up with `user.value.email` set, anonymous-only menu
  items disappear, activities are preserved (same `user_id`).
- Component test: menu renders "Maak een account" for anonymous, "Logout"
  for email users.
- Component test: menu's "Verzin activiteiten voor me" entry navigates
  to `/onboarding` and the page renders normally.

---

## Phase 4 — i18n strings

New Dutch strings in `frontend/src/locales/nl.json`:

- `menu.createAccount` — "Maak een account" (replaces logout entry for
  anonymous)
- `menu.generateActivities` — "Verzin activiteiten voor me" (or warmer
  variant — Yuna lens applies, see 002 open questions)
- `auth.upgrade` — "Account aanmaken" (page heading when in upgrade mode)
- `auth.upgradeButton` — "Opslaan"
- `auth.upgradeIntro` — "Je activiteiten blijven bewaard. We koppelen ze
  aan je e-mailadres zodat je ze op andere apparaten terugziet." (or
  similar — workshop the copy)

Update existing string `activitiesList.link` if its current phrasing
reads as a list rather than an action.

---

## Phase 5 — Verify end-to-end

Manual checklist against a local dev DB:

- [ ] Clear localStorage and cookies, open the app → lands on `/suggest`
      with the base library, no `/login` flash, no `/onboarding` redirect.
- [ ] Inspect DB: a new user row exists with `device_id` set, `email NULL`,
      `password_hash NULL`.
- [ ] Open the menu → "Maak een account" present, "Logout" absent.
- [ ] Click "Maak een account" → upgrade form → submit with valid
      email+password → land on `/suggest`, menu now shows "Logout" and
      no "Maak een account".
- [ ] Inspect DB: same `id` as before, `email` and `password_hash` now
      populated, `device_id` preserved. Activities and history intact.
- [ ] Open the menu → "Verzin activiteiten voor me" → 4-question form →
      generates activities → land on `/suggest` with new activities
      present.
- [ ] Visit `/activities` from the menu → CRUD form works (add, edit,
      delete an activity).
- [ ] Returning email user on a fresh browser → no session → device-auth
      runs → user can click "Maak een account" but the upgrade endpoint
      will 409 since they already have an email. (Or: they visit
      `/login` directly and use email/password to bind to their existing
      account. Confirm this flow still works.)
- [ ] Hit `DELETE /me` from an anonymous session → row removed, session
      cleared, next nav re-bootstraps as a *new* anonymous user.
- [ ] Network panel during boot shows exactly one of: `GET /me` (cached
      session) OR `GET /me` → 401 → `POST /auth/device`. Not both.
- [ ] Sentry user context populated for anonymous users (`user.id`
      present in scope).

---

## Risks and rollback

- **Boot regresses to a permanent loading state if `POST /auth/device`
  fails.** Mitigated by the defensive `/login` fallback in the router
  guard, but worth surfacing the error in the UI rather than spinning.
  Probably reuse the existing global error toast pattern.
- **Returning email users on a fresh browser get a confusing experience.**
  They land on `/suggest` as a *new* anonymous user without realising
  their old account exists. Mitigation: the "Maak een account" menu
  entry should also offer "Heb je al een account? Inloggen." — same
  page, just a toggle between login and upgrade modes.
- **Rollback path.** Restore the two redirect blocks in
  `frontend/src/router/index.ts` and revert `useAuth.fetchMe()` to its
  pre-PR form. No database changes to undo.

---

## Out of scope (follow-ups)

- **Contextual upgrade nudge.** After a user has accumulated N custom
  activities or AI-generated ones, prompt them to bind an email so they
  don't lose the data. Wait until the no-onboarding shape is live to
  pick the right trigger and copy.
- **Welcome card on first open.** Optional. A small dismissable card
  naming the two menu actions; could help Lisa-type users find them.
- **Drop `users.onboarding_completed_at` column.** Vestigial after this
  PR. Migrate away in a later cleanup once analytics confirms it's
  unused.
- **Mode 4 memory cold-start.** Without onboarding, Mode 4's per-user
  context is sparse until the user invokes "Verzin activiteiten voor
  me" from the menu. Probably fine per 001; revisit if Mode 4 ever
  becomes a primary use case.
- **001-priority follow-ups** that are not addressed here: quick-replies
  in Mode 4 chat, rethinking the stress scale, renaming the "Stress" tab.
- **`docs/plan/10-deployment-plan.md` Phase 0.4 cleanup** — tick the
  onboarding-related items off once this ships.
