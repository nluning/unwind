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
- **An explicit-logout flag (`unwind-explicit-logout` in localStorage)
  suppresses the device-auth fallback.** Surfaced during implementation:
  without this, a logged-out email user who *reloads* the page would be
  silently device-auth'd back in (their `device_id` is still in
  localStorage), undoing the logout. The flag is set by `logout()`,
  cleared by any explicit auth action (`login`, `register`, `deviceLogin`),
  and read by `fetchMe()` to skip the device-auth fallback. A small
  router redirect sends `user === null + explicitly-logged-out` users
  to `/login` so they don't land on a protected page that 401s every
  fetch.
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
      await deviceLogin(getOrCreateDeviceId())
    } catch {
      // Device-auth itself failed (the server is unreachable). Leave
      // user.value null; pages render their own error state via the
      // existing StateError component when their fetches subsequently
      // fail. No redirect — `/login` would also fail to reach the
      // server, so sending the user there just shifts the failure to
      // a screen where they can do even less.
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

### 1.2 Remove the router redirects

In `frontend/src/router/index.ts`, drop all three redirect blocks:

```ts
// before
router.beforeEach(async (to) => {
  const { isLoggedIn, needsOnboarding, initialize } = useAuth()
  await initialize()

  const isPublic = to.meta.public === true

  if (!isPublic && !isLoggedIn.value) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isLoggedIn.value) {
    return { name: 'suggest' }
  }

  const isOnboardingRoute = to.meta.onboarding === true

  if (isLoggedIn.value && needsOnboarding.value && !isOnboardingRoute && !isPublic) {
    return { name: 'onboarding' }
  }
})
```

After:

```ts
// Auth bootstrap happens in initialize(): it either rehydrates an
// existing session or creates an anonymous device-scoped one. After
// it resolves, user.value is either populated (anonymous or email) or
// null because the server is unreachable. In the unreachable case
// pages render StateError; the router doesn't redirect.
router.beforeEach(async (to) => {
  const { user, initialize } = useAuth()
  await initialize()

  // An already-logged-in EMAIL user shouldn't see the login form again
  // — they should log out first. Anonymous users (email === null) can
  // pass through to /login because the page hosts the upgrade flow
  // they reach via the menu's "Maak een account" entry.
  if (to.name === 'login' && user.value?.email) {
    return { name: 'suggest' }
  }
})
```

Reasoning for each block:

- **Unauthenticated-route → `/login`** (dropped): `initialize()` now
  always tries to produce a session (cached or fresh device). The
  fallback to `/login` only triggered when *both* attempts failed,
  and in that case `/login` itself can't reach the server either.
  The redirect was shifting the failure to a screen with less context,
  not recovering from it.
- **Logged-in EMAIL user → `/login` → `/suggest`** (kept, narrowed):
  if a user has already bound an email account, sending them back to
  the login form is confusing — they should log out first. Anonymous
  users (`email === null`) legitimately visit `/login` from the menu's
  "Maak een account" entry to upgrade, so the redirect is now gated on
  `user.value?.email` rather than on `isLoggedIn.value`.
- **`needsOnboarding` → `/onboarding`** (dropped): onboarding stops
  being a gate. The page is reached from a menu action instead
  (Phase 3.2).

Keep the `onboarding: true` meta flag on the `/onboarding` route — it's
still read by `App.vue` (`showChrome` computed) to hide the `BottomNav`
and `UserMenu` chrome on that page. The router guard stops reading it
(onboarding is no longer a gate) but it still serves a chrome-hiding
purpose. Revisit when Phase 3.2 wires the page up as a menu action and
we can decide whether chrome should appear in that context.

### 1.3 Tests

**Use the project's `test` skill** at `.claude/skills/test/TEST.md` — invoke
it when starting test writing so the conventions (AAA structure, "should"
naming, behavior-not-implementation framing, 3-6 tests per composable,
inline mocks instead of `beforeEach`) are loaded into context.

Tests live in `frontend/tests/composables/useAuth.spec.ts` (extend the
existing file) and `frontend/tests/router.spec.ts` (new — or co-locate
with another existing router test if one exists).

`useAuth` composable tests — behavioral framing:

- **should give a new visitor an anonymous session on first boot** —
  Arrange: `vi.mocked(api).mockRejectedValueOnce(new ApiError(401))`
  for `/me`, then `mockResolvedValueOnce({ id, email: null, ... })` for
  `/auth/device`. Act: call `initialize()`. Assert: `isLoggedIn.value`
  is true and `user.value.email` is null.
- **should reuse an existing session without creating a new device user** —
  Arrange: `/me` resolves with an existing user. Act: call `initialize()`.
  Assert: `api` was called exactly once (no `/auth/device` call).
- **should leave the user unauthenticated when the server is unreachable** —
  Arrange: both `/me` and `/auth/device` reject. Act: call `initialize()`.
  Assert: `user.value === null` and `isLoggedIn.value === false`. (This
  is the case where pages render `StateError`, see Phase 1.2.)
- **should persist the device_id across boots so the same anonymous user
  is rehydrated** — Arrange: localStorage already has `unwind-device-id`.
  Act: trigger the device-auth path. Assert: `vi.mocked(api)` was called
  with that exact id in the body.

Router guard tests — verify the redirect blocks are gone:

- **should resolve /suggest for an anonymous user without redirecting** —
  Arrange: mock `useAuth` to return an anonymous user. Act: navigate to
  `/suggest`. Assert: the resolved route name is `'suggest'`, not
  `'login'`.
- **should not redirect to /onboarding when onboarding is incomplete** —
  Arrange: mock `useAuth` with `needsOnboarding.value === true`. Act:
  navigate to `/suggest`. Assert: the resolved route name is `'suggest'`,
  not `'onboarding'`.

Skip the "should let an anonymous user visit /login" case unless it's
free — it's just verifying the absence of a guard, which the two tests
above already cover.

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

- Read `?mode=upgrade` from `route.query` on mount; initialise an
  internal `mode` ref to one of `'login' | 'register' | 'upgrade'`.
- The heading, submit button label, autocomplete hint, and submit
  handler all branch on `mode`. The toggle between login/register stays
  the same as before — upgrade mode also toggles to login mode so a
  returning user with an existing email account has an escape hatch.
- In upgrade mode, hide the "Gebruik zonder account" device-auth
  button — the user is already device-authed, so the button would
  either be a no-op or reattach them to their current session.
- Show a one-line `auth.upgradeIntro` above the form in upgrade mode
  explaining that existing activities and preferences are preserved.

The upgrade itself runs through a new `upgrade()` function on
`useAuth` that calls `POST /auth/upgrade` and merges `{ id, email }`
into the existing user object — no `/me` round-trip needed, because
the upgrade endpoint only mutates `email` and `password_hash`,
preserving `id`, `device_id`, and `onboarding_completed_at`. (Verified
by the existing "preserves the same user id after upgrade" backend
test.)

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

- [x] Clear localStorage and cookies, open the app → lands on `/suggest`
      with the base library, no `/login` flash, no `/onboarding` redirect.
- [x] Inspect DB: a new user row exists with `device_id` set, `email NULL`,
      `password_hash NULL`.
- [x] Open the menu → "Maak een account" present, "Logout" absent.
- [ ] Click "Maak een account" → upgrade form → submit with valid
      email+password → land on `/suggest`, menu now shows "Logout" and
      no "Maak een account".
- [x] Inspect DB: same `id` as before, `email` and `password_hash` now
      populated, `device_id` preserved. Activities and history intact.
      -> didnt check everything but should be fine.
- [ ] Open the menu → "Verzin activiteiten voor me" → 4-question form →
      generates activities → land on `/suggest` with new activities
      present.
- [x] Visit `/activities` from the menu → CRUD form works (add, edit,
      delete an activity).
- [ ] Returning email user on a fresh browser → no session → device-auth
      runs → user can click "Maak een account" but the upgrade endpoint
      will 409 since they already have an email. (Or: they visit
      `/login` directly and use email/password to bind to their existing
      account. Confirm this flow still works.)
- [ ] Hit `DELETE /me` from an anonymous session → row removed, session
      cleared, next nav re-bootstraps as a *new* anonymous user.
- [x] Network panel during boot shows exactly one of: `GET /me` (cached
      session) OR `GET /me` → 401 → `POST /auth/device`. Not both.
- [ ] Sentry user context populated for anonymous users (`user.id`
      present in scope).
      -> not sure. how to check?

---

## Risks and rollback

- **Boot when `POST /auth/device` fails.** `fetchMe()` sets `user.value
  = null` and the router lets pages render. Pages like `SuggestPage`
  catch their own fetch 401s and render `StateError` with a retry
  button — strictly better than a permanent loading state. Caveat: the
  page-level retry calls `fetchActivities()`, not `initialize()`, so a
  retry doesn't re-attempt device-auth. The user has to reload the page
  to recover. Acceptable for now (server-unreachable-during-boot is
  rare and reload is a natural recovery path), but a follow-up could
  wire the retry to also re-run `initialize()` so reload isn't needed.
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
