# Accessibility improvements

Issue: #110 — https://github.com/nluning/unwind/issues/110

## Context

The `/accessibility` skill (`.claude/skills/accessibility/SKILL.md`) documents
Unwind's a11y standard and was grounded in a read-only audit of the frontend.
The audit found six open gaps: no live region for streamed chat (the app's
core feature is silent to screen readers), no `aria-pressed` on selection
controls (`ToggleButton`, `StressLevelPicker`), no project-wide visible focus
styling, no Escape-to-close/focus-return on the two dropdown menus, no
`<main>` landmark on most pages, and a broken heading hierarchy in
onboarding.

Noor also flagged a concrete visible bug: a blue line traces the swipe-up
action sheet on mobile whenever it opens. Investigation (below) shows this is
actually a *symptom* of the missing-focus-styling gap, not a separate bug —
fixing it correctly means shipping it together with the focus-visible
foundation, not just deleting the outline.

Six small, independently shippable chunks. Each is a `/feature` Phase 4
chunk on its own — no cross-chunk dependencies except Chunk 1, which both
other phases and the blue-line fix rely on.

## Root cause: the "blue line" bug

`ActivityActionSheet.vue:12-19` — the sheet's root `.uw-sheet` div has
`role="dialog"`, `tabindex="-1"`, and `onMounted` (line 149-152) calls
`sheet.value?.focus()` to move focus in for keyboard/AT users. No CSS
anywhere (`base.css` has no `.uw-sheet`, `[role="dialog"]`, or `:focus`
rule) suppresses the browser's default focus ring on that div — unlike
`.uw-input`, `LoginPage.vue`'s inputs, and `ChatPage.vue`'s chat input,
which all explicitly set `outline: none`. Every time the sheet opens
(`SuggestPage.vue:60-66` uses `v-if="sheetActivity"` — a fresh mount, so
`onMounted` fires every time, on both the swipe-up gesture and the visible
handle button) the browser draws its default outline around the full-width
rounded-top sheet — visible on mobile as a blue line along the top/side
edges.

**The fix is not simply `outline: none`** — that would repeat the exact
mistake WCAG flags (removing a focus indicator with nothing replacing it)
for a case where a focus indicator genuinely matters elsewhere. It's
warranted specifically on `.uw-sheet` because that div is non-interactive
chrome (the dialog container, not a control) — its own focus receipt exists
only to move the AT/keyboard cursor in and enable `@keydown.esc`, not to
give a sighted keyboard user something to visually track. The sheet's
arrival *is* the visual affordance. So: suppress the outline on the dialog
container specifically, while adding real `:focus-visible` styling for the
interactive controls inside it (and everywhere else) in the same chunk —
Chunk 1 below.

## Implementation (small, reviewable chunks)

### 1. Focus-visible foundation + fix the blue line — `assets/base.css`

Add a project-wide focus-visible rule. The codebase already avoids clickable
`<div>`s (every interactive element is a real `<button>`), so one rule
covers nearly everything:

```css
button:focus-visible {
  outline: 2px solid var(--uw-primary);
  outline-offset: 2px;
}

[role="dialog"]:focus {
  outline: none;
}
```

The second rule is what removes the blue line — it targets `.uw-sheet` now
and will also cover `SuggestFilters.vue`'s panel from Chunk 4 if it gets
`role="dialog"`. Leave `.uw-input`'s existing `:focus { border-color }`
treatment as-is — it already gives a visible focus signal.

**Verify:** open the app, trigger the action sheet (swipe up on a card, or
tap the handle button below it) on a narrow viewport — no blue line. Tab to
a `UserMenu`/theme-swatch/toggle button with a keyboard — visible ring
appears. `npm run lint:check`.

### 2. Chat streaming live region — `pages/ChatPage.vue`

The message container (`ChatPage.vue:49-112`) renders streamed assistant
text with no live region. Reuse the existing pattern from
`MenuHintTooltip.vue:2-4` (`role="status" aria-live="polite"`).

Don't announce per-token (a firehose of interruptions is actively bad for
this app's ND audience — see the skill's tone guidance). Add a
visually-hidden live region that updates once per completed message, driven
off `isStreaming` flipping back to `false`, not off every streamed chunk.

**Test:** Vitest spec asserting the live region's `aria-live` attribute and
that its text updates after `isStreaming` becomes `false` — assert
observable output per `/test` conventions, not internal state.

### 3. Selection-state ARIA — `components/ToggleButton.vue`, `components/StressLevelPicker.vue`

- `ToggleButton.vue:2-14` — add `:aria-pressed="selected"` on the root
  `<button>`. Used for onboarding interests and category filters, so this
  fix is free everywhere it's reused.
