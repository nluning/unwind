# Jouw activiteiten restructure — implementation tasklist

**Status: implementation plan, derived from `20-jouw-activiteiten-restructure.md` (2026-06-11).**
**Reads on top of:** plan 20 (confirmed scope), report `007-jouw-activiteiten-restructure.md` (panel),
plan 19 (superseded where it conflicts), ADR-006 (model strategy), ADR-007 (offline-first),
ADR-012 (device-first auth / menu-as-opt-in).

This file translates plan 20 into concrete, reviewable chunks against the current
codebase. Each chunk is sized to the AI-collaboration workflow (a migration, a route,
a composable — not a whole feature) so it can be reviewed with why/what-if/trace
questions before the next one starts.

---

## Current-state assessment (what already exists)

Read this before estimating — a good chunk of plan 20 is already built and just needs
re-wiring, not net-new work.

| Plan 20 item | Current state in code | Work needed |
|---|---|---|
| **#1 Self-add** | **Fully built.** `ActivitiesListPage.vue` has create/edit/delete form (`title`, `description`, `suggested_duration`, stress range, categories) backed by `POST/PUT/DELETE /activities`. | Mostly copy + menu placement. Maybe simplify the form (item: "self-add form shape TBD"). |
| **#2 + #5 Tappable Q&A → 1 suggestion (tap-only)** | Does not exist as such. The mode4 chat (`ChatPage.vue` / `useChat.ts`) is free-text streaming — the opposite of what's wanted. Closest reusable parts are `OnboardingPage.vue`'s tappable pill components. | New flow. Reuse onboarding's pill components; new backend generate endpoint. Must be **tap-only** — do **not** reuse the free-text chat UI. |
| **#2 Analyse-fit → 3 suggestions** | Does not exist. Onboarding generates 10–15 from a form; no "riff on my list" route. | New flow + new backend endpoint. |
| **#3 Inversion** | `GET /activities` already returns base (`user_id IS NULL`) + user's own. Suggestion picking is **frontend** in `useActivities.ts` (`weightedPick`/`getWeight`), weighting only on `times_skipped` + session penalty. | Change the weighting so user/ai + most-accepted rise and base fades as the pool grows. |
| **#4 "About me" field** | **Already exists.** The memory section in `AccountPage.vue` ("Wat Unwind over je weet") is this surface: a free-text add-memory textarea + editable list, backed by `user_memories`. These facts already inject into AI prompts via `getUserContext()`. | None — covered. New routes inherit it for free by calling `getUserContext()`. |
| **#6 Creativity calibration** | `buildSystemPrompt.ts` BASE_PROMPT says "Be creative and think outside the box"; onboarding prompt says "Be creative … fresh, surprising". | Rewrite both prompts to anchor-to-register + familiar/adjacent default mix. |
| **Drop other ontdekkingsroutes** | Menu (`UserMenu.vue`) `groupModes` lists suggest/stress/counterbalance/chat. Routes all live in `router/index.ts`. | Remove the three from the menu; keep routes + code behind a no-UI hook. |

**Existing AI plumbing to reuse:** `getUserContext()` in `buildSystemPrompt.ts` already
pulls memories + `frequentlyAccepted` + `frequentlySkipped` + `doneToday` — exactly the
signal both new routes need. `parseActivity.ts` + `toCreatePayload()` already turn an
AI JSON activity into a `POST /activities` payload. `createRateLimiter` + `api_usage`
already exist for cost control.

---

## Decisions to lock before building

Plan 20's "Open / undecided" items were mostly **copy** and **shape** decisions that gate
the build. All now settled.

**All resolved (2026-06-11):**

1. **AI model for the new generate routes → Sonnet** (`claude-sonnet-4-6`), matching onboarding's
   Dutch-quality reasoning (ADR-006 / the 2026-04-23 revert), not Haiku.
