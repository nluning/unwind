# Onboarding flag — from browser-scoped to user-scoped

**Status: implemented on branch `onboarding-flag-to-user-scoped`, ready for
review and merge. Two adjacent bugs surfaced during testing and were fixed
in the same PR (see "Bug fixes that came in scope" below).**

## What this document covers

Today, "has this user finished onboarding?" lives in `localStorage` under the
key `unwind-onboarding-done`. That has two bugs:

1. A returning user who logs in on a new device is forced through onboarding
   again, even though they already have a personalized activity list.
2. A brand-new user on a device where someone else already onboarded skips
   onboarding entirely and lands on an empty `SuggestPage`.

This plan moves the flag server-side so it belongs to the user, not the
browser. It also makes room for a future **"refresh my activities"** feature
that lets an existing user re-run the same intake form and get a new batch of
activities appended to their list.

Reference: Phase 0.4 of `docs/plan/10-deployment-plan.md` flagged this as a
known bug.

---

## Design decisions

- **One column, `onboarding_completed_at TIMESTAMPTZ NULL` on `users`.** First
  set, never overwritten. The router's gate is just `IS NULL`.
- **Refresh appends, never replaces.** New activities and (if consent is on)
  new memories are inserted alongside the existing ones. No deletes.
- **One generate endpoint, one rate-limit bucket.** `POST /onboarding/generate`
  serves both first-time and refresh. The handler stamps
  `onboarding_completed_at` only when it's currently NULL. The bucket
  changed from "3 total" to "3 per rolling 7 days" so a refresh isn't
  blocked by old initial-onboarding rows.
- **Skip is supported and persisted.** `POST /onboarding/skip` stamps the
  same column, so a user who opts out of intake doesn't get re-prompted
  on next session or on a different device. (Earlier plan draft cut skip
  entirely; reverted mid-implementation when the existing "Overslaan"
  button was rediscovered and the flow was kept as product behavior.)
- **`/me` is the source of truth.** The frontend learns the user's onboarding
  state from the session bootstrap call, not from `localStorage`. Auth
  responses (`/login`, `/register`, `/auth/device`) also include the field
  so the router gate works on the very first navigation after login.

What we are NOT doing here:
- No UI entry point for refresh. The endpoint supports refresh and the
  timestamp survives; the button/page is a follow-up. Existing users are
  backfilled by the migration (Phase 1.1).

---

## Phase 1 — Backend: column + endpoint behavior

### Why this phase matters

Without the column, there is nothing for `/me` to return and nothing for the
router to gate on. This phase is the one that actually fixes the bug; phase 2
is just the frontend catching up.

### 1.1 Add the column and backfill existing users

New migration `006_onboarding_completed_at.sql`:

```sql
ALTER TABLE users
ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- Backfill: anyone with AI-generated activities or onboarding-source
-- memories is already onboarded. Use their created_at so the timestamp
-- reflects reality (their session, not the moment we ran the migration).
UPDATE users
SET onboarding_completed_at = users.created_at
WHERE EXISTS (
  SELECT 1 FROM activities
  WHERE activities.user_id = users.id AND activities.source = 'ai'
)
OR EXISTS (
  SELECT 1 FROM user_memories
  WHERE user_memories.user_id = users.id
    AND user_memories.source = 'onboarding'
);
```

Nullable on purpose — `NULL` is the "not done yet" signal. The two
`EXISTS` clauses together cover all completed onboarding runs: the first
catches everyone (memory consent or not — activities are always inserted),
the second is a belt-and-braces guard in case any future code path writes
onboarding-source memories without activities.

### 1.2 Stamp the column on first completion

In `backend/src/routes/onboarding.ts`, inside the existing transaction (after
the activity/memory inserts, before `COMMIT`):

```sql
UPDATE users
SET onboarding_completed_at = now()
WHERE id = $1 AND onboarding_completed_at IS NULL
```

The `IS NULL` clause is the "first-completed, never overwritten" guarantee
enforced at the DB layer. Refresh runs go through the same code path; the
`UPDATE` is a no-op because the timestamp is already set.

### 1.3 Skip endpoint

New route `POST /onboarding/skip` in `backend/src/routes/onboarding.ts`.
Auth-gated, no rate limit, no body. Behavior: same `UPDATE ... WHERE id =
$1 AND onboarding_completed_at IS NULL` as the generate path. Returns 204.

Why a dedicated route instead of reusing `/onboarding/generate`: skip
doesn't call Claude, insert activities, or consume the weekly rate-limit
bucket. Bundling it would mean a special-case branch through the generate
handler and would burn a rate-limit slot for a one-line UPDATE.

### 1.4 Return the timestamp from `/me` and auth responses

Two places needed updating:

