# Activity-add mechanisms — rough plan

**Status: rough outline, picked up from conversation 2026-05-19.**
**Background:** `docs/review/reports/006-activity-add-options.md` (panel + 3 expert lenses + Eline added in round 2).

## What this document covers

Library growth on top of the ~30 starter activities. Four pieces in scope:

1. **AI-generation surface** with three input modes (tappable form / typed specifics / accept-skip history) — three signal sources, one output flow.
2. **AI-suggested activities are drafts**, always editable but accept-without-editing must be a single tap.
3. **Swipe-up gestures** on the suggestion card — primarily *"stel deze nooit meer voor"*, with *"meer zoals dit"* on the same gesture pair.
4. **After-activity feedback** — a two-button "dit hielp" / "gedaan maar hielp niet" signal that becomes the *primary* fit-signal for the AI (not skip data).

Out of scope for this round (deferred):

- Self-add CRUD (Option 1 from report 006) — destination, not entry point; ship later, one-field-minimal.
- "Voeg toe in eigen woorden" post-accept rephrase (Option 4) — strongest expert pick but distinct feature; separate plan.
- History-mode promotion to default at month 2+ (point 2 from the conversation) — explicitly future, not v1.
- Combinators across the three AI input modes — do not pre-build; ship as separate paths, observe.
- Provenance badges on cards (yours / yours-rephrased / library / AI-suggested) — required for the 6-month inversion but separate UI/schema work.

---

## 1. AI generation with three input modes

### Entry surface

One big primary button, centered on the AI-generation screen: **"Verzin activiteiten voor me"** (or the warmer label already in the menu).

Below it, one small text link: **"of geef de AI andere input →"** opens a second screen with the alternatives. **The choice of input method is never on the critical path of the default user** — depleted users tap the big button and never see the alternatives.

### The three input modes

**A. Tappable form (default).** What is already in the existing onboarding flow — setting / social / interests as tap-targets. 4–6 questions max, no text fields. Generates a small batch (n TBD — see §2 open question).

**B. Type-your-own — inventory questions, not introspection.**

Two short freeform fields, both optional, both skippable:

- *"Noem een paar dingen die bij je liggen die geen werk zijn."*
  Placeholder cycles examples like *"bijv. fineliners, een puzzel, kleurboek, ukelele"*.
- *"Was er deze week één moment dat lichter voelde? Wat was je toen aan het doen?"*
  *"Weet ik niet"* is a valid answer that proceeds the flow.

