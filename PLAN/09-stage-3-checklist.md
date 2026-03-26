# Stage 3 — Modes 1-3 (Frontend)

## Goal

Turn the API into a usable app. After this stage, a real person can log in
and use Unwind to get activity suggestions. This is the first real portfolio
milestone.

## Learning approach

Review-based learning continues from Stage 2. AI writes code in small chunks,
Noor reviews, AI asks 2-3 questions per chunk. Since this is Vue territory
(Noor's home turf), expect more "I'll write this myself" moments — that's
encouraged.

**Understand deeply:** component composition, reactive state for async data,
how the frontend talks to the API, the accept/skip tracking pattern.

**Lookup:** CSS tricks, animation specifics, vue-router API, vue-i18n API.

---

## Part A: Project foundation

### Step 1: Vue Router setup

Install `vue-router`. Create a router with these routes:

- `/` — redirect to `/suggest` (Mode 1 is the default)
- `/suggest` — Mode 1 (protected)
- `/stress` — Mode 2 (protected)
- `/counterbalance` — Mode 3 (protected)
- `/login` — login/register page (public)

Register the router in `main.ts`.

### Step 2: API client

Create a composable or utility (`src/api/client.ts`) that wraps `fetch` for
API calls. It should:

- Prepend the backend base URL
- Send credentials (cookies) with every request
- Parse JSON responses
- Handle common errors (401 → redirect to login, network errors)

### Step 3: Auth state composable

Create `src/composables/useAuth.ts`:

- Reactive state: `user` (null when logged out), `isLoggedIn` computed
- Functions: `login()`, `register()`, `deviceLogin()`, `logout()`, `fetchMe()`
- On app start, call `GET /me` to check for an existing session
- Expose whether the user is anonymous (has device_id but no email)

### Step 4: Auth pages

- Login page with email/password form + link to register
- Register page with email/password form + link to login
- Device auth: a "Gebruik zonder account" (use without account) button on the
  login page that triggers `POST /auth/device`
- After successful auth, redirect to `/suggest`

### Step 5: Route guards

Protected routes redirect to `/login` if not authenticated. The login page
redirects to `/suggest` if already authenticated.

**Known issue to solve here:** on page reload, `user` ref starts as `null`
(before `fetchMe()` finishes), so the guard briefly thinks the user is
unauthenticated and flashes the login page. Fix this — e.g. by having the
guard wait for `fetchMe()` to complete before deciding, or by using the
localStorage hint to assume logged-in until `fetchMe()` confirms or denies.

---

## Part B: Core interaction

### Step 6: Activities composable + client-side randomization

Create `src/composables/useActivities.ts`:

- Fetch the full activity list from `GET /activities` on login
- Store it in reactive state
- Provide filter functions: by stress level, by excluded categories
- Provide a `suggest()` function that picks one random activity from the
  (optionally filtered) list
- Track which activities have been suggested this session to avoid repeats
- Exclude activities the user has already accepted in the current session

Randomization lives client-side. This is simpler, avoids a round-trip per
suggestion, and prepares for offline mode in Stage 4 (where the same logic
runs against IndexedDB instead of reactive state).

### Step 7: Backend — usage event endpoint

Add `POST /usage-events`:

- Body: `{ activity_id, action, mode, stress_level_before? }`
- `action` is one of: `suggested`, `accepted`, `skipped`
- Records the event in the `usage_events` table
- Returns 201

### Step 8: Activity card component

The heart of the UI. A single card that shows:

- Activity title
- Description
- Suggested duration (e.g. "15 minuten")
- Category badges (Hoofd / Handen / Hart)
- Accept button (primary, large)
- Skip button (secondary)

Design principle: big touch targets, minimal text, one thing on screen.
Mobile-first.

### Step 9: Mode 1 — "Stel iets voor"

The default view. Contains:

- A "Suggest" button (or auto-suggests on load)
- The activity card (when a suggestion is loaded)
- Accept → records usage event, shows a confirmation, then resets
- Skip → records usage event, fetches next suggestion
- Empty state when no activities match

### Step 10: Mode 2 — "Ik ben gestrest"

Adds a stress level selector (1-5) before the suggestion flow:

- User picks their stress level
- Then the same card flow as Mode 1, filtered by `stress_level`
- The stress level is sent with the usage event

### Step 11: Mode 3 — "Balanceer mijn dag"

Adds a category picker:

- "Wat heb je vandaag veel gedaan?" — pick Head / Hands / Heart
- App suggests from a *different* category (the counterbalance)
- Same card flow, filtered by `exclude_categories`

---

## Part C: Navigation and polish

### Step 12: Mode switching

A simple nav element (bottom tabs or a minimal header) to switch between the
three modes. Mode 1 is the default. Keep it unobtrusive — the user shouldn't
feel like they're making a choice when they're stressed.

### Step 13: Theme presets + UnoCSS migration

Three themes via CSS custom properties: calm, warm, playful. User picks in a
small settings area. Store the choice in localStorage.

UnoCSS is installed and configured (uno.config.ts). This step should also:

- Migrate existing scoped CSS to UnoCSS utility classes across all components
- Define theme color tokens in uno.config.ts for each preset
- Evaluate whether repeated button patterns (stress-btn, category-btn, link-button)
  should be extracted into shared components once utility classes are in place

### Step 14: Loading, error, and empty states

- Loading spinner/skeleton while fetching
- Error message when the API is unreachable
- "Geen activiteiten gevonden" when filters match nothing
- "Je bent helemaal bijgewerkt!" (or similar) when all activities are
  exhausted

### Step 15: Mobile-first styling

The app must feel good on a phone viewport. Big buttons, readable text,
no horizontal scrolling. Test at 375px width.

---

## Part D: Tests

### Step 16: Backend integration tests

- Test `POST /usage-events` records correctly
- Test edge cases: invalid params, missing activity_id

### Step 17: Frontend tests

- Unit tests for the auth composable (mock API calls)
- Component test for the activity card: does accept/skip emit correctly?
- Test Mode 3 counterbalance logic: selecting "Head" should exclude Head
  activities

---

## Definition of done

- [ ] User can register, log in, or use device auth from the frontend
- [ ] Mode 1: tap → get suggestion → accept/skip → next
- [ ] Mode 2: pick stress level → filtered suggestions → accept/skip
- [ ] Mode 3: pick category done today → counterbalanced suggestions
- [ ] Accept/skip events recorded in usage_events table
- [ ] Mode switching works
- [ ] Three theme presets
- [ ] All strings go through vue-i18n (Dutch)
- [ ] App works on phone viewport (375px)
- [ ] Backend + frontend tests pass
- [ ] App is deployed on VPS
