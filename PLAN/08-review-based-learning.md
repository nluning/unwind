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

(Logs cleared — sessions 1-3 covered Stage 2 completion and Stage 3 steps 1-2.)

### Session 4 (2026-03-23)

**Chunks completed:**
1. Stages 0-2 recap — tested via questions, identified areas to sharpen
   (CORS mechanism, SQL injection code/data separation, sliding expiration trigger)
2. Auth composable (`src/composables/useAuth.ts`) — written and reviewed
3. Router guard updated to use `useAuth()` instead of raw localStorage

**What worked well:**
- try/catch clicked for the first time through a real use case (fetchMe
  swallowing the 401 throw from api())
- Noor caught that the router guard still used localStorage — good attention
  to loose ends

### Session 5 (2026-03-24)

**Chunks completed:**
1. Step 4: LoginPage.vue — login/register toggle, device auth, error handling.
   Reviewed. All 3 questions answered (trace had a small mixup about
   handleDeviceAuth running alongside handleSubmit — corrected).
2. Step 5: Reload flash fix — `initialize()` singleton promise in useAuth,
   async router guard that awaits it. Reviewed. Both questions answered.
3. Step 6 (partial): Backend `GET /activities` updated to include categories
   via `array_agg` + `GROUP BY`. Reviewed. Both questions answered. Noor
   connected it to Laravel's `with()` eager loading — good transfer.
4. Step 6 (partial): `useActivities.ts` composable — fetch, filter by stress,
   filter by excluded categories, weighted random suggestion algorithm.
   Noor designed the weighting logic (base weight scales with max skips,
   history penalty, session penalty, floor of 1). Implementation written.

**Review questions (answered Session 6):**
- Trace: Brand new user, 20 activities, all `times_skipped: 0` → walked through,
  understood that maxSkips=0, every weight=1, effectively plain random.
- What if: Skipped 15 vs 1 → walked through, understood 15:1 ratio and floor behavior.

**Still to do:**
- Steps 12-15: Navigation, themes/UnoCSS migration, loading/error states, mobile styling
- Steps 16-17: Tests

**What worked well:**
- Noor drove the algorithm design for weighted suggestions — came up with
  the "scale base weight to max skips" idea independently
- Good connection between `array_agg` and Laravel's eager loading
- Chose option B (review-based) for auth pages since Vue forms wouldn't
  teach much new by hand

### Session 6 (2026-03-26)

**Chunks completed:**
1. Weighted picking review questions from Session 5 — walked through both,
   Noor needed the walkthrough (low-energy day) but confirmed understanding.
2. Step 7: `POST /usage-events` endpoint — schema validation, insert event,
   increment counter. Reviewed. All 3 questions answered (denormalization,
   schema validation safety for SQL interpolation, full trace).
3. Step 8: `ActivityCard.vue` — presentational component with props/emits.
   Reviewed. Q1 (why emit not call composable directly) needed a redirect
   — Noor initially thought session weight, corrected to reusability across
   modes. Q2 (v-if null) correct. Q3 (trace) correct.
4. Step 9: Mode 1 (SuggestPage) — suggestion flow wired to composable.
5. Step 10: Mode 2 (StressPage) — stress selector + filtered suggestions.
6. Step 11: Mode 3 (CounterbalancePage) — category picker + counterbalance
   filtering. Noor correctly spotted missing empty state (bug in Q1).
7. Refactor: extracted `useSuggestionFlow.ts` composable — shared state and
   logic across all three modes. Removed intermediate "Geef me een suggestie"
   button; watch on pool auto-suggests. Noor initiated this refactor.
8. UnoCSS installed and configured (uno.config.ts, vite plugin). Migration
   to utility classes deferred to Step 13 (themes). Noor chose UnoCSS
   (prior experience) over Tailwind/vanilla CSS.
9. Noor added Dutch i18n translations for all 20+ seed activities and
   categories, plus slug-based lookup with fallbacks in ActivityCard.
10. Fixed `noUncheckedIndexedAccess` TS errors in useActivities.ts.
11. Fixed single-char variable `n` → `level` in StressPage.

**Review questions answered:**
- Usage events: denormalization (correct), schema validation safety (mostly
  right — clarified that TS types erase at runtime, Fastify JSON Schema is
  the real guard), full accept trace (correct but needed frontend half filled in)
- ActivityCard: emit vs direct call (needed redirect), v-if null (correct),
  full trace from click to DB (correct)
- SuggestPage: skip-all behavior (initially confused pool refill with
  sessionAccepted filter — corrected), suggested events (good reasoning
  about unnecessary writes), accept trace (walked through)
- StressPage: computed vs ref (understood concept, needed concrete example),
  navigation/remount (walked through module vs function-level state)
- CounterbalancePage: empty state bug (caught it), watch auto-suggest
  (correct)

**What worked well:**
- Noor initiated the refactoring conversation — recognized duplication and
  proposed extracting shared logic before being prompted
- Good instinct on UX: removed unnecessary intermediate button, requested
  chip styling for meta, swapped button order
- Added full Dutch translations independently (i18n, activity slugs)
- Caught the empty-state bug in Mode 3 during review

**Watch for next time:**
- Step 12 (navigation) is next
- Button extraction deferred to Step 13 (UnoCSS migration)