- **`validateSession`** in `backend/src/auth.ts` expanded to
  `SELECT users.onboarding_completed_at` and includes the field in the
  returned `user` object. Available everywhere `request.user` is. (While
  in there, SQL aliases `s`/`u` expanded to full table names per the
  no-single-letter rule.)
- **`sendAuthResponse`** in `backend/src/routes/auth.ts` and the
  `SELECT`/`RETURNING` clauses in `/login`, `/register`, `/auth/device`
  updated to include the column. **This was caught only after a bug
  report mid-implementation**: without it, the *first* response after
  login/register doesn't include the field, so a freshly registered
  user's `user.value.onboarding_completed_at` is `undefined` (not
  `null`), and the frontend's `=== null` check let them slip past the
  onboarding gate.

`FastifyRequest.user` in `backend/src/db/types.d.ts` widened to include
`onboarding_completed_at: Date | null` (pg driver parses TIMESTAMPTZ as
JS Date; Fastify JSON-serializes it to an ISO string on the wire, which
matches the frontend's `string | null` type).

Response shape:

```json
{ "id": "...", "email": "...", "onboarding_completed_at": "2026-05-11T..." | null }
```

### 1.5 Rate-limit window: `total` → `week`

In `backend/src/middleware/rateLimit.ts`:

- Extend the `window` union to `'day' | 'week' | 'total'`.
- Add a case: `window === 'week'` ⇒ `AND created_at >= now() - interval '7 days'`.
- Change the onboarding route's limiter from `{ window: 'total', maxRequests: 3 }`
  to `{ window: 'week', maxRequests: 3 }`.

Why a rolling 7 days instead of "this calendar week": calendar weeks reset on
a single day, so a user who burns three attempts on Sunday gets reset hours
later on Monday. Rolling matches "you can try again seven days after your
oldest attempt", which is what the cap is actually trying to express.

### 1.6 Tests

`tests/Integration/rateLimit.spec.ts`:
- Updated assertion: rate-limit message text changed (was `'maximaal'`,
  now `'limiet'` after the Dutch rephrase for the rolling window).
- New test: records older than 7 days don't count against the bucket.
  This required mocking `@anthropic-ai/sdk` in this file too so the
  admitted request doesn't hang on the real API.

New file `tests/Integration/onboarding.spec.ts` with Anthropic mocked via
`vi.hoisted` + `vi.mock`. Five tests:

1. Generate stamps `onboarding_completed_at` on first successful run.
2. Refresh (second generate) does **not** overwrite the timestamp.
3. Skip stamps the timestamp with zero activities/memories created.
4. Skip on an already-completed user is a no-op (timestamp unchanged).
5. Refresh appends activities (two runs → two rows, no replacement).

---

## Phase 2 — Frontend: read from `/me`, drop `localStorage`

### Why this phase matters

Until the router stops reading `localStorage`, the bug isn't fixed for end
users — the server knows, but the client ignores it.

### 2.1 Expose the field through `useAuth`

In `frontend/src/composables/useAuth.ts`:

- Extend the `User` interface with `onboarding_completed_at: string | null`.
- Add a computed `needsOnboarding = computed(() => user.value !== null && !user.value.onboarding_completed_at)`.
- Export `needsOnboarding`.

Note: the check is a **falsy** test (`!user.value.onboarding_completed_at`),
not strict `=== null`. That way a missing field (e.g., if a future auth
path forgets to include it) defaults to "yes, needs onboarding" — the
safer default for a gate. (The strict `=== null` version was the cause of
the new-user-skips-onboarding bug, see "Bug fixes that came in scope".)

### 2.2 Replace the router check

In `frontend/src/router/index.ts`:

```ts
// before
const onboardingDone = localStorage.getItem('unwind-onboarding-done') === 'true'

// after
const { needsOnboarding } = useAuth()

if (isLoggedIn.value && needsOnboarding.value && !isOnboardingRoute && !isPublic) {
  return { name: 'onboarding' }
}
```

`initialize()` is already awaited above this block, so `needsOnboarding` is
populated by the time we read it.

### 2.3 Update `OnboardingPage.vue`

- `handleGenerate` calls `await fetchMe()` after a successful response
  (replaces the old `localStorage.setItem('unwind-onboarding-done', 'true')`).
  This refreshes the cached `user` so the router's `needsOnboarding` gate
  flips before the user navigates away.
- `handleSkip` (kept — skip is a supported flow) now `await`s
  `POST /onboarding/skip`, then `fetchMe()`, then routes to `/suggest`.
  Error path surfaces `onboarding.error` like `handleGenerate`.
- No localStorage writes remain in this file.

### 2.4 Clean up the legacy key (deferred — TODO in code)

One-time cleanup so we don't leave dead keys in users' browsers. **Not
done in this PR.** A `TODO` comment is in place in `useAuth.ts`'s
`fetchMe` so future-us knows exactly where the line goes:

```ts
localStorage.removeItem('unwind-onboarding-done')
```

Add the line one release after this ships (so users who haven't reloaded
the SPA yet still don't lose their legacy state mid-session), then delete
the TODO. Low priority — the key is harmless if left behind.

---

## Phase 3 — Verify end-to-end

Manual checklist (do this against a local dev DB, not production):

- [ ] New user → onboarding flow → land on `/suggest`. Inspect DB:
  `onboarding_completed_at` is set, activities exist.
- [ ] Same user logs out, logs in on a different browser → goes straight to
  `/suggest`, no onboarding redirect.
- [ ] Brand-new user on the *same* browser as a previously-onboarded user
  → gets the onboarding redirect (covers Bug 1).
- [ ] After the previous step, the new user does not see the prior user's
  activities on `/suggest` or `/activities` (covers Bug 2).
- [ ] New user → click "Overslaan" on step 1 → land on `/suggest`, no
  activities yet, no onboarding redirect on next navigation.
- [ ] Hit `/onboarding/generate` four times in seven days → fourth call
  returns 429.
- [ ] Call `/onboarding/generate` a second time after onboarding completed →
  new activities appended, timestamp unchanged.
- [ ] Run the migration on a copy of production data, then run the dry-run
  count from the "Existing users" section → matches the number of users
  who actually completed onboarding.

---

## Bug fixes that came in scope

While testing the Phase 2 changes in a browser, two adjacent bugs surfaced.
They aren't strictly about onboarding, but they would have made this PR
look broken in production, so they were fixed in the same branch.

### Bug 1 — New users were not redirected to onboarding

**Symptom:** registering a new user on a browser that had previously hosted
a different session let the new user land straight on `/suggest`, skipping
the onboarding gate.

**Root cause:** `sendAuthResponse` in `backend/src/routes/auth.ts` only
sent `{ id, email }` in the response body. The new
`onboarding_completed_at` field was therefore `undefined` on the frontend's
`user` ref, not `null`. The original `needsOnboarding` computed used
`=== null`, which doesn't match `undefined` → gate let the user through.

**Fix:** auth routes (`/login`, `/register`, `/auth/device`) now `SELECT` /
`RETURNING` the column, `sendAuthResponse`'s type and payload include it,
and `needsOnboarding` uses a falsy check so a missing field doesn't bypass
the gate again.

### Bug 2 — New users inherited the previous user's activity list

**Symptom:** after user A logged out and user B logged in on the same
browser, user B saw user A's activities on `/suggest`.

**Root cause:** `useActivities.ts` declares `activities`, `loaded`, and
`error` as **module-level** `ref`s. They persist across user changes for
the lifetime of the SPA. Pages gate their fetch on `if (!loaded.value)`,
so after user A populated the cache, user B's `onMounted` skipped the
network call and rendered user A's data.

**Fix:** exported `resetActivitiesState()` from `useActivities.ts` and
called it from every user-change path in `useAuth.ts` (`login`,
`register`, `deviceLogin`, `logout`, `deleteAccount`). Also wired
`resetSuggestionFlowState()` into login/register/deviceLogin — it was
only called on logout/deleteAccount before, but the same module-level
leak applied.

Both fixes are covered by the existing auth integration tests (which
still pass) and were verified against the dev DB.

---

## Existing users

The backfill in Phase 1.1 catches anyone who already completed onboarding
(detected by AI-generated activities or onboarding-source memories) and
stamps their `onboarding_completed_at` to `created_at`. They will not see
the onboarding redirect after deployment.

Genuinely abandoned accounts (no AI activities, no onboarding memories,
never came back) are not backfilled. If they ever return they'll go through
onboarding, which is the desired behavior.

Verify the backfill on a copy of production data before running it for
real:

```sql
-- Dry-run: how many rows will be stamped?
SELECT COUNT(*) FROM users
WHERE EXISTS (
  SELECT 1 FROM activities
  WHERE activities.user_id = users.id AND activities.source = 'ai'
)
OR EXISTS (
  SELECT 1 FROM user_memories
  WHERE user_memories.user_id = users.id
    AND user_memories.source = 'onboarding'
);
```

---

## Out of scope (follow-ups)

- **Refresh entry point in the UI** — settings page or a "regenerate"
  button somewhere. The backend supports it after Phase 1; the UI is a
  separate piece of work.
- **`last_onboarding_refresh_at` column** — if/when we want to show "last
  refreshed on X" or rate-limit refresh separately from initial onboarding.
- **Legacy localStorage key cleanup** — the one-liner is described in
  Phase 2.4 and there's a `TODO` in `useAuth.ts` marking the spot. Land
  one release after this ships.
- **`docs/plan/10-deployment-plan.md` Phase 0.4 cleanup** — once this
  ships, tick the "Onboarding flag is browser-scoped" item off.
