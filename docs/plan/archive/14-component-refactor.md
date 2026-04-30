# Component refactor

**Status: not started.** This plan addresses the "components feel a bit messy"
intuition raised on 2026-04-28. It starts with a fresh inventory of what's
actually in the component layer today, *and* a survey of patterns that haven't
been extracted yet but could be. Plan 11 covers backend quality and security;
this is purely the Vue/UnoCSS side.

## Why we're doing this now

The frontend is at the awkward middle stage: the design export from `styling/`
gave us strong primitives (`.uw-screen`, `.uw-frame`, `.uw-actions__primary`,
chips), and pages were dropped in following the spec. But once pages started
needing variations the spec didn't cover — empty states, forms, confirmation
dialogs, AI activity cards inside chat bubbles — those got inlined. Inlining
was the right call at the time (don't extract until you've seen the pattern
twice). We've now seen most of them three or four times, and the cost of
*not* extracting is starting to outweigh the cost of extracting:

- Six pages each carry their own copy of the loading/error/empty triple.
- The `.uw-onb-link` text-button style is defined twice in two files,
  byte-identical. A single change requires editing both.
- Eight inline SVG icons repeat across pages. Tweaking the back-arrow once
  means finding it in three files.
- The `<div class="uw-screen">` shell with its two `aria-hidden` decorative
  divs and the `<div class="uw-frame">` inside is duplicated in every single
  page (8 times).

This is the moment where a half-day of extraction pays off forever.

---

## Part 1 — What's there today

### `frontend/src/components/`

| Component | Used in | Verdict |
|-----------|---------|---------|
| `ActivityCard.vue` | SuggestPage, StressPage, CounterbalancePage | Good. Reused 3×, well-shaped emit API. |
| `BottomNav.vue` | (used in app shell) | Fine. |
| `LinkButton.vue` | SuggestPage, StressPage, CounterbalancePage, ActivitiesListPage | Good. Reused 4×, but ambiguous role — see Part 2. |
| `OnboardingOptionList.vue` | OnboardingPage (steps 3, 4) | Good. Reused 2×. |
| `ThemeSelector.vue` | **nowhere** | Dead. Imported by no one. The "active" theme picker is inlined in `UserMenu.vue:30-52`. |
| `UserMenu.vue` | App layout | Fine, but contains its own theme-picker UI rather than using `ThemeSelector`. |

**Immediate action:** delete `ThemeSelector.vue` (or salvage its UI into
`UserMenu`). Either way, don't leave it sitting unused.

### Patterns that are inlined-instead-of-extracted

These appeared during the page-by-page read. Each one is a candidate for
extraction; some are higher-ROI than others.

#### A. The screen shell (8 occurrences)

Every page starts with this exact markup:

```vue
<div class="uw-screen">
  <div class="uw-screen__wash" aria-hidden="true" />
  <div class="uw-screen__glow" aria-hidden="true" />
  <div class="uw-frame">
    <!-- page content -->
  </div>
</div>
```

Identical in `SuggestPage`, `StressPage`, `CounterbalancePage`, `ActivitiesListPage`,
`OnboardingPage`, `ChatPage`, `LoginPage`, `PrivacyPage`. Eight pages, eight
copies.

This is a textbook case for a layout component with a default slot:
`<PageShell>...page content...</PageShell>`. ~5 lines saved per page = ~40
LOC. More importantly, decorative changes (e.g. removing the wash, adding a
filter on the glow) become a one-file edit.

#### B. The page header (3-4 variants, ≥5 occurrences)

```vue
<header class="uw-header">
  <button class="uw-menu-btn" :aria-label="$t('nav.back')" @click="$router.back()">
    <svg ... back-arrow ... />
  </button>
  <span class="uw-wordmark">unwind</span>
  <div class="w-[34px]" aria-hidden="true" />
</header>
```

This appears in `StressPage`, `CounterbalancePage`, `ChatPage` (with a
different right-side button). `SuggestPage` and `ActivitiesListPage` use a
simpler variant with just the wordmark. This calls for a single
`<PageHeader>` with a `back` slot/prop and a right slot:

```vue
<PageHeader>
  <template #left><BackButton @click="..." /></template>
  <template #right><IconButton :icon="..." /></template>
</PageHeader>
```

Or, since variants are bounded, props are simpler:

```vue
<PageHeader :back="true" />              <!-- back + wordmark + spacer -->
<PageHeader :back="true" right="reset" /> <!-- chat: back + wordmark + reset -->
<PageHeader />                            <!-- wordmark only -->
```

#### C. Loading / Error / Empty states (4-5 occurrences each)

Already flagged by the audit. Confirmed in the read:

