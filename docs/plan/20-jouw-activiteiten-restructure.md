# Jouw activiteiten restructure + dual AI-generation routes

**Status: rough plan, picked up from conversation 2026-06-09.**
**Background:** `docs/review/reports/007-jouw-activiteiten-restructure.md` (Eline, Fatima, Jeroen + 3 expert lenses).
**Supersedes parts of:** `docs/plan/19-activity-add-mechanisms.md` (where they conflict, this plan wins — 19 was based on report 006, this on 007).

## What this document covers

A consolidated restructure of the activity-add surface, following the panel review of the dual-route AI generation proposal. *Verras me* becomes the only ontdekkingsroute; everything else lives under *Jouw activiteiten* and is opt-in, off the critical path of the depleted user.

## Confirmed scope

### 1. Drop other ontdekkingsroutes — only *Verras me* remains
*Verras me* is the home screen and the only primary entry. Other modes go away.
Leave a hook (no UI) for a future user setting to re-enable them. Don't build that setting now.

### 2. Three add-options under *Jouw activiteiten*
- **Self-add** — *"Iets toevoegen aan mijn lijst"*. Form-based (title + whatever fields we settle on). User-driven, calm-moment use.
- **Tappable Q&A → one suggestion** — *"Drie vragen, een suggestie"*. AI asks three concrete (not emotional) questions via tap-targets only, AI looks at what the user added + what they've picked most often, generates **one** activity. User can do it now and/or add to their list.
- **Analyse-fit → three suggestions** — *"Suggesties op basis van mijn lijst"*. AI looks at what the user added + what they've picked most often, generates three new activities, calibrated to their register. User picks which (if any) to add.

Copy decisions: descriptive over imperative (no *"voeg toe"*, no *"verzin"*), no urgency framing (no *"nu"* vs. *"rustig moment"*), provenance signalled in the label of the analyse-fit route.

### 3. The inversion
*Verras me* pulls from the user's own list + most-picked + AI-accepted, with the shared starter library fading as the user's pool grows.

### 4. Free-text "about me/ what unwind knows about me" field in *My account*
Persistent self-description / preferences / specifics (water, fineliners, podcast-during-walking, no sport). Injected into the AI system prompt across both AI routes (Q&A and analyse-fit).

**Constraints:**
- Optional, never gating. Suggestions must work from accept/skip history alone for users who never fill it in.
- Complements but does not replace the tappable Q&A. Different moments: this is calm-moment self-description; the Q&A is in-the-moment context.

### 5. Tappable-only on the Q&A route
No free-text input anywhere in the depletion-moment flow. Concrete questions only (*"binnen of buiten nu?"*, *"alleen of met iemand?"*), no emotional ones (*"hoe voel je je?"*). Dropped *"kort of lang?"* (2026-06-12): it's the only question that asks the depleted user to *forecast* a duration rather than report current state — ND time-blindness makes that the one cognitively-loaded tap in an otherwise reflexive flow. Short/low-effort is the safe default for a depletion moment anyway, and `rustig/actief` + accept-history already proxy capacity.

### 6. Creativity calibration in the AI prompt
Drop *"be creative / think out of the box"* as a default instruction. Anchor generated activities to the user's existing register (added activities + accepted history). Mix familiar / adjacent / divergent, default mix tilted toward familiar/adjacent unless history signals otherwise. See addendum on report 007.

---

## Deferred / out of scope

- **Provenance signalling on AI cards.** Could add too much noise on the Suggest page. Possibly a per-user setting later; don't build now.
- **Settings toggle to re-enable other ontdekkingsroutes.** Hook only, no UI.
- **Self-add nudge.** No longer needed given the menu structure.

---

## Open / undecided

- **Swipe-up gestures on the suggestion card** — *"nooit meer voorstellen"* + *"meer zoals dit"*. Strong endorsement from report 006 but not committed to in this round. Decide whether it ships with this restructure or after.
- **Copy for the three menu options.** *"Verzin activiteiten voor me"* needs to go. No final wording yet for any of the three. Load-bearing decision — affects Fatima (clarity), PDA segment (demand framing), avg/IQ segment (don't frame the Q&A as crisis-only).
- **Self-add form shape.** Form is in; exact fields TBD.

---

## Rough sequencing

1. Pick copy and finalise the menu layout (open item: copy).
2. Decide the creativity spec (item 6) — shapes the prompt for both AI routes.
3. Plan the inversion (item 3) — biggest backend change, success criterion for the whole restructure.
4. Build the three add-options (item 2) + the *about me* field (item 4) on top of that.
5. Resolve the swipe-up question last — easy to add later if deferred now.
