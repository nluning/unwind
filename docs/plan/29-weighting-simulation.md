# Suggestion weighting — simulation plan

**Status: PLANNED (2026-10-29).** **Ticket:** #120.

## Why

`frontend/src/composables/suggestionWeighting.ts` decides which activity
"Verras me" suggests: a weighted random pick where accepts raise an activity's
weight, skips lower it, the shared base library fades as the user's own pool
grows ("the inversion", plan 20 §3 / plan 21 Phase 2), and already-seen or
already-accepted activities are damped within a session.

`tests/composables/suggestionWeighting.spec.ts` covers each rule in isolation
(neutral weight, sub-linear accept boost, skip decay, base fade, session
penalties, floor, deterministic pick). What nothing answers is **how the rules
behave together over many picks and many days**. This plan builds a simulation
to answer that, without touching production code or real users.

## Questions the simulation must answer

1. **Fade speed.** How quickly does the base library stop being suggested as the
   user's own pool grows? Is `BASE_FADE_K = 10` the right feel?
2. **Accept boost.** Does `1 + √accepted` give favourites a visible but not
   dominating share? Do a few early accepts lock in ("rich get richer") over
   weeks?
3. **Skip penalty.** How hard does `÷ (1 + skipped)` bury an activity? When (if
   ever) does the `MIN_WEIGHT` floor actually bind?
4. **Repetition within a session.** With soft session penalties (÷10 accepted,
   ÷3 suggested) and small libraries, how soon do repeats appear and does the
   session degrade into the same few cards?
5. **Filtered pools.** `useActivities.suggest(pool)` computes `ownCount` from
   the pool it is *given*. When a page filters the pool first (category, stress),
   the base fade is computed on the filtered subset, not the whole library. Does
   that change the base/own mix noticeably? (A suspected quirk, not yet verified.)

## Setup

- **Script:** `frontend/scripts/simulate-weighting.ts` — a dev tool, outside
  `src/` so it is not part of the Vite build. Run with
  `node scripts/simulate-weighting.ts` (Node 24 strips types natively; the
  module only has an `import type`, which is erased). Add an npm script
  `simulate:weighting`.
- **Imports only** `computeWeight`, `pickWeighted` and the exported constants.
  It does *not* import `useActivities` (that drags in the API client and Vue
  refs); the session loop re-implements `suggest()` / `markAccepted()` /
  `resetSession()` as ~10 lines over two `Set`s, mirroring `useActivities.ts`.
- **Seeded PRNG** (mulberry32) passed as the `random` argument of
  `pickWeighted`, so every run is reproducible and parameter settings are
  directly comparable.
- **Output:** console tables; optional CSV to a scratch folder for graphing.
- **Realistic pool shape:** the seed library has **27 base activities**
  (`backend/src/db/seed.sql`). Own activities now arrive one at a time (manual
  add, accepted AI suggestions of `suggest-from-list`, saved
  `suggest-from-answers` results — there is no bulk starter batch any more), so
  own-pool sizes of **0, 3, 10, 25, 50** cover a new user to a long-time user.

## Part 1 — Monte Carlo of single picks

Pool builder `makePool({ base, own, accepted, skipped })` creates synthetic
`Activity` objects. Experiments use an empty session state so only long-term
weights show; ~100,000 picks each.

| # | Question | Sweep |
|---|---|---|
| 1a | Fade speed | 27 base + own ∈ {0, 3, 10, 25, 50}, all neutral (0 accepts, 0 skips): share of picks that are base vs own |
| 1b | Accept boost | one activity with accepted ∈ {0, 1, 4, 9, 25, 100} among 20 neutral ones: its pick probability vs uniform 1/21 |
| 1c | Skip penalty | same, skipped ∈ {0, 1, 3, 10, 30, 100}: pick probability, and whether the floor binds |
| 1d | Interaction | grid of accepted × skipped for one activity (e.g. 9 accepts + 9 skips) |
| 1e | Sensitivity | repeat 1a with `BASE_FADE_K` ∈ {3, 10, 30} (see Decisions) |

### Self-check: analytic expectations

For neutral activities the empirical shares must match `weight ÷ total`. A
mismatch beyond sampling error (3σ ≈ 0.5 percentage points at 100k picks) means
a bug in the picker or in the script, so these double as a correctness test.

**1a — base share of picks** (27 neutral base, `n` neutral own, base weight
`10 / (10 + n)`):

| own `n` | base share |
|---|---|
| 0 | 100% |
| 3 | 87.4% |
| 10 | 57.4% |
| 25 | 23.6% |
| 50 | 8.3% |

**1b — probability of one activity with `a` accepts among 20 neutral ones**
(weight `1 + √a`): a=0 → 4.8%, 1 → 9.1%, 4 → 13.0%, 9 → 16.7%, 25 → 23.1%,
100 → 35.5%.

**1c — same with `s` skips** (weight `1 / (1 + s)`): s=1 → 2.4%, 3 → 1.2%,
10 → 0.45%, 30 → 0.16%. The `0.01` floor only binds below weight 0.01, i.e.
about 100 skips on an own activity, or far fewer on a heavily faded base one.

## Part 2 — Simulated sessions with a scripted user

A session loop calls `pickWeighted` the way `suggest()` does, records the pick in
`suggested`, asks a user model for accept/skip, and on accept adds to `accepted`.
Persistent counts (`times_accepted` / `times_skipped`) optionally update between
sessions for the multi-day runs.

**User models** (`activity → 'accept' | 'skip'`):
- random acceptor, p ∈ {0.2, 0.5}
- category lover (high accept rate for one category, low for the others)
- picky user (accepts only own activities, skips base)
- always-skip (worst case, shows exhaustion behaviour)

**Metrics**, averaged over ~1,000 sessions per scenario:
- repeat rate by pick index, time to first repeat, distinct activities seen in
  10 / 20 / 30 picks
- base vs own share over the session
- **small libraries** (5, 10, 30 activities): does the session degenerate into
  repeats once everything has been seen?
- **multi-day mode**: 30 days × 1 session/day with counts carried over; share of
  picks going to the top 3 activities (lock-in), and how the base share decays as
  the user accepts and adds
- **filtered pool variant** (Q5): the same scenarios with the pool pre-filtered
  to one category, compared with the unfiltered run

## Output and write-up

Findings go in a **Results** section appended to this plan (tables for each
experiment, a sentence per question, and any parameter recommendation). If a
constant looks wrong, the change is a separate ticket and PR, not part of this
work.

## Order of work

1. Seeded PRNG, `makePool`, table printer.
2. Part 1, experiments 1a–1d, checked against the analytic tables above.
3. Part 2 single-session scenarios, then multi-day and filtered-pool variants.
4. 1e, once the parameter decision below is made.
5. Run everything, write Results, add the `simulate:weighting` npm script.

## Decisions (open)

- **`BASE_FADE_K` sweep (1e).** Either add an optional parameter to
  `computeWeight` / `pickWeighted` (touches production code, tiny, keeps the
  script honest) or keep a script-local copy of the formula (no production
  change, can drift). Not decided.
- **Commit the script or keep it local.** In-repo makes the experiment
  repeatable after any future tuning; local avoids carrying a dev tool.
- **Lint/type-check scope.** Confirm `scripts/` is covered (or deliberately not)
  by the frontend tsconfig and `lint:check` before committing the script.

## Out of scope

Real-user methods (production logging, A/B against uniform random, tester
sessions, review-panel personas) were considered and are deliberately not part of
this plan; they can follow once the simulation shows what is worth testing.
