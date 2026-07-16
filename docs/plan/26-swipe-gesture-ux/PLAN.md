# Swipe gesture UX — decouple drag from buttons, drop button directionality

**Date:** 2026-07-16
**Status:** Draft
**Branch:** `feat/swipe-gesture-ux`
**Tasks:** [TASKS.md](TASKS.md)

## Goal

Fix the mobile swipe-vs-button mismatch on Verras-me (`SuggestPage`) by binding
swipe direction independently of button layout, giving the drag live visual
feedback, and redesigning the buttons so they no longer claim a side.

## Context

Raised as a UX issue: `ActivityCard` puts `Doen` (accept) on the left and
`Volgende` (skip) on the right. Tapping is fine, but the card-stack format
invites swiping, and swipe gestures carry a learned convention from
dating-app UIs (swipe right = accept, swipe left = reject) that's the reverse
of this layout. A prior conversation produced four candidate fixes; this plan
implements three of them together:

1. **Decouple swipe from button position** — bind the drag gesture
   independently: right = accept, left = skip, regardless of where the
   buttons sit.
2. **Drop directionality from the buttons** — replace the left/right
   accept/skip pair with two icon-only circular buttons.
3. **In-motion feedback** — the card tilts and a colored DOEN/VOLGENDE stamp
   fades in during the drag, so the gesture teaches itself live.

(The fourth candidate — swapping which side each button sits on — is
explicitly rejected; it doesn't fix the swipe mismatch and would force
existing users to relearn button positions for no gain.)

## Key Design Decisions

| Decision | Choice | Reference |
|---|---|---|
| Replace `useSwipeUp` with one `useCardSwipe` composable | A single composable owns axis-lock (horizontal drag vs. vertical swipe-up) for the whole card region | Two independent touch listeners on the same region can't safely arbitrate one gesture; `useSwipeUp.ts`'s own `maxHorizontal` guard already establishes the axis-discrimination precedent this generalizes |
| Gesture handlers move from `SuggestPage.vue`'s wrapper onto `ActivityCard.vue` | The card is what visually moves/tilts, so it must own the touch state and emit `accept` / `skip` / `open-sheet` itself | `frontend/src/pages/SuggestPage.vue:29-34` (current wrapper binding) |
| Button clicks play the same fly-off exit animation as a completed drag | One visual language regardless of input method; both paths funnel through a single internal `commit(direction)` | Confirmed this session |
| Icon pair: ✕ skip / ✓ accept, small caption underneath each | Reuses `CheckIcon.vue` unchanged (matches the current accept badge exactly); one new `CloseIcon.vue` | Confirmed this session; `frontend/src/components/icons/CheckIcon.vue` |
| Stamp/caption copy reuses `activity.accept` / `activity.skip` i18n keys, uppercased via CSS | No new i18n keys needed | `frontend/src/locales/nl.json:12-13` |
| Exit-emit timing keyed off `transitionend`, not a hardcoded `setTimeout` | Avoids duplicating the CSS transition duration as a magic number in JS and CSS | New pattern — no existing precedent, flagged as a deliberate choice |
| Touch-only gesture, no mouse-drag emulation | Matches `useSwipeUp.ts`'s existing scope; desktop already has working buttons | `frontend/src/composables/useSwipeUp.ts` |
| Order in the button pair stays accept-left / skip-right | Minimizes visual disruption for existing users; the order is now cosmetic, not directional, since swipe is bound independently | Current `ActivityCard.vue` DOM order |

## Approach

### `frontend/src/composables/useCardSwipe.ts` (new, replaces `useSwipeUp.ts`)

Single composable handling `touchstart` / `touchmove` / `touchend` on the
card:

- **Deadzone + axis lock.** Once movement exceeds a small deadzone (~10px),
  lock the gesture to whichever axis dominates: horizontal → drag mode,
  vertical-upward → swipe-up mode (mirrors today's `maxHorizontal` guard,
  generalized to a real lock instead of an end-of-gesture check). Once
  locked, the other axis is ignored for the rest of that touch.
- **Horizontal drag (live).** While locked horizontal, exposes reactive
  `dragX` (clamped), `rotation` (degrees, proportional to `dragX`, clamped
  to a max), `dragIntent` (`'accept' | 'skip' | null'`, flips once `dragX`
  crosses a small reveal threshold), and `dragProgress` (0–1, drives stamp
  opacity). Call `preventDefault` on `touchmove` only once horizontal lock
  is confirmed, so vertical page/gesture behavior is never hijacked.
- **Vertical swipe-up.** While locked vertical-upward, behaves exactly like
  today's `useSwipeUp` (same threshold, same "no live feedback" — that
  gesture's feel is unchanged and out of scope here).
- **Commit / release.** On `touchend`: horizontal lock past the commit
  threshold → `commit('accept' | 'skip')`; vertical lock past its threshold
  → `onOpenSheet()`; anything short of a threshold → spring back to center
  (`dragX` resets, transition re-enabled).
- **Shared commit path.** Export `commit(direction)` so `ActivityCard`'s
  button click handlers call the *same* function the drag-release path
  calls — one place sets `isExiting` / `exitDirection`, one place fires the
  fly-off animation.
