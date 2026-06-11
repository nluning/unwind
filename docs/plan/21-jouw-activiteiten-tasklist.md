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
   - Q&A → **"Vier vragen, één suggestie"**
   - Analyse-fit → **"Suggesties op basis van mijn lijst"**
5. **Self-add form shape (#1).** Keep title + category; make duration/stress optional with sane
   defaults — the depleted user shouldn't fill 5 fields.
6. **Swipe-up gestures → defer.** Ship after the restructure (plan 20 §sequencing puts it last;
   `user_hidden_activities` already supports the hide half cheaply later).
7. **Q&A questions (#5).** Four concrete tap-questions: **binnen/buiten · kort/lang ·
   alleen/met iemand · rustig/actief**. No emotional ones.
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

- [ ] **2.1 — Define the fade rule.** Spec how base activities decay as the user's own pool
      grows. Proposal: weight = f(source, times_accepted, pool composition). User/ai source and
      high `times_accepted` get boosted; `base` source gets a multiplier that shrinks as the
      count of non-base activities rises. Write the formula down in this file before coding it.
- [ ] **2.2 — Implement in `useActivities.ts`.** Extend `getWeight`/`weightedPick` with the fade
      rule. Keep the existing skip-penalty + session-penalty behaviour. (Decision 5: frontend.)
- [ ] **2.3 — Surface the signal.** `GET /activities` already returns `source` and the counters
      the formula needs (`times_skipped`; add `times_accepted` to the `Activity` type + the
      select if not already projected). Confirm the frontend has every field the formula reads.
- [ ] **2.4 — Tests.** Unit-test the weighting: a user with many accepted user/ai activities
      sees base activities suggested measurably less often; a brand-new user still sees base.

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

- [ ] **4.1 — Backend `POST /activities/suggest-from-list`.** New route in `activities.ts` (or a
      new `generate.ts`). Pulls `getUserContext()` (which already carries the user's "about me"
      memories), calls Claude with a **purpose-built generation prompt** — NOT the chat or
      onboarding prompt. The prompt: receives structured context only (no conversation, the AI
      never asks questions), generates **exactly 3** activities, and imports `CREATIVITY_GUIDANCE`
      plus a 3-item tilt (≈1 familiar / 2 adjacent; a divergent one only on a variety signal).
      Returns the 3 as JSON. Rate-limited
      via `createRateLimiter` against `api_usage`. Model: **Sonnet (`claude-sonnet-4-6`)** —
      matches onboarding's Dutch-quality reasoning (decision locked 2026-06-11).
- [ ] **4.2 — Drafts are not auto-saved.** Return the 3 as ephemeral drafts; the user picks which
      (if any) to add. Saving reuses `POST /activities` (source `'ai'`) via `toCreatePayload`.
- [ ] **4.3 — Frontend page/flow.** New page (e.g. `SuggestFromListPage.vue`) reachable from the
      *Jouw activiteiten* menu. Shows 3 cards, each with one-tap "toevoegen aan mijn lijst".
      Bounded at 3 — no "toon meer" (giftedness lens: bounded is correct).
- [ ] **4.4 — Empty/cold-start handling.** If the user has too little to riff on, the route must
      still produce something (avg/IQ + Jeroen: never "voeg eerst meer toe"). Fall back to
      familiar/base-adjacent suggestions.
- [ ] **4.5 — Tests.** Response parsing (reuse onboarding parse-test pattern), exactly-3 cap,
      cold-start fallback, rate-limit wiring.

**Review focus:** *What if* Claude returns 2 or 5 activities — how does the route enforce 3?
*Why* are drafts ephemeral instead of saved-then-deleted?

---

## Phase 5 — Tappable Q&A route → 1 suggestion (#2b, #5)

The make-or-break route per report 007 (modality is the risk). **Tap-only, concrete questions,
no free text, no emotional questions.** Build after analyse-fit since it shares the generate
backend pattern.

- [ ] **5.1 — The 4 questions** (decision 7, locked): **binnen/buiten · kort/lang ·
      alleen/met iemand · rustig/actief**. Concrete, tappable, no "hoe voel je je?".
- [ ] **5.2 — Backend `POST /activities/suggest-from-answers`.** Takes the 4 tap-answers +
      `getUserContext()` (which already carries the user's "about me" memories), returns **1**
      activity. **Purpose-built prompt** — NOT the chat prompt: the AI never asks questions (the
      4 answers arrive as structured input), and it returns a single activity, not a batch.
      Reuses `CREATIVITY_GUIDANCE`; same rate limiting as Phase 4. The answers are in-the-moment
      context layered on top of history.
- [ ] **5.3 — Frontend flow.** Reuse `OnboardingOptionPills` / `OnboardingStepHeader` /
      `OnboardingStepActions` for the question screens (they already do tappable + auto-advance).
      New page (e.g. `QuickSuggestPage.vue`). Tap-only — do **not** reuse `ChatPage`/`useChat`.
- [ ] **5.4 — Result actions.** Show the 1 suggestion with "doe dit nu" and/or
      "toevoegen aan mijn lijst" (plan 20 §2). Calibrated-uncertainty tone, no "speciaal voor jou".
- [ ] **5.5 — Tests.** Answer→prompt mapping, single-activity output, rate-limit wiring.

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