- **Loading**: `flex-1 flex flex-col items-center justify-center gap-2` +
  `<span class="spinner" />` + muted text. Appears in `SuggestPage:13-21`,
  `StressPage:31-37`, `CounterbalancePage:31-37`, `ActivitiesListPage:13-22`,
  `OnboardingPage:168-177` (slight variant: gap-4, different padding).

- **Error**: same container shape, `<LinkButton>` retry. `SuggestPage:23-33`,
  `StressPage:39-47`, `CounterbalancePage:39-47`, `ActivitiesListPage:25-35`.

- **Empty**: same container shape, optional CTA. `SuggestPage:35-42`,
  `CounterbalancePage:107-114`, `StressPage:74-82`, `ActivitiesListPage:157-167`.

- **Result-state** (centered single-line message after finishing a flow):
  "accepted" big serif, "exhausted" small muted. Three pages.

Three components: `<StateLoading>`, `<StateError @retry>`, `<StateMessage>`
(used for empty + result both, since they're the same shape — centered text
with optional CTA slot).

#### D. Inline SVG icons (≥10 occurrences across 4 unique icons)

The same SVG paths are duplicated:

- **Back arrow** (`M10 3 L5 8 L10 13`): `StressPage`, `CounterbalancePage`,
  `ChatPage`. 3×.
- **Forward arrow** (`M3 8 h 10 M 9 4 l 4 4 -4 4`): `OnboardingPage` (step 1
  next, step 7 start), `ChatPage` send button, `ActivityCard` skip. 4×.
- **Checkmark** (`polyline points="3 8 6.5 11.5 13 5"`): `OnboardingPage`
  step 5 generate, `ActivityCard` accept. 2×.
- **Plus** (`M8 3 V 13 M 3 8 H 13`): `ChatPage` reset. 1× (would be 2× if
  the activities-list "+ new" got an icon).
- Plus three-dot menu, moon, head/hands/heart category icons, send arrow.

The maintenance cost is real: each SVG carries its own width/height/strokeWidth/
strokeLinecap/strokeLinejoin attributes, and they drift. Some have
`aria-hidden`, some don't.

Two extraction shapes are reasonable:

1. **One `<Icon>` component, name-keyed**:
   `<Icon name="back" />` / `<Icon name="forward" size="16" />`. Encapsulates
   all paths in one file. Easy to add icons.
2. **Per-icon components**: `<BackIcon />`, `<ForwardIcon />`, etc. More
   files, but shaker-friendly and tree-shakes per-page.

For ~8 icons, option 1 is simpler and the bundle-size argument is moot.

#### E. The pill / chip toggle button (5 occurrences across 4 variants)

The pattern is "round-cornered button that toggles selected state, fills with
primary color when selected." It appears in:

- `OnboardingPage:64-76` — large rounded-xl consent options
- `OnboardingPage:131-143` — small interest chips
- `StressPage:54-65` — round numbered stress dots
- `CounterbalancePage:54-103` — category list with round icon + label
- `ActivitiesListPage:113-126` — category pills in form

Each one inlines slightly different geometry. The shared logic is:

```
base classes + (selected ? selected-classes : unselected-classes)
```

A `<ToggleButton :selected="..." @click="...">{{ label }}</ToggleButton>`
component with size variants would absorb 4 of these. The 5th
(CounterbalancePage with the icon glyph) is structurally different (icon +
label, not just text) and probably stays bespoke. That's fine.

**Don't over-unify.** The consent options at `OnboardingPage:64-76` are
visually distinct (large rectangular pills, primary-fill-when-selected, used
as form choices). They could be a `<ChoiceCard>` rather than a `<ToggleButton>`
variant. Two components are better than one with eight props.

#### F. The "question N of M" header (4 occurrences)

In OnboardingPage steps 2, 3, 4, 5:

```vue
<div class="px-7 pt-14 flex flex-col gap-3">
  <span class="font-serif text-[17px] text-uw-ink-mute">
    {{ $t('onboarding.questionOf', { n: 2, total: 4 }) }}
  </span>
  <h2 class="font-serif text-[28px] leading-[1.22] tracking-[-0.4px] text-uw-ink">
    {{ $t('onboarding.consentQuestion') }}
  </h2>
</div>
```

Identical structure four times in one file. Trivial extraction:
`<OnboardingStepHeader :n="2" :title="$t('onboarding.consentQuestion')" />`.
Saves ~32 lines in OnboardingPage and makes the steps read as a list of
question definitions instead of repeated DOM.

#### G. Form input field (4 occurrences in one page)

`ActivitiesListPage` has four form fields, each:

```vue
<label class="flex flex-col gap-1.5">
  <span class="text-xs text-uw-ink-mute">{{ label }}</span>
  <input v-model="..." class="uw-input" ... />
</label>
```

Plus `.uw-input` defined as scoped CSS. Two options:

1. Promote `.uw-input` to `base.css` and live with the label-input pattern as
   inlined markup. Cheap, doesn't cost a component file.
