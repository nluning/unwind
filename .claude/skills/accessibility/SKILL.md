---
name: accessibility
description: |
  Accessibility standards for Unwind's Vue frontend — WCAG fundamentals plus
  neurodivergence-specific design considerations, since this app is built for
  ND users. Use when writing or modifying any frontend UI (components, pages,
  composables with templates — buttons, forms, modals, menus, chat, toggles,
  theme code) and as a standard part of reviewing any frontend diff, alongside
  correctness and conventions.
---

# Accessibility

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Semantic HTML & Landmarks](#semantic-html--landmarks)
3. [ARIA Patterns](#aria-patterns)
4. [Forms & Errors](#forms--errors)
5. [Keyboard & Focus](#keyboard--focus)
6. [Live Regions & Async Content](#live-regions--async-content)
7. [Color & Contrast](#color--contrast)
8. [Motion & Sensory Load](#motion--sensory-load)
9. [Neurodivergence-Specific Design](#neurodivergence-specific-design)
10. [Quality Checklist](#quality-checklist)
11. [When Reviewing](#when-reviewing)

---

## Core Philosophy

Unwind is built for neurodivergent brains that struggle to switch off (see
root `CLAUDE.md`). Accessibility here means two overlapping things:

1. **Standard WCAG 2.2 AA** — perceivable, operable, understandable, robust.
   This covers screen readers, keyboard users, low vision, motor impairment.
2. **Neurodivergent-specific design** — executive function, sensory
   sensitivity, cognitive load, and emotional regulation. This audience is
   *more* likely to be derailed by unpredictable UI, sensory overload, or
   ambiguous copy than the median user — see
   [Neurodivergence-Specific Design](#neurodivergence-specific-design).

Treat both as first-class, not a checklist bolted on at the end. A change
that adds an interactive element without considering how a screen reader,
keyboard user, or an overwhelmed user in mid-executive-dysfunction encounters
it is not done yet.

**Don't over-engineer.** Per CLAUDE.md, this is a ~100-user app, not
enterprise scale — don't build a full design-system-level a11y abstraction
for one button. Apply the patterns below directly and consistently; that's
enough.

---

## Semantic HTML & Landmarks

- Interactive elements are real `<button>`/`<a>`/`<input>`, never a `<div>`
  with a `@click`. Unwind already does this consistently — keep it that way.
- One `<h1>` per page/route describing the page's purpose; don't skip levels
  (`<h1>` → `<h3>`). Known gap: onboarding step views render an `<h2>`
  (`OnboardingStepHeader.vue`) with no `<h1>` in that state — if you touch
  onboarding headers, fix the hierarchy rather than adding another skip.
- `<nav>` for navigation groups (see `UserMenu.vue:52`), `<main>` for the
  page's primary content. Known gap: most pages don't wrap content in
  `<main>` (only `LoginPage.vue` does) — if you're touching `PageShell.vue`
  or adding a new page, add the landmark rather than perpetuating the gap.
- `lang="nl"` is set once on `<html>` (`index.html`) and must stay in sync
  with the single-locale i18n setup — don't introduce per-component locale
  switches without revisiting this.
- No clickable `<div>`s, ever — this is a hard rule already followed
  project-wide, not a suggestion.

---

## ARIA Patterns

The codebase already has the right patterns in some places — copy them, don't
reinvent:

| Pattern | Copy this example | Rule |
|---|---|---|
| Icon-only button | `UserMenu.vue:6-13`, `ActivityActionSheet.vue:39-46` | `aria-label` on the button, icon itself `aria-hidden="true"` (see any `components/icons/*.vue`) |
| Toggle / pressed state | `UserMenu.vue:33` (`aria-pressed` on the theme swatches) | Any control that's "on/off" or "selected/not" needs `aria-pressed` (binary) or `aria-checked` (checkbox-like) reflecting real state — **not just a background-color class** |
| Expandable menu | `UserMenu.vue:9` (`aria-expanded`) | Any disclosure toggle (dropdown, accordion, filter panel) sets `aria-expanded` on the trigger |
| Modal/sheet | `ActivityActionSheet.vue:15-19` (`role="dialog"`, `aria-modal="true"`, `tabindex="-1"`, `@keydown.esc`) | Any modal/bottom-sheet needs this trio at minimum — see [Keyboard & Focus](#keyboard--focus) for what it's still missing |
| Live status | `MenuHintTooltip.vue:2-4` (`role="status"`, `aria-live="polite"`) | Any transient, non-modal message that appears without user action |
| Decorative separator | `ChatPage.vue:82` (`aria-hidden="true"` on a visual `·`) | Any purely visual glyph/divider gets `aria-hidden` |

**Known gaps to fix wherever you touch these files** (don't leave them worse,
and consider fixing outright if you're already in the file):

- `ToggleButton.vue` — used for onboarding interests and category filters,
  has a `selected` prop driving styling but no `aria-pressed`. Add
  `:aria-pressed="selected"` on the root button.
- `StressLevelPicker.vue` — five numbered buttons, selection shown only via
  background color (`:class` block, line 8-14). Add `aria-pressed` per
  button and consider an `aria-label` clarifying what the number means
  (e.g. "stress level 3 of 5") since a bare digit is ambiguous out of visual
  context.

**General ARIA rules:**

- Prefer semantic HTML over ARIA (`<button>` needs no `role="button"`). ARIA
  is for the gaps semantic HTML can't fill (custom dialogs, live regions,
  pressed state on a styled button).
- Never add `aria-label` to something already labeled by visible text —
  it silently overrides the text for screen readers and will drift out of
  sync with the copy over time.
- `aria-hidden="true"` only on purely decorative content that has zero
  informational value on its own (icons paired with a labeled button,
  visual dividers). Never on something a keyboard/AT user still needs to
  reach.

---

## Forms & Errors

- Inputs are wrapped in or associated with a real `<label>` — see
  `TextField.vue:2-20`, `LoginPage.vue:18-38`. Don't use `placeholder` as a
  label substitute.
- Error messages use `role="alert"` (`LoginPage.vue:40`) so they're announced
  without the user having to find them.
- If a form ever grows *per-field* errors (currently errors are page-level),
  link each error to its input with `aria-describedby` — don't rely on
  visual proximity alone.
- Never disable browser autofill/autocomplete without a specific reason —
  re-typing information is exactly the kind of friction that costs
  neurodivergent users disproportionately (see
  [Neurodivergence-Specific Design](#neurodivergence-specific-design)).

---

## Keyboard & Focus

- Every interactive element must be reachable and operable via keyboard
  alone. Swipe-based interactions (`useCardSwipe.ts`) must always ship a real
  `<button>` fallback for the same action — this is already the pattern for
  accept/skip, keep it for any new swipe gesture.
- **Modals/sheets** (`ActivityActionSheet.vue` is the closest existing
  pattern): on open, move focus into the dialog (`sheet.value?.focus()`,
  line 151) and close on Escape (line 19) — both already present. Still
  missing project-wide, add when you touch a modal:
  - **Focus trap**: Tab/Shift+Tab should cycle within the dialog, not escape
    to the page behind it.
  - **Focus restoration**: closing should return focus to the element that
    opened it (store a ref to the trigger before opening).
- **Dropdowns/menus** (`UserMenu.vue`, `SuggestFilters.vue`): currently
  open/close only on click, with no Escape-to-close, no arrow-key movement
  between items, and no focus return on close. If you touch either file,
  bring it in line with `ActivityActionSheet`'s Escape pattern at minimum.
- **Visible focus styling**: only `.uw-input:focus` has any focus treatment
  today (`base.css:496`, border-color only). Custom buttons
  (`.uw-menu-btn`, `.uw-home-btn`, `.uw-text-button`, swipe actions, theme
  swatches) rely entirely on the browser default outline, which is easy to
  lose against the gradient backgrounds. When adding a new interactive
  class, add a `:focus-visible` rule rather than assuming the default is
  enough:
  ```css
  .uw-your-new-button:focus-visible {
    outline: 2px solid var(--uw-primary);
    outline-offset: 2px;
  }
  ```
- Never remove focus outlines (`outline: none`) without replacing them with
  an equally visible `:focus-visible` style.
- Autofocus is fine for the *first* field of a fresh flow (e.g. chat input)
  but never for something that steals focus from where the user's attention
  already is — see [Neurodivergence-Specific Design](#neurodivergence-specific-design)
  on unpredictability.

---

## Live Regions & Async Content

- Any content that updates **without a direct user action on that element**
  needs an `aria-live` region so screen reader users aren't left with stale
  state. `MenuHintTooltip.vue` already does this correctly
  (`role="status" aria-live="polite"`) — reuse that pattern.
- **Chat streaming is the biggest gap in the app today.** `ChatPage.vue`'s
  message container (around line 49-112) renders streamed assistant text
  with no live region — a screen reader user gets no signal that a response
  is arriving or has finished. If you touch the chat UI, add an
  `aria-live="polite"` region (don't announce every token — announce once
  streaming completes, or debounce, to avoid a firehose of interruptions).
- Loading states (`StateLoading.vue` and friends) should also be
  announced (`role="status"`) so a user isn't left wondering if the app
  hung — relevant everywhere, not just chat.
- Don't use `aria-live="assertive"` unless something genuinely needs to
  interrupt — for this audience, unnecessary interruptions are actively
  counterproductive (see sensory/executive-function notes below). Default to
  `"polite"`.

---

## Color & Contrast

- WCAG AA minimums: **4.5:1** for normal text, **3:1** for large text
  (≥24px or ≥19px bold) and for UI component boundaries/icons that convey
  meaning (e.g. a selected-state border).
- Unwind has three colour themes (calm/warm/playful) — no separate
  light/dark mode. Check contrast **per theme you touch**, not just the one
  you're looking at — a value that passes in `calm` can fail in `warm`.
- Be careful with `--uw-ink-mute`-style muted text (partial-opacity ink over
  a gradient background, e.g. `base.css:64`/`82`) — spot-check contrast at
  the lighter end of the gradient (`--uw-bg-start`), not just the midpoint,
  with a real contrast checker before shipping a new muted-text usage.
- Never convey state (selected, error, success) through color alone — pair
  it with a text label, icon, or ARIA attribute (this is also why
  `aria-pressed` matters even when the selected state is visually obvious).

---

## Motion & Sensory Load

Neurodivergent users (and vestibular-disorder users generally) are
disproportionately affected by motion and sensory intensity:

- Respect `prefers-reduced-motion` for any non-essential animation
  (transitions, the swipe-card physics, the chat typing indicator). Wrap
  animation CSS:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .uw-your-animated-thing {
      animation: none;
      transition: none;
    }
  }
  ```
- No autoplaying audio/video, ever.
- No flashing/strobing content (WCAG hard rule: nothing flashes more than
  3 times/second).
- Avoid gratuitous parallax, auto-scrolling, or attention-grabbing motion
  that isn't communicating a state change.

---

## Neurodivergence-Specific Design

This section goes beyond WCAG — it's specific to who this app is *for*, per
the project's own framing ("neurodivergent brains that struggle to switch
off"). When in doubt, weigh a UI decision against these:

- **Predictability over surprise.** Navigation, button placement, and
  interaction patterns should stay consistent across the app. Don't
  introduce a one-off interaction pattern for a single screen when an
  existing pattern already does the job (e.g. don't invent a new dismiss
  gesture when the sheet-swipe-to-close pattern already exists).
- **Low cognitive load, one thing at a time.** The onboarding flow's
  tappable-form-over-conversation decision (see project status notes —
  typing was found to be a dealbreaker for depleted users in the review
  panel) is the model: prefer selection over free text, chunk information,
  show progress ("Vraag 1 van 5" in `OnboardingStepHeader.vue`) rather than
  an undifferentiated wall of steps.
- **Executive-function-friendly, not memory-dependent.** Don't require the
  user to remember something from a previous screen; don't make undo
  impossible. The two-tap delete pattern in `ActivityActionSheet.vue`
  (`handleDeleteTap`, line 126) — first tap arms, second confirms — is the
  right shape for destructive actions: it prevents accidental loss without
  a jarring native `confirm()` dialog. Reuse it rather than a browser
  confirm or a silent instant-delete.
- **No artificial time pressure.** Avoid session timeouts, countdowns, or
  auto-advancing steps without an explicit user action, unless there's a
  hard technical reason (e.g. rate limiting) — and if there is, communicate
  it calmly and in advance, not as a sudden block.
- **Calm error tone.** Error and empty states should read as informative,
  not alarming — this audience is often already stressed when using the
  app (it's explicitly for people trying to de-stress). Avoid harsh red,
  exclamation-heavy copy, or blame-toned language ("You did something
  wrong") in favor of neutral, solution-oriented phrasing. Reserve strong
  visual alarm (`--uw-danger`) for genuinely destructive/irreversible
  actions, not for recoverable errors like a failed network request.
- **Plain, literal language.** Dutch copy should avoid idiom, sarcasm, or
  ambiguity that could read multiple ways — say what you mean directly.
  This matters more than usual since some ND users process figurative
  language literally.
- **Respect "don't grab my attention."** Avoid auto-focus that yanks
  keyboard/scroll position away from where the user currently is; avoid
  unsolicited modals/popups unless directly triggered by the user's own
  action (the existing `MenuHintTooltip` is a borderline case — it's
  low-intensity and dismissible, which is the right shape if you add
  anything similar).

---

## Quality Checklist

Before finalizing any frontend UI change:

- [ ] All interactive elements are real `<button>`/`<a>`/`<input>` — no
      clickable `<div>`s
- [ ] Icon-only buttons have `aria-label`; decorative icons/glyphs have
      `aria-hidden="true"`
- [ ] Toggle/selected state is reflected in `aria-pressed`/`aria-checked`,
      not just a CSS class
- [ ] Any new modal/sheet moves focus in on open, closes on Escape, traps
      Tab, and restores focus to the trigger on close
- [ ] Any new dropdown/menu closes on Escape and restores focus on close
- [ ] New interactive classes have a visible `:focus-visible` style
- [ ] Content that updates without direct user action has an
      `aria-live="polite"` region (or `role="status"`)
- [ ] New color-conveyed state also has a non-color signal (label, icon,
      ARIA)
- [ ] Contrast checked against **every** theme variant the component
      renders in, not just the one you tested in
- [ ] New animation respects `prefers-reduced-motion`
- [ ] No new time pressure (auto-advance, session timeout) introduced
      without explicit user action
- [ ] Error/empty-state copy reads calm and solution-oriented, not alarming
- [ ] `npm run type-check` and the relevant Vitest suite still pass

---

## When Reviewing

Apply this as a standing checklist for any frontend diff, alongside
correctness and conventions — not just when a11y is explicitly called out.

**Flag these:**

- A new clickable `<div>`/`<span>` instead of a real interactive element
- A new icon-only button with no `aria-label`
- A new toggle/selection control with no `aria-pressed`/`aria-checked` —
  point at `UserMenu.vue`'s theme swatches as the pattern to follow
- A new modal/dropdown that doesn't close on Escape or doesn't restore
  focus — point at `ActivityActionSheet.vue` as the closest existing
  reference, while noting it's not fully solved there either (no focus trap)
- New content appearing without user action and no live region
- State conveyed by color alone
- A new animation with no `prefers-reduced-motion` guard
- Copy that's alarming in tone for a recoverable error, or introduces
  unexplained time pressure
- Contrast that looks borderline in any of the three colour theme variants

**Don't block on:**

- Existing known gaps in files the diff doesn't touch (the dropdown/menu
  focus-trap gap, the missing `<main>` landmarks, the missing
  `aria-pressed` on `ToggleButton`/`StressLevelPicker`) — these are tracked
  above as "known gaps," not this diff's problem, unless the diff happens
  to touch those exact files
- Perfect axe-core-zero-violations — there's no automated a11y tooling
  wired up yet (no `eslint-plugin-vuejs-accessibility`, no `axe-core`); this
  skill is the substitute for now. Flagging that gap once is useful,
  re-flagging it on every review isn't.
