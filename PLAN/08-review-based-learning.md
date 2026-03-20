# Review-based learning approach

## The idea

Instead of Noor writing code and asking AI for help when stuck, AI writes the
code and Noor reviews it. Understanding is verified through targeted questions
about the code — both conceptual ("why does this work?") and practical ("what
happens if you change X?").

**Trial run:** Stage 2 (Authentication). Evaluate afterwards whether this
produced real understanding or just pattern recognition.

## How it works

### 1. AI writes code in small chunks

Not a whole feature at once. One logical piece at a time — a migration, a
function, a route, a test. Each chunk is small enough to read in a few minutes.

### 2. Noor reviews before moving on

Read the code. No skimming. If something looks unfamiliar, say so before the
questions start — that's not failure, that's the point.

### 3. AI asks 2-3 questions per chunk

Questions fall into three types:

- **Why** — "Why do we hash the session token before storing it?" Tests
  conceptual understanding. The answer should be in your own words, not
  recited from the checklist.
- **What if** — "What happens if you remove the `httpOnly` flag from the
  cookie?" Tests whether you understand consequences, not just steps.
- **Trace** — "A user clicks login. Walk me through what happens from the
  request hitting the server to the cookie being set." Tests whether you can
  follow the flow through the code.

### 4. Wrong or incomplete answers are fine

That's signal, not failure. AI explains, then asks a follow-up to check it
landed. No moving on until the concept clicks.

### 5. Retention check on the next occurrence

When a pattern repeats (e.g. the second route that uses the auth middleware),
Noor predicts what the code will look like before seeing it. This is the real
test of whether review-based learning sticks.

## When to break the pattern

If Noor says "I could write this one myself" — do it. The review approach
isn't a rule, it's a default. Writing code when you feel ready is always
better than reviewing code you already understand.

## Evaluation criteria (after Stage 2)

- Can Noor explain the full auth flow (register → login → session → protected
  route → logout) without looking at the code?
- Can Noor predict what a new auth-related piece of code should look like
  before seeing it?
- Could Noor debug a broken session flow (e.g. "login works but /me returns
  401") by reasoning about where the problem might be?

If yes to all three: the approach works, keep it for Stage 3.
If not: adjust — maybe a mix of writing and reviewing.

## Session log

### Session 1 (2026-03-19)

**Chunks completed:**
1. Migration (`002_sessions.sql`) — reviewed
2. Auth utilities (`auth.ts`) — password hashing, session token gen, session CRUD — reviewed
3. Auth middleware (`middleware/auth.ts`) — reviewed
4. Auth routes (`routes/auth.ts`) — register, login, logout, /me — reviewed
5. Activity routes updated — added `preHandler: requireAuth`, scoped queries by user_id
6. Wiring in `app.ts` — cookie plugin + auth routes registered

**Still to do next session:**
- Type-check the project (was about to do this when we stopped)
- Write auth integration tests (`tests/auth.spec.ts`)
- Update existing activity tests to work with auth (register + login before each test)
- Run all tests, fix whatever breaks

**What worked well:**
- Prediction step (step 5 in the approach) landed: Noor correctly predicted
  how `preHandler: requireAuth` would be applied to activity routes before
  seeing the code.
- Security questions clicked — user enumeration, same error messages, 404 vs
  403 for other users' resources.

**Watch for next time:**
- Noor sometimes skips a step in traces (forgot the session creation between
  user insert and cookie). Worth asking traces again on a fresh session to
  see if it sticks.

### Session 2 (2026-03-20)

**Stage 2 completed:**
1. Type-check — passed after `npm install` (packages were in package.json but not installed)
2. Auth integration tests (`tests/auth.spec.ts`) — 14 tests, reviewed
3. Activity tests updated for auth — cookie in every request, user-owned activities for PUT/DELETE
4. Device-based auth (`POST /auth/device`) — reviewed
5. Account upgrade flow (`POST /auth/upgrade`) — reviewed
6. Tests for device + upgrade flows — 11 tests, reviewed
7. All 49 tests green, types clean

**Stage 3 started:**
8. Wrote `PLAN/09-stage-3-checklist.md`
9. Vue Router setup (`router/index.ts`) — routes, navigation guard, placeholder pages
10. Updated `main.ts` and `App.vue` for router

**Still to do next session:**
- Open trace question: unauthenticated user navigates to `/stress` — walk
  through the router, guard, redirect, and what renders
- Continue with Step 2 (API client) and Step 3 (auth composable)

**What worked well:**
- Review-based learning confirmed as the approach for Stage 3
- Noor predicted Stage 3 checklist well — caught the offline concern with
  server-side randomization before I did
- Session traces improved — didn't skip the session creation step this time
- Good design questions (shared device edge case, why not JWT)

**Watch for next time:**
- Routing is self-reported as complicated — ask more questions on this topic,
  especially traces through the navigation guard
- Noor sometimes explains intent ("login is always available") rather than
  mechanism (how `undefined === true` evaluates). Push for both.