2. Build `<TextField label="..." v-model="..." />`. More expensive but reads
   better in the form, and form-validation hooks (e.g. error prop) can be
   added in one place.

Given there's only one form in the entire app today, option 1 is correct.
Promote the class, leave the markup. Reconsider when the second form appears.

#### H. The "click-to-confirm" destructive button (2 occurrences)

`ActivitiesListPage:224-239` (delete activity) and `UserMenu:79-93` (delete
account) both implement the same UX: a button reads "Delete," clicking it
flips local state, the button re-renders with red text reading
"Confirm delete," second click runs the action.

Two options:

1. `<ConfirmButton :label="..." :confirm-label="..." @confirm="...">`
   with the state machine inside.
2. Leave it inlined — only two occurrences and the state machine is tiny.

Probably option 1, mostly because the inlined logic is just slightly tedious
enough that you'd be glad to delete it. But this is a 60/40 call; both are
defensible.

#### I. The text-only / muted button (`.uw-onb-link`, ≥8 occurrences)

The most blatant CSS duplicate in the codebase. Defined identically in
`OnboardingPage.vue:318-328` and `ActivitiesListPage.vue:394-404`. Used in
both pages plus referenced from comments saying "same as in OnboardingPage."

Two fixes, one is right:

- **Promote to `base.css`** as `.uw-text-button` (rename — `uw-onb-link` is
  named after one specific use site, which is misleading). Delete both scoped
  duplicates.
- Optionally wrap as `<TextButton>` Vue component — but the class alone
  serves all current uses and the markup is just `<button class="..." @click>text</button>`.

Promote the class. No component needed.

### Things that are NOT problems

- **`useSuggestionFlow`, `useActivities`, `useTheme`** are correctly shared.
  Pages don't recompute the same derived state.
- **Theme tokens / UnoCSS shortcuts** are well-factored (see the UnoCSS audit
  in conversation log).
- **`ActivityCard`** is the right size and shape — three pages use it with
  zero divergence.

---

## Part 2 — Tradeoffs and judgment calls

### `LinkButton` vs the new `TextButton`

`LinkButton.vue` exists and is used as the retry-action in error states. It's
visually similar to `.uw-onb-link` (text-only, muted, click) but rendered
slightly differently. Two components doing similar things is itself a smell.

Two paths forward:

- **Merge**: rename `LinkButton` to `TextButton`, make it use the
  to-be-promoted `.uw-text-button` class, retire `.uw-onb-link`. One concept,
  one component.
- **Differentiate**: keep `LinkButton` for error-retry semantics (smaller,
  underlined?) and use `.uw-text-button` for skip/cancel/inline-action. Two
  components but with clear, different roles.

Recommendation: **merge.** Right now they look the same in the wild; pretending
they're different roles is post-hoc rationalization.

### `<PageHeader>` props-vs-slots

Slots make the API flexible (any custom right-side button). Props make the
API discoverable (you can grep for `<PageHeader back`). For three known
variants and no current need for arbitrary content, props win on
discoverability.

### "Don't extract until you've seen it three times" — when has been ignored

Most extractions in this plan have ≥3 occurrences. The exceptions:

- `<ConfirmButton>` (2 occurrences) — borderline, see above.
- `<OnboardingStepHeader>` (4 occurrences but all in one file) — the rule of
  three is for *cross-file* duplication; in-file repetition is fine if the
  reads-as-a-list framing is more valuable. Here it is.

---

## Part 3 — Implementation phases

The phases are ordered by **biggest-cleanup-per-minute first**, with one
exception: phase 1 (delete dead code + promote class) is placed before phase 2
because phase 2 references the promoted class.

### Phase 1 — Deletions and promotions (≈30 min)

- Delete `frontend/src/components/ThemeSelector.vue`. Confirm with grep that
  nothing imports it.
- Move `.uw-onb-link` from `OnboardingPage.vue` and `ActivitiesListPage.vue`
  scoped styles into `frontend/src/assets/base.css` as `.uw-text-button`.
- Search-and-replace `uw-onb-link` → `uw-text-button` in the two pages.
- Verify both pages still render identically.

**Done when:** `grep -r uw-onb-link frontend/src` returns zero hits.
`ThemeSelector.vue` no longer exists.

### Phase 2 — `<PageShell>` (≈30 min)

- Create `frontend/src/components/PageShell.vue`:
  ```vue
  <template>
    <div class="uw-screen">
      <div class="uw-screen__wash" aria-hidden="true" />
      <div class="uw-screen__glow" aria-hidden="true" />
      <div class="uw-frame">
        <slot />
      </div>
    </div>
  </template>
  ```
- Replace the shell markup in all 8 pages.
- Smoke-test each route in the dev server.

**Done when:** Every page wraps its content in `<PageShell>`. The two
`aria-hidden` decorative divs no longer appear in any page file.