2. **"About me" field (#4) → already exists** — the AccountPage memory section. No new work.
3. **After-activity "dit hielp" signal → out of scope** for this round.
4. **Menu copy (load-bearing — report 007 §Convergentie).** The three labels under
   *Jouw activiteiten*:
   - Self-add → **"Iets toevoegen aan mijn lijst"**
   - Q&A → **"Drie vragen, één suggestie"** (was "Vier vragen" — kort/lang dropped 2026-06-12, decision 7)
   - Analyse-fit → **"Suggesties op basis van mijn lijst"**
5. **Self-add form shape (#1).** Keep title + category; make duration/stress optional with sane
   defaults — the depleted user shouldn't fill 5 fields.
6. **Swipe-up gestures → defer.** Ship after the restructure (plan 20 §sequencing puts it last;
   `user_hidden_activities` already supports the hide half cheaply later).
7. **Q&A questions (#5).** Three concrete tap-questions: **binnen/buiten · alleen/met iemand ·
   rustig/actief**. No emotional ones. (kort/lang dropped 2026-06-12 — the only question that asks
   the depleted user to *forecast* a duration rather than report current state; ND time-blindness
   makes it the one cognitively-loaded tap. Short/low-effort is the safe depletion-moment default
   anyway, and rustig/actief + accept-history already proxy capacity. Menu label reworded to
   "Drie vragen, één suggestie".)
8. **Inversion location (#3) → frontend** `weightedPick` — that's where suggestion selection
   already lives and it keeps Verras me offline-capable (ADR-007).

> Nothing left to settle — everything below is buildable.

---

## Phase 0 — Menu restructure + copy (no AI, no schema)

Ship the navigation shape first so the rest has a home. Low-risk, high-clarity.

- [ ] **0.1 — Menu groups.** In `UserMenu.vue`, collapse `groupModes` to *Verras me* only. no h3 header if there is only one mode. 
      Replace `groupLibrary` with a *Jouw activiteiten* section listing the three add-options
      (two are placeholder links until their pages exist). Remove stress/counterbalance/chat
      links. Keep Account/Privacy group as-is.
- [ ] **0.2 — Route hook (no UI).** Leave `/stress`, `/counterbalance`, `/chat` routes in
      `router/index.ts` but unlinked (the "future setting to re-enable" hook from plan 20 §1).
      `/onboarding` is also orphaned by this restructure (its menu entry "Verzin activiteiten
      voor me" is replaced by the three add-options) — but **keep the page**: Phase 5 reuses its
      pill components (`OnboardingOptionPills` / `OnboardingStepHeader` / `OnboardingStepActions`).
      Add a code comment on each orphaned route pointing at plan 20 §1 so the next reader knows
      they're intentionally orphaned, not dead.
- [ ] **0.3 — Copy into `nl.json`.** Add the locked menu labels (decision 4) under a new
      `jouwActiviteiten` namespace; retire `menu.generateActivities`. (Note: `nl.json` already
      has a stray edit in the working tree — fold it in.)
- [ ] **0.4 — Verify.** `/suggest` is still the home redirect; menu renders; orphaned routes
      reachable by URL but not by UI.

**Review focus:** *Why* keep the routes but drop the links? (separates "not on critical path"
from "deleted"; ADR-012 framing of menu-as-opt-in.)

---

## Phase 1 — Creativity calibration (#6) — prompt-only, no schema  ✅ DONE

Do this before the new AI routes so they're born with the right prompt. Pure prompt work,
cheap to review, and it shapes both new endpoints.

> **Note (2026-06-11):** the chat (`buildSystemPrompt.ts`) and onboarding
> (`onboardingPrompt.ts`) prompts are both for **orphaned flows** and carry assumptions that
> don't fit the new routes — the chat prompt is *interactive* (AI asks questions, "max
> exchanges = 10"); the onboarding prompt generates a **10–15** batch. The new routes do
> neither: the Q&A questions are UI tap-targets (the AI never asks), and counts are 1 / 3.
> So the **only durable Phase 1 output is the shared `CREATIVITY_GUIDANCE` constant**. The
> Phase 4/5 prompts are **purpose-built** (see those phases), NOT derived from chat/onboarding.

- [x] **1.1 — Drop "be creative / think out of the box."** Removed from `buildSystemPrompt.ts`
      and `onboardingPrompt.ts`; replaced with register-anchoring + lean-familiar/adjacent +
      cold-start guard (report 007 addendum §Synthesis).
- [x] **1.2 — Shared prompt fragment.** `backend/src/routes/creativityGuidance.ts` exports
      `CREATIVITY_GUIDANCE`. Count-agnostic core; batch routes add a count-specific tilt.
- [x] **1.3 — Tests.** `tests/Unit/creativityGuidance.spec.ts` — guidance present in both
      prompts, old "creative / fresh, surprising" directives gone. 6 tests, passing.

**Review focus:** *What if* the user's list is empty/tiny — what register does the AI anchor to?
(Cold-start: fall back to familiar/doable, not too divergent. Ties to Jeroen's "don't tell me to
add more first" and the avg/IQ lens.)

---

## Phase 2 — The inversion (#3) — the load-bearing piece

Plan 20 calls this the success criterion for the whole restructure (report 007: without it
this is "just menu rearranging"). Do it before the add-options so there's a payoff to adding.

- [x] **2.1 — Fade rule (locked).** Each candidate gets a multiplicative weight:

      ```
      weight(a) = (1 + sqrt(a.times_accepted))   // accepted favorites rise; sqrt caps dominance
                  / (1 + a.times_skipped)         // skips decay it (never negative)
                  * sourceFade(a)                 // ← THE INVERSION
                  * sessionFade(a)                // avoid repeats within a session

      sourceFade(a) = a.source === 'base' ? K / (K + ownCount) : 1     // K = BASE_FADE_K = 10
      sessionFade(a) = acceptedThisSession.has(a.id)  ? 1/10           // accept = stronger penalty
                     : suggestedThisSession.has(a.id) ? 1/3            // shown = soft penalty
                     : 1
      ownCount      = # of non-base activities in the user's pool

      final = max(MIN_WEIGHT, weight)             // MIN_WEIGHT = 0.01, never extinct
      ```

      **Session state is two penalties, not a filter** (decided 2026-06-11): accepting an
      activity does NOT exclude it for the session — it's down-weighted ÷10 (vs ÷3 for merely
      shown). Accept takes precedence over suggested (no ÷30 stacking). Rationale: a hard
      exclusion can starve a small library into "exhausted" and contradicts the soft/floored
      philosophy; a strong penalty keeps a just-done activity rare-this-sitting but lets a
      favorite resurface in a long session and return boosted next session.

      - **Fresh user** (ownCount 0): `sourceFade = 10/10 = 1` → base at full weight, current behaviour.
      - **Growing pool**: base fades smoothly — half weight at 10 own activities, ~0.2 at 40 —
        while own + most-accepted items keep weight 1+. So "Verras me" tilts toward the own list.
      - **Junk own list** (big but all-skipped): each junk item decays to ~`1/(1+skips)`, and faded
        base (~0.2) out-weighs it again — base recovers relative to junk, as it should.
      - `MIN_WEIGHT` floor keeps every activity *possible* (variety), just rare when down-weighted.
      - `K` and the curve are tunable constants, not magic — documented in the module.
- [x] **2.2 — Implement.** Extracted the pure algorithm to `composables/suggestionWeighting.ts`
      (`computeWeight` / `pickWeighted`, injectable `random` for deterministic tests); `useActivities.ts`
      calls it. ownCount computed from the full pool in `suggest()`.
- [x] **2.3 — Surface the signal.** Added `times_accepted` to the `Activity` type; `GET /activities`
      already projects it (`activity.*`); `createActivity` seeds it to 0.
- [x] **2.4 — Tests.** `composables/suggestionWeighting.spec.ts` — fresh-user vs. grown-pool fade,
      accept-boost, skip-decay, junk-list recovery, session penalty, deterministic pick.

**Review focus:** *Trace* one `suggest()` call for (a) a fresh user and (b) a 3-month user with
40 own activities — show how the same code yields starter-heavy vs. own-list-heavy output.
*What if* the user has a big list but it's all skipped junk — does base correctly come back?

---

## Phase 3 — "About me" field (#4) — ALREADY EXISTS, no build

The AccountPage memory section ("Wat Unwind over je weet") is the plan-20 #4 surface:
free-text add-memory textarea + editable list, backed by `user_memories`, and these facts
already inject into the prompt via `getUserContext()`. The new routes inherit it the moment
they call `getUserContext()` (Phases 4/5 already do).

- [ ] **3.1 — Verify only.** Confirm the new routes' `getUserContext()` call surfaces these
      memories in the prompt, and that `memory_enabled = false` users degrade gracefully
      (suggestions still work from accept/skip history — plan 20 §4 "optional, never gating").

No migration, no new endpoint, no new UI.

---

## Phase 4 — Analyse-fit route → 3 suggestions (#2c)

Simpler of the two AI routes (no question flow), and it's the one every persona endorsed
(report 007: Eline's catalyst, Jeroen's observation-data route). Build it first of the two.

- [x] **4.1 — Backend `POST /activities/suggest-from-list`.** New `routes/generate.ts` + pure
      `routes/suggestFromListPrompt.ts`. Pulls `getUserContext()` + the user's own added activity
      titles; **purpose-built prompt** (structured context, no questions); `SUGGESTION_COUNT = 3`;
      imports `CREATIVITY_GUIDANCE` + the 1-familiar/2-adjacent tilt. Sonnet, `max_tokens: 1024`.
      Rate-limited 10/day (`createRateLimiter`, endpoint `suggest_from_list`). Migration
      `008_api_usage_suggest_from_list.sql` extends the `api_usage` endpoint CHECK.
- [x] **4.2 — Drafts are not auto-saved.** Route returns ephemeral drafts; persists nothing
      (integration-tested). Client saves chosen ones via `POST /activities`.
- [x] **4.2b — Provenance (fixed 2026-06-11).** `POST /activities` now accepts an optional
      `source` (`'user'` | `'ai'`, default `'user'`, `'base'` rejected). `toCreatePayload` tags
      AI-saved activities `'ai'`, self-add stays `'user'`. So generated-then-saved items are
      distinguishable in the data (the inversion already treats both as non-base). Tested.
- [x] **4.3 — Frontend page/flow.** `SuggestFromListPage.vue` + `useSuggestFromList.ts`, route
      `/suggest-from-list`, menu placeholder flipped live. Intro → explicit "Toon suggesties"
      (never auto-spends a call), then 3 cards with one-tap "Toevoegen aan mijn lijst" (reuses
      `toCreatePayload` + `createActivity`), a "Nieuwe suggesties" regenerate, and 429/error
      states. Bounded at 3, no "toon meer". The quickSuggest menu entry stays a placeholder (Phase 5).
- [x] **4.4 — Empty/cold-start handling.** `buildSuggestFromListUserMessage` returns a cold-start
      instruction when there's no register — asks for low-effort suggestions, never "add more first".
- [x] **4.5 — Tests.** `tests/Unit/suggestFromList.spec.ts` (parse, ≤3 cap, under-generate,
      malformed-filter, cold-start message) + `tests/Integration/suggestFromList.spec.ts`
      (returns drafts, no-persist, cold-start prompt, 502 on garbage, 10/day limit, auth). All pass.

**Review focus:** *What if* Claude returns 2 or 5 activities — how does the route enforce 3?
*Why* are drafts ephemeral instead of saved-then-deleted?

---

## Phase 5 — Tappable Q&A route → 1 suggestion (#2b, #5)

The make-or-break route per report 007 (modality is the risk). **Tap-only, concrete questions,
no free text, no emotional questions.** Build after analyse-fit since it shares the generate
backend pattern.

- [x] **5.1 — The 3 questions** (decision 7, locked): **binnen/buiten · alleen/met iemand ·
      rustig/actief**. Concrete, tappable, no "hoe voel je je?". (kort/lang dropped 2026-06-12.)
      Each question offers a third "maakt niet uit" pill that skips the dimension.
- [x] **5.2 — Backend `POST /activities/suggest-from-answers`.** `routes/suggestFromAnswersPrompt.ts`
      (purpose-built prompt: AI never asks, returns **1** activity; the 3 answers arrive as
      structured "right now" constraints layered on `getUserContext()`; reuses `CREATIVITY_GUIDANCE`).
      Route added to `routes/generate.ts`, Sonnet, `max_tokens: 1024`, rate-limited 10/day
      (endpoint `suggest_from_answers`). Migration `009_api_usage_suggest_from_answers.sql` extends
      the `api_usage` CHECK. Returns an ephemeral draft — persists nothing.
- [x] **5.3 — Frontend flow.** `QuickSuggestPage.vue` + `useSuggestFromAnswers.ts`, route
      `/quick-suggest`, menu placeholder flipped live. Reuses `OnboardingOptionPills` /
      `OnboardingStepHeader` (now takes a `total` prop) / `OnboardingStepActions` for the question
      screens with first-pass auto-advance. Tap-only — does not touch `ChatPage`/`useChat`.
- [x] **5.4 — Result actions.** Single suggestion card with "Doe dit nu" (calm confirmation via
      `SuggestionAccepted`, no recording — the draft has no id) and "Toevoegen aan mijn lijst"
      (`toCreatePayload` + `createActivity`), plus an "Andere suggestie" regenerate. Calibrated tone.
- [x] **5.5 — Tests.** `tests/Unit/suggestFromAnswers.spec.ts` (answer→prompt mapping, skip-omits,
      history-layering, single-activity parse incl. bare object, cold-start) +
      `tests/Integration/suggestFromAnswers.spec.ts` (1 activity, constraint mapping, skip-all
      cold-start, no-persist, enum 400, 502 on garbage, 10/day limit, auth). 19 tests, all pass.

**Review focus:** *What if* the user skips all 4 questions — does it still suggest from history
alone? *Trace* a full tap-through from question 1 to a saved activity.

---

## Phase 6 — Swipe-up gestures (deferred — not this round, decision 6)

Captured for the future, not built now. Plan 20 sequences it last and it's "easy to add later."
`user_hidden_activities` already exists for the hide half.

- [ ] **6.1 — "nooit meer voorstellen".** Per-user soft-hide on the suggestion card, undoable
      via toast. Backend already supports it (`user_hidden_activities` + the DELETE soft-hide path).
- [ ] **6.2 — "meer zoals dit".** Seeds the analyse-fit generate (Phase 4) with the current
      activity. Output lands as drafts, not directly in rotation.

---

## Suggested order (matches plan 20 §Rough sequencing)

```
Phase 0  Menu + copy        ── ship first, gives everything a home
Phase 1  Creativity prompt  ── shapes both AI routes; cheap
Phase 2  Inversion          ── load-bearing; the retention payoff
Phase 3  About-me field     ── ALREADY EXISTS (AccountPage memory section); verify only
Phase 4  Analyse-fit (3)    ── endorsed by all; simpler AI route
Phase 5  Tappable Q&A (1)   ── make-or-break modality; shares Phase 4 backend
Phase 6  Swipe-up           ── deferred (decision 6); not this round
```

## Cross-cutting (carry through every phase)

- **No typing in the depletion-moment flow** (#5) — Q&A is tap-only.
- **Calibrated-uncertainty tone**, no performed warmth, no exclamation marks, lowercase where
  natural — match Mode 1 / Verras me voice (plan 19 §1 tone, report 007 ND-lens).
- **All new AI calls log to `api_usage`** and go through `createRateLimiter` from day one.
- **Privacy:** the user's memories + Q&A answers are privacy-sensitive; respect Pino redaction +
  GDPR delete cascade (already covers `users`/`user_memories` via `DELETE /me`).
- **Dutch-only, i18n-ready** — all new copy via `nl.json`, no hard-coded strings (except the
  Dutch prompt-value strings sent to Claude, as already done in onboarding).

## Out of scope (per plan 20 "Deferred")

- Provenance signalling on AI cards (beyond the analyse-fit menu label).
- Settings UI to re-enable other ontdekkingsroutes (hook only, Phase 0.2).
- Self-add nudge.
- After-activity "dit hielp" signal (plan 19 §4) — **confirmed out of scope** for this round
  (decided 2026-06-11). It remains the cleanest future fit-signal for the inversion.