- `StressLevelPicker.vue:4-18` — add `:aria-pressed="modelValue === level"`
  per button, plus a new i18n key (alongside the existing `stress.low`/
  `stress.high` in `nl.json`) for a level `aria-label` — a bare digit is
  ambiguous out of visual context.

Both mirror the already-correct pattern at `UserMenu.vue:33` (`aria-pressed`
on the theme swatches) — no new pattern, just applying the existing one
consistently.

**Test:** 1-2 component tests per component asserting `aria-pressed`
reflects `selected`/`modelValue`, per `/test`'s test-budget guidance.

### 4. Dropdown Escape-to-close + focus return — `components/UserMenu.vue`, `components/SuggestFilters.vue`

Both are non-modal disclosure widgets (click-outside to close, no backdrop)
— scope to the WAI-ARIA APG *disclosure* pattern, not a full dialog: Escape
closes and returns focus to the trigger button.

**Explicitly out of scope:** a full focus trap or arrow-key roving tabindex
for these two. That's warranted for a true modal (`ActivityActionSheet`
already has the Escape half; adding a trap there is a separate, larger
effort not in this ticket) but over-engineered for a ~100-user app's
filter/menu panels per CLAUDE.md's calibration note.

- `UserMenu.vue` — add `@keydown.esc="closeMenu"` where `closeMenu` sets
  `open = false` and calls `.focus()` on a new template ref on the trigger
  `<button>` (line 6-13, alongside the existing `menuRef`).
- `SuggestFilters.vue` — same shape: Escape closes (currently only
  `handleClickOutside` at lines 101-105 and the "Done" button at line 56
  close it), focus returns to the trigger (line 6-18). Its panel (lines
  20-58) is a bare `<div>` with real form controls, not menu items — leave
  semantics minimal (`role="menu"` would be wrong per the APG), but add an
  `id` and wire the toggle's existing `aria-expanded` (line 14) to
  `aria-controls` pointing at it.

**Test:** component specs — open, press Escape, assert the panel closes and
(where testable via jsdom focus) that focus returned to the trigger.

### 5. `<main>` landmark — `components/PageShell.vue`, `pages/AccountPage.vue`, `pages/PrivacyPage.vue`, `pages/LoginPage.vue`

`PageShell.vue:1-9` wraps `<slot/>` in plain `<div>`s only. Three pages
(`AccountPage.vue:5`, `PrivacyPage.vue:5`, `LoginPage.vue:5`) each locally
patched this with their own `<main>` inside the slot; every other
`PageShell`-using page (`SuggestPage`, `OnboardingPage`, `ChatPage`, etc.)
has none at all.

- Add `<main>` to `PageShell.vue`, wrapping `<slot/>` inside `.uw-frame`, so
  every page gets the landmark for free.
- Change the three pages' local `<main>` back to `<div>` (keeping their
  existing classes) to avoid nested/duplicate `<main>` landmarks, which is
  invalid.

**Verify:** `npm run type-check`; spot-check in devtools' accessibility tree
on 2-3 pages that there's exactly one `<main>` per page.

### 6. Onboarding heading hierarchy — `components/OnboardingStepHeader.vue`, `pages/OnboardingPage.vue`

Steps are mutually-exclusive `v-if`/`v-else-if` branches
(`OnboardingPage.vue:19-193`), so only one heading exists in the DOM at a
time — that's the correct shape, but today it's an `<h1>` only on step 1
(`OnboardingPage.vue:20`); steps 2-6 render `OnboardingStepHeader.vue`'s
`<h2>` (line 6-10); step 7 (loading, lines 166-174) has no heading at all;
step 8 (lines 177-193) has its own local `<h2 class="uw-title">` (line 178).

- `OnboardingStepHeader.vue:6` — change `<h2>` to `<h1>`.
- `OnboardingPage.vue:178` — change step 8's local heading to `<h1>`.
- Step 7 (loading-only, no heading): add a visually-hidden `<h1>` (an
  `sr-only`-style utility class) announcing the loading state via the
  existing `StateLoading` copy, so the page never has a zero-`<h1>` state.

**Verify:** `npm run type-check`; confirm via devtools that exactly one
`<h1>` exists at each onboarding step.

## Notes

- Chunks are ordered by impact-to-effort (focus foundation + blue-line fix
  first since it's both the reported bug and the smallest diff; chat live
  region second since it's the single biggest screen-reader gap given this
  is a chat-first app) but have no cross-chunk dependency beyond Chunk 1.
  Fine to reorder or split across multiple PRs.
- Run the full `frontend` suite (`npx vitest run`), `npm run type-check`,
  and `npm run lint:check` before the review gate, per `/feature` Phase 4.
- Review each chunk against `/accessibility`'s checklist, not just this
  plan's per-chunk verify notes.