### Phase 3 — Icons (≈45 min)

- Create `frontend/src/components/Icon.vue` with a switch on `name`:
  ```vue
  <template>
    <svg :width="size" :height="size" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <path v-if="name === 'back'" d="M10 3 L5 8 L10 13" />
      <path v-else-if="name === 'forward'" d="M3 8 h 10 M 9 4 l 4 4 -4 4" />
      <polyline v-else-if="name === 'check'" points="3 8 6.5 11.5 13 5" />
      <path v-else-if="name === 'plus'" d="M8 3 V 13 M 3 8 H 13" />
      <!-- ... -->
    </svg>
  </template>
  ```
- Replace inline SVGs across pages.
- Cataloged icons: `back`, `forward`, `check`, `plus`, `menu-dots`, `moon`,
  `head`, `hands`, `heart` (the last three from CounterbalancePage).
- Decide a default size (16) and let pages override with `:size="14"`.

**Done when:** No `<svg>` literal appears in any `pages/*.vue` file. (Animations
or decorative elements may stay inline if they're not "icons".)

### Phase 4 — `<PageHeader>` (≈30 min)

- Create `frontend/src/components/PageHeader.vue` with three modes
  (no-back / back-only / back-with-action) using props.
- Replace headers in `StressPage`, `CounterbalancePage`, `ChatPage`,
  `SuggestPage`, `ActivitiesListPage`.
- Keep the wordmark text as a child of the header — translatable / theme-able
  in one place.

**Done when:** `<header class="uw-header">` does not appear in any
`pages/*.vue`. Each page renders the same header it did before.

### Phase 5 — State components (≈45 min)

- Create three components in `frontend/src/components/`:
  - `StateLoading.vue` — spinner + optional caption slot.
  - `StateError.vue` — message + retry button (emits `@retry`).
  - `StateMessage.vue` — message + optional CTA slot. Used for empty AND
    result-state.
- Replace the loading/error/empty/result blocks across `SuggestPage`,
  `StressPage`, `CounterbalancePage`, `ActivitiesListPage`. Onboarding's
  loading screen is bespoke enough (different padding, animated text) that
  it can stay or use the component with overrides — your call.

**Done when:** No page contains the literal class string
`flex-1 flex flex-col items-center justify-center` more than once (most pages
will lose 2-3 instances of it).

### Phase 6 — `<ToggleButton>` and `<OnboardingStepHeader>` (≈45 min)

- Build `<ToggleButton :selected size="sm|md|lg">` for the chip/pill toggles
  in OnboardingPage (interests), StressPage (stress dots, but verify it fits;
  the round geometry may want its own component), and ActivitiesListPage
  (category pills).
- Build `<OnboardingStepHeader :n :title>` and use it in OnboardingPage
  steps 2-5.
- Don't try to absorb `OnboardingPage`'s consent options
  (lines 64-76) into `ToggleButton` — they're a different shape (large cards,
  not pills).

**Done when:** The four `OnboardingPage` step headers read as one-line
component invocations. The interest chips and category pills use the same
component.

### Phase 7 — `LinkButton` consolidation (≈30 min)

- Decide: merge `LinkButton` into `TextButton` (one concept, one component),
  or differentiate with a clear semantic split.
- If merging: rename component, update all imports, retire one of the two
  styles.
- If differentiating: rename `LinkButton` to `RetryButton` (or similar) so the
  intent is in the name.

**Done when:** Reading the imports in each page tells you why each
text-style button is there.

### Phase 8 — Optional: `<ConfirmButton>` (≈20 min, skip if you'd rather)

- Build the two-state click-to-confirm component if the inline duplication
  bothers you. If not, skip — only two consumers, the gain is small.

---

## What we're explicitly NOT doing

- **Pinia / state management.** The composables work. Don't add abstraction
  weight.
- **Form library.** One form in the app. Promote `.uw-input` to `base.css` and
  move on.
- **Generic `<Button>` component.** The `.uw-actions__primary` /
  `.uw-actions__secondary` / `.uw-text-button` class set is sufficient. A
  generic Button with `variant="primary|secondary|text"` is the kind of
  abstraction that buys nothing here.
- **Mobile-only / responsive components.** The whole app is mobile-first;
  there's nothing to abstract across.
- **Storybook.** ~100 users, six themes verifiable by clicking around in the
  dev server. Not justified.

---

## Estimated total

About 4 hours of focused work, split across 8 phases. Each phase can ship
independently — pause anywhere and the codebase is in a strictly better
state than before. After phase 5 you'll have eliminated essentially all
the cross-page duplication that motivated this plan.

The single highest-ROI phase is **Phase 2 (`<PageShell>`)**: 30 minutes,
removes ~40 lines of identical markup from 8 files, and any future
shell-wide change becomes a one-file edit. If you only do one phase, do
that one.