These questions promise an *inventory task* (look around, list what's there), not a self-description task. Same question style works for Eline (specifics-rich), Jeroen (factual), Yuna (object-oriented), Sanne (minimal but real). Whoever can answer, does.

Critically: **the button label is "typ wat specifieks", not "vertel over jezelf"**. The framing is what unlocks the path for users who would have refused a self-description prompt.

**C. Based on history.** Uses accept / skip / "dit hielp" data (see §4) to generate without input. **Requires a minimum data threshold** — call it N accepts or N total interactions; pick threshold at implementation. Below threshold, the button is hidden or greyed out (decide at implementation; greyed-out with explanatory subtext is probably friendlier).

### Tone — applies to all three modes

AI copy in calibrated-uncertainty register: *"dit is een gok — past dit?"* rather than *"hier is een suggestie speciaal voor jou"*. No *"Wat tof!"*, no *"Ik snap je nu beter"*, no exclamation marks. This is also the PDA-non-demand mitigation from the ND lens.

---

## 2. AI output: editable drafts, one-tap accept

Every AI-generated activity arrives as a **draft** in a review tray. The user can:

- **One-tap accept** → goes into the rotation as-is. No edit required. This is the depleted-user path and must be frictionless.
- **Edit** → inline rename / rephrase / adjust before accepting. The giftedness lens's "edit-gate" risk is mitigated by *availability* of editing, not by *requiring* it.
- **Discard** → does not enter the rotation.

Default visual state should make accept-as-is obvious (the primary action), with edit as a secondary affordance. Not the other way around.

### Open questions for tomorrow

- **Batch size.** One activity per generation, or a small batch (3–5)? Eline wants angles → batch helps her see range. Daan/Tom want one thing now → single-item is calmer. Possibly: tappable-form returns 3, type-your-own returns 3, history-mode returns 1. Decide.
- **Where the draft tray lives.** A separate screen after generation? Or inline cards on the main suggest screen with an "accept" toggle? Lean toward separate screen to keep Mode 1 clean.
- **What happens when the user declines all drafts.** Generate again? Offer a refined input? Silently drop?

---

## 3. Swipe-up on the suggestion card

Two gestures on the same card, both reachable from the suggestion view.

### "Stel deze nooit meer voor" — the must-have

Single gesture (swipe-up or a small dismiss icon, pick at implementation). One tap, no confirmation modal, undoable for a few seconds with a small toast (*"deze wordt niet meer voorgesteld — ongedaan maken?"*).

The activity is hidden from the user's rotation. **Not deleted globally** — soft-hide per-user, so the shared starter library stays intact for everyone else.

### "Meer zoals dit"

Same gesture pair, opposite direction (or a small "+ meer zoals dit" affordance). Triggers an AI generation pass that uses the current activity as seed. Output lands in the draft tray (§2) — *not* directly into the rotation.

**Dimension hint, deferred but flagged.** Eline's request was for a facet chip (*"meer zoals dit op dimensie: rustig / handen-bezig / kort"*) to disambiguate what the AI is riffing on. Hold for v2; v1 ships without the chip and the AI picks the dimension. If usage data shows ambiguity-related drop-off, add the chip.

### Data model implication

Need a per-user `hidden_activities` (or `never_suggest` flag) table. Cheap migration. Mode 1's randomizer filters on it.

---

## 4. After-activity feedback — the missing primary signal

The reframe from report 006 §6 / Jeroen / ND lens: **skip ≠ "wrong for me"; it means "too much effort right now."** If AI generation and library pruning treat skip as fit-signal, the system converges to the smallest-effort subset for every user. The fix is an explicit fit-signal collected *after* the activity, with more state-distance from the moment of suggestion.

### The interaction

After a user accepts an activity, the app does *not* immediately ask anything (don't add friction to the moment of doing). Instead, the next time the user opens the app, the previous accepted activity surfaces as a small two-button card *before* the next suggestion:

> *"Hoe was 'X' gisteren?"*
>
> [ dit hielp ] [ gedaan maar hielp niet ]

Plus an unobtrusive **"sla over"** that closes the prompt without rating. Never required.

Three signals collected:

- **Dit hielp** → primary positive fit-signal. This activity is genuinely-restorative for this user. AI generation uses this as the strongest input.
- **Gedaan maar hielp niet** → done, but not the right fit. Distinct from "skipped." The AI learns "this category-or-shape isn't actually restorative for me, even though I'm willing to try it."
- **Sla over / no response** → no signal. Treated as missing data, *not* as negative.

### Why a delayed prompt, not immediate

Per Jeroen: *"Of ik écht had moeten wandelen weet ik pas anderhalf uur later."* The signal needs distance from the activity to be honest. Same reason streak-trackers fail — they ask at the wrong moment. The next-session prompt gives the body time to register what worked.

### Edge cases for tomorrow

- **User accepts but doesn't actually do the activity.** No way to detect this. Probably fine — if they're rating it the prompt is doing its job; if they skip the prompt it doesn't pollute the signal.
- **Multiple accepts between sessions.** Show one prompt per session max (the most recent acceptance), don't queue them up — that becomes homework.
- **Cold start for history-mode.** History-mode generation (§1C) should weight "dit hielp" ratings far above raw accept counts. Possibly threshold history-mode on N "dit hielp" ratings, not N total interactions.

---

## Cross-cutting concerns

- **No notifications, no streaks, no "we missen je"-mails.** Universal across the panel. The "dit hielp" prompt above appears *only when the user opens the app on their own*. Never pushed.
- **Tone everywhere.** Calibrated uncertainty, no performed warmth, lowercase where it reads naturally. Match the existing Mode 1 voice.
- **All AI calls should log** to the `api_usage` table (already exists) so rate-limiting and cost-tracking covers the new generation paths from day one.

## Order of implementation (suggested)

1. **Swipe-up "nooit meer"** — simplest, highest unanimous panel endorsement, schema change is one column. Ship first, watch usage, the data tells you what users actually want hidden.
2. **After-activity "dit hielp" signal** — separate from any AI work, but its data unblocks the AI paths. Schema: a `helped` enum on `activity_log` or similar. Ship second.
3. **AI generation with the three input modes** — depends on having "dit hielp" data flowing for history-mode to work. Ship tappable-form path first (already partially built), type-your-own path second, history-mode third when there is enough data to justify it.

## Open questions to revisit tomorrow

- Batch size per input mode (§2).
- Threshold for unlocking history-mode (§1C, §2).
- Whether the draft tray is a separate screen or inline (§2).
- Exact gesture for "nooit meer" (swipe-up vs. small icon) (§3).
- "Sla over" interaction on the after-activity prompt — single dismiss button, or auto-dismiss on next interaction? (§4)
- Should AI calls for "meer zoals dit" rate-limit separately from full generation passes?

## Deferred (do not build now)

- Self-add CRUD (Option 1).
- Post-accept "voeg toe in eigen woorden" (Option 4).
- History-mode as evolving default at month 2+.
- Combinators across input modes.
- Dimension chips on "meer zoals dit".
- Provenance badges on cards.

These are listed in `docs/review/reports/006-activity-add-options.md` as part of the longer-term shape. They are not abandoned — just out of scope for the next implementation chunk.