- Pure axis/threshold decisions kept in small exported helper functions
  (mirrors `useSwipeUp.ts`'s shape) so they're directly unit-testable
  without simulating a full touch sequence.

### `frontend/src/components/icons/CloseIcon.vue` (new)

Same shape/props contract as `CheckIcon.vue` (`size`, `strokeWidth` props,
16×16 viewBox, `currentColor` stroke) — an ✕ glyph.

### `frontend/src/components/ActivityCard.vue` (rewrite)

- Binds `useCardSwipe` directly on the card root (`touchstart`/`touchmove`/
  `touchend`), applies `transform: translateX(dragX) rotate(rotation)` via
  inline style while dragging, and a CSS transition class when settling
  back to center or flying off-screen.
- Renders two stamp overlays (`DOEN` / `VOLGENDE`, existing i18n keys
  uppercased in CSS), each bound to `dragProgress` × `dragIntent`.
- Replaces the `.uw-actions__primary` / `.uw-actions__secondary` pair with
  two icon-only circular buttons (✕ / ✓), each with a small
  caption underneath and an `aria-label` from the existing
  `activity.skip` / `activity.accept` strings. Click handlers call the same
  `commit('skip' | 'accept')` the drag path uses.
- Listens for the CSS exit transition's `transitionend` on the card root
  when `isExiting` is true, and emits `accept` / `skip` at that point (not
  before) — keeps the existing event contract with `SuggestPage.vue`
  unchanged, just timed after the visual exit.
- New emit: `open-sheet` (replaces the wrapper-level swipe-up binding that
  used to live in `SuggestPage.vue`).

### `frontend/src/pages/SuggestPage.vue` (wire-up)

- Remove the `@touchstart` / `@touchend` + `useSwipeUp` import from the
  wrapper `div` (`SuggestPage.vue:29-34`).
- Add `@open-sheet="openSheet"` to `<ActivityCard>` alongside the existing
  `@accept` / `@skip`.
- The inconspicuous handle button (desktop click-to-open-sheet) is
  untouched.

### `frontend/src/assets/base.css`

- New `.uw-swipe-stamp` (+ accept/skip color variants) — absolutely
  positioned, bold uppercase, rotated slightly, opacity driven by inline
  style from `dragProgress`.
- New transition classes for "settling back to center" vs. "exiting"
  (translateX to well past the viewport edge + fade), both timed to match
  the `transitionend` listener above.

## Scope

- **In scope:** items 1, 3, 4 from the original UX conversation (decouple
  swipe from buttons; live drag feedback; icon-only non-directional
  buttons); replacing `useSwipeUp` with the unified `useCardSwipe`.
- **Out of scope:**
  - Item 2 (swap which side each button sits on) — rejected.
  - Mouse-drag emulation on desktop — buttons remain the desktop path.
  - Changing the vertical swipe-up-to-open-sheet threshold or feel — kept
    identical to today.
  - Haptic feedback (Vibration API) on commit.
  - A user preference to disable gestures / force buttons-only.
  - Mobile-first restyling beyond what this interaction needs (per
    `docs/plan/25-suggest-swipe-menu.md`'s existing "out of scope" note,
    still holds).

## Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | Dragging the card right past the commit threshold accepts the activity, same outcome as tapping ✓ | On `/suggest` (mobile viewport), drag right → card flies off right → next suggestion or accepted screen shows |
| 2 | Dragging the card left past the commit threshold skips, same outcome as tapping ✕ | Drag left → card flies off left → next suggestion shows |
| 3 | Mid-drag, the card visibly tilts and a colored DOEN/VOLGENDE stamp fades in proportional to drag distance, before commit | Partial drag shows partial tilt + partial stamp opacity, no state change yet; release below threshold springs the card back to center |
| 4 | Buttons are icon-only (✕ / ✓) with a caption, centered as a neutral pair, each with a correct `aria-label` | Inspect DOM on `/suggest`; screen-reader label present; buttons render centered, not edge-anchored |
| 5 | Swiping up (or tapping the handle) still opens the action sheet exactly as before; horizontal drag and vertical swipe never both fire | Swipe up on the card → sheet opens; a horizontal drag does not also open the sheet; a vertical swipe does not also trigger accept/skip |
| 6 | Clicking ✓/✕ on desktop plays the same fly-off exit animation as a completed drag before advancing | Click ✓ → card animates off right → then next suggestion / accepted screen |
| 7 | No regressions to existing flow or sheet logic | `useSuggestionFlow` accept/skip logic (usage-event logging, module flow state) unchanged; `ActivityActionSheet` actions (Meer van dit / Dit niet meer / Chat) unaffected |

## Testing Strategy

Per the `/test` skill: test behavior, not implementation.

- **`useCardSwipe.spec.ts`** (replaces `useSwipeUp.spec.ts`, same
  simulated-touch-event pattern): axis lock picks horizontal vs.
  vertical-up correctly; horizontal commit fires `onAccept`/`onSkip` past
  threshold in the right direction; short/below-threshold drags fire
  neither; a mostly-vertical drag still opens the sheet and never commits
  accept/skip; a mostly-horizontal drag never opens the sheet.
- **`ActivityCard.spec.ts`** (new): clicking ✓/✕ emits `accept`/`skip`;
  both buttons carry the correct Dutch `aria-label`; a simulated drag past
  threshold emits the right event; emitting `open-sheet` on a simulated
  upward swipe.
- **Manual only:** the actual drag physics/feel (tilt amount, stamp
  timing, fly-off animation) — not meaningfully unit-testable, covered by
  the manual verification task.

## Risks

- Axis-lock deadzone tuning (too small → accidental horizontal locks during
  an intended swipe-up; too large → drag feels laggy to start) will likely
  need one or two rounds of on-device feel adjustment — flagged as a normal
  part of the manual verification task, not a blocker to starting.
- `transitionend` firing twice (once for `transform`, once for `opacity`)
  if both are animated on the same element — the emit-on-exit handler must
  guard against double-firing (e.g. check `event.propertyName` or a
  one-shot flag).
