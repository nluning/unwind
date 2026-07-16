# Swipe gesture UX

> Plan: [PLAN.md](PLAN.md)

### Phase 26: Swipe gesture UX (2 tasks)

**Goal:** Bind swipe direction independently of button position, give the
drag live visual feedback, and replace the directional button pair with a
neutral icon-only pair.

**Phase Context:**

- Why one composable instead of extending `useSwipeUp` alongside a new
  horizontal-drag composable: two independent touch listeners on the same
  card region can't safely arbitrate a single physical gesture — whichever
  fires first would need to suppress the other, and `touchmove` tracking
  (needed for live drag feedback) doesn't exist in `useSwipeUp` at all.
  `useCardSwipe` supersedes and deletes `useSwipeUp`.
- Why buttons and drag share one `commit(direction)` path: without it, the
  fly-off exit animation would need two separate triggers to stay in sync,
  and future tuning (threshold, timing) would risk drifting between the two
  input methods.

- [ ] **26.1** Card gesture + redesign (frontend end-to-end, TDD)
    - **Context:**
        - **Why:** Swipe gestures carry a learned right=accept/left=reject
          convention (dating apps) that's the reverse of the current
          left=accept/right=skip button layout; this task decouples the two
          and makes the buttons stop claiming a side. See PLAN.md Context.
        - **Architecture:** New `useCardSwipe` composable (deadzone + axis
          lock, exported pure helpers for the lock/threshold decisions,
          mirrors the shape of the composable it replaces) owns all touch
          handling; `ActivityCard.vue` binds it on its root element and
          applies the live transform; `SuggestPage.vue` only wires
          `@accept` / `@skip` / `@open-sheet` — no touch logic left at the
          page level. See PLAN.md Approach for the full breakdown per file.
        - **Key refs:**
          - `frontend/src/composables/useSwipeUp.ts` (being replaced —
            reuse its deadzone/threshold shape and touch-event handling
            style)
          - `frontend/src/composables/useSwipeUp.spec.ts` (reuse the
            simulated-touch-event test pattern)
          - `frontend/src/components/ActivityCard.vue` (current
            left/right button markup + emits)
          - `frontend/src/pages/SuggestPage.vue:29-34,80,95-125,164`
            (current wrapper touch binding + `useSuggestionFlow` wiring —
            `handleAccept`/`handleSkip` contract must not change)
          - `frontend/src/components/icons/CheckIcon.vue` (prop contract
            to match for the new `CloseIcon.vue`)
          - `frontend/src/assets/base.css:310-345` (current `.uw-actions`
            block being redesigned) and `:361-365` (`.uw-badge` circle
            sizing to match for the new icon buttons)
          - `frontend/src/locales/nl.json:10-16` (`activity.accept` /
            `activity.skip` — reused as-is, no new keys)
        - **Watch out:**
          - `touchmove` must only call `preventDefault` once horizontal
            lock is confirmed — locking the wrong axis or calling it too
            early will break page scroll or the vertical swipe-up gesture.
          - The exit-emit listener keys off `transitionend`; if both
            `transform` and `opacity` transition on the same element, guard
            against the handler firing twice (e.g. check
            `event.propertyName`, or a one-shot flag reset on next drag
            start).
          - `ActivityCard` must keep emitting exactly `accept` / `skip` (the
            existing contract) — only the *timing* changes (after the exit
            transition), not the event names or `SuggestPage.vue`'s
            handlers.
          - A vertical-locked gesture must never also read as a horizontal
            commit, and vice versa — this is the whole point of the axis
            lock; test both directions explicitly.
          - Keep the accept-left / skip-right DOM order (cosmetic now, not
            directional) so existing users see minimal visual disruption.
    - **Scope:** `useCardSwipe.ts` (+ spec), `CloseIcon.vue`, rewritten
      `ActivityCard.vue` (+ spec), `SuggestPage.vue` wiring change,
      `base.css` redesign; delete `useSwipeUp.ts` + its spec.
    - **Acceptance Criteria:** AC #1, #2, #3, #4, #5, #6, #7 (see PLAN.md)
    - **Touches:**
      - `frontend/src/composables/useCardSwipe.ts` (new)
      - `frontend/src/composables/useCardSwipe.spec.ts` (new)
      - `frontend/src/composables/useSwipeUp.ts` (delete)
      - `frontend/src/composables/useSwipeUp.spec.ts` (delete)
      - `frontend/src/components/icons/CloseIcon.vue` (new)
      - `frontend/src/components/ActivityCard.vue` (rewrite)
      - `frontend/src/components/ActivityCard.spec.ts` (new)
      - `frontend/src/pages/SuggestPage.vue` (edit)
      - `frontend/src/assets/base.css` (edit)
    - **Action items:**
        - [RED] Write `useCardSwipe.spec.ts`: axis lock picks horizontal
          for a mostly-sideways drag and vertical-up for a mostly-upward
          one (adapt `useSwipeUp.spec.ts`'s four cases to the new shape)
        - [RED] Write `useCardSwipe.spec.ts`: horizontal drag past the
          commit threshold to the right calls `onAccept`; to the left
          calls `onSkip`
        - [RED] Write `useCardSwipe.spec.ts`: horizontal drag short of the
          commit threshold calls neither, and resets `dragX`
        - [RED] Write `useCardSwipe.spec.ts`: vertical-up past its
          threshold calls `onOpenSheet` and never calls `onAccept`/`onSkip`,
          even if there was minor horizontal drift
        - [RED] Write `useCardSwipe.spec.ts`: a mostly-horizontal drag locks
          to horizontal and never calls `onOpenSheet`, even past the
          vertical threshold's distance
        - [RED] Write `useCardSwipe.spec.ts`: `commit('accept' | 'skip')`
          called directly (simulating a button click) sets exiting state
          the same way a drag-release commit does
        - [GREEN] Implement `useCardSwipe.ts` to make the above pass
        - [RED] Write `ActivityCard.spec.ts`: clicking the ✓ button emits
          `accept`; clicking ✕ emits `skip`; both buttons expose the
          correct Dutch `aria-label`
        - [RED] Write `ActivityCard.spec.ts`: a simulated drag past the
          right-side threshold eventually emits `accept`; past the left
          threshold emits `skip`
        - [RED] Write `ActivityCard.spec.ts`: a simulated upward swipe
          emits `open-sheet`
        - [GREEN] Rewrite `ActivityCard.vue`: bind `useCardSwipe`, render
          the live transform + stamps, replace the button markup with the
          icon-only pair, wire `commit()` to both click handlers and drag
          release, emit `open-sheet`
        - [GREEN] Create `icons/CloseIcon.vue` matching `CheckIcon.vue`'s
          prop contract
        - [GREEN] Update `SuggestPage.vue`: remove the wrapper
          `useSwipeUp` binding, add `@open-sheet="openSheet"` to
          `<ActivityCard>`
        - [GREEN] Redesign `.uw-actions` and add stamp/exit-transition
          classes in `base.css`
        - [GREEN] Delete `useSwipeUp.ts` and `useSwipeUp.spec.ts`
    - **Verify before complete:**
        - [ ] All [RED] tests pass
        - [ ] `cd frontend && npm run lint:check && npm run test`
        - [ ] Axis-lock watch-out: dedicated tests cover "vertical drag
          never commits accept/skip" and "horizontal drag never opens the
          sheet"
        - [ ] `transitionend` double-fire watch-out: manually trigger a
          commit and confirm the parent's `accept`/`skip` handler runs
          exactly once (add an assertion/log during dev, remove before
          done)
        - [ ] `SuggestPage.vue`'s `handleAccept`/`handleSkip`/`openSheet`
          call sites are unchanged (diff review, not just tests)
        - [ ] No remaining references to `useSwipeUp` anywhere in
          `frontend/src`
    - **Success:** Dragging or tapping accept/skip produces the same
      outcome either way, with live tilt/stamp feedback during the drag;
      swipe-up-to-open-sheet still works and never cross-fires with the new
      horizontal gesture; buttons are icon-only and centered.

- [ ] **26.2** Manual verification
    - Note: CI runs the full automated suite on the PR — this task covers
      only hands-on mobile testing of the complete interaction.
    - **Verify manually:**
        1. On a real phone (or device emulation), drag the card right past
           the threshold → tilts right, DOEN stamp fades in, card flies off
           right, next suggestion (or accepted screen) appears.
        2. Drag left past the threshold → same, mirrored (VOLGENDE stamp,
           skip).
        3. Drag partway and release below threshold → card springs back to
           center, no state change.
        4. Swipe up on the card → action sheet opens, exactly as before.
        5. Tap the small handle button under the card (desktop-style click)
           → sheet also opens.
        6. Click ✓ / ✕ with a mouse (desktop) → same fly-off animation as a
           completed drag, then advances.
        7. Confirm no dead zone or accidental cross-triggering: a careful
           mostly-vertical swipe never also registers as accept/skip; a
           careful mostly-horizontal drag never also opens the sheet.
        8. Confirm both buttons read correctly with a screen reader
           (aria-label), and the caption text under each icon is legible in
           both light and dark theme variants.
        9. Confirm `ActivityActionSheet` flows (Meer van dit / Dit niet meer
           voorstellen / Chat hierover) still work unchanged after the
           `ActivityCard` rewrite.
