# Filter activities on the Suggest page

Issue: #94 — https://github.com/nluning/unwind/issues/94

## Context

The Suggest page (`/suggest`) is the app's home and core flow. Suggestions are
currently drawn from the entire activity pool with no way to steer them. Users
want lightweight, in-place control over *what* gets suggested — by stress level
and by category — without leaving the page or starting a different mode.

This is purely a **client-side** narrowing of the already-fetched activity pool.
No backend, no schema, no new API calls.

## Decisions (confirmed with Noor)

- **Categories**: inclusion — show only selected categories; none selected = all.
- **Stress level**: single level 1–5, matched against each activity's
  `min_stress_level`/`max_stress_level` range. Optional; unset = all levels.
- **"Filtering is on"** = a stress level is set **or** ≥1 category is selected.
- Filter state is in-memory (survives navigation, not reload) — matching the
  existing `stressLevelState` / `excludedCategoriesState` pattern. Persisting
  across reload/devices is out of scope.

## How it fits the existing architecture

`SuggestPage.vue` already feeds a `pool = computed(() => activities.value)` into
`useSuggestionFlow({ mode: 'mode1', pool })`. The flow's `watch(pool)` already
does the right thing: the first non-empty pool restores the persisted
suggestion; **any later pool change yields a fresh suggestion**
(`useSuggestionFlow.ts:57-81`). So filtering reduces to: make `pool` apply the
active filters, and the suggestion auto-refreshes when filters change.

Reused building blocks:
- `filterByStress(level)` — `useActivities.ts:44`
- `CATEGORY_ID_MAP` (Head/Hands/Heart) — `useActivities.ts:10`
- The 1–5 round-button stress picker — currently inline in `StressPage.vue:12-31`
- `ToggleButton.vue` — pill with a `selected` state, for category toggles
- `uw-menu-btn` button style + the fixed top-corner positioning pattern from
  `UserMenu.vue:1-13` (mirror it on the **left**, opposite the menu on the right)
- `categories.*`, `stress.low`, `stress.high` i18n keys (`nl.json`)

## Implementation (small, reviewable chunks)

### 1. Filter state — `composables/useSuggestionFlow.ts`
Add two module-level refs next to the existing picker state (line ~34) so they
share the same lifecycle and central reset:
```ts
export const suggestFilterStressState = ref<number | null>(null)
export const suggestFilterCategoriesState = ref<string[]>([])
```
Clear both inside `resetSuggestionFlowState()` (line ~37) so they reset on
login/register/deviceLogin/logout/delete — `useAuth.ts` already calls this in
all six places, so no `useAuth` changes are needed.

### 2. Composable filter helpers — `composables/useActivities.ts`
- Give `filterByStress` and `filterByExcludedCategories` an optional
  `source: Activity[] = activities.value` param (backward compatible) so filters
  compose.
- Add `filterByIncludedCategories(categories, source = activities.value)` —
  mirror of the exclude helper: keep activities whose `categories` intersect the
  selection. Export it from the `useActivities` return object.

### 3. Extract `components/StressLevelPicker.vue` (presentational)
Move the 5 round buttons + low/high labels out of `StressPage.vue` into a
reusable component:
- Props: `modelValue: number | null`, `clearable?: boolean` (default false).
- Emits `update:modelValue`. Clicking a level selects it; if `clearable` and the
  clicked level is already selected, it clears to `null` (needed for the
  optional filter; StressPage keeps `clearable=false`).
- Update `StressPage.vue` to use `<StressLevelPicker v-model="stressLevel" />` —
  behavior unchanged there. Genuine reuse, removes duplication.

### 4. New `components/SuggestFilters.vue` (self-contained, like UserMenu)
Owns the button **and** the panel, reads/writes the module filter state:
- **Button**: fixed top-left (`top-[18px] left-[22px]`, mirrors UserMenu),
  `uw-menu-btn` style, new `FilterIcon`. When filtering is active, apply the
  filled-primary variant (same `bg-uw-primary text-uw-primary-fg` treatment
  ToggleButton/StressPage selected state uses). `aria-label` + `aria-expanded`.
- **Panel**: opens on tap (toggle), closes on tap-again, on a Done button, and
  on click-outside (reuse UserMenu's `handleClickOutside` pattern). Card styling
  matching the UserMenu dropdown. Contents:
  - Stress section (label `filter.stress`): `<StressLevelPicker clearable v-model=...>`
  - Categories section (label `filter.categories`): three `ToggleButton`s
    (Head/Hands/Heart) bound to `suggestFilterCategoriesState` (toggle in/out).
  - A "clear filters" `TextButton` (`filter.clear`), shown when filtering active.
  - A Done/close button (`filter.done`).
- Because pool is reactive, filters apply live; the panel covering the card means
  the user sees the result on close — satisfying "closing applies the filters."

### 5. New `components/icons/FilterIcon.vue`
A funnel SVG matching the existing icon convention (16×16 viewBox,
`fill="currentColor"`, `size` prop default 16) — same shape as `MenuLinesIcon.vue`.

### 6. Wire into `SuggestPage.vue`
- Import `suggestFilterStressState`, `suggestFilterCategoriesState`,
  `filterByStress`, `filterByIncludedCategories`.
- Replace the pool computed:
  ```ts
  const pool = computed(() => {
    let result = activities.value
    if (filterStress.value !== null) result = filterByStress(filterStress.value, result)
    if (filterCategories.value.length > 0)
      result = filterByIncludedCategories(filterCategories.value, result)
    return result
  })
  ```
- Render `<SuggestFilters />` in the non-welcome branch once activities are
  loaded (alongside `PageHeader`).
- Add a **filtered-empty** state: when `loaded && !isEmpty && pool.length === 0`,
  show a "no activities match these filters" message (`filter.noMatch`) with a
  clear-filters action — placed in the template *before* the `current` branch so
  a stale `current` card can't show. (The flow's `watch` returns early on an
  empty pool and leaves `current` stale; template ordering handles display, like
  `StressPage.vue:34`.)

### 7. i18n — `frontend/src/locales/nl.json`
Add a `filter` section (Dutch):
- `filter.label` — "Filter" (aria-label on the button)
- `filter.title` — e.g. "Filter suggesties"
- `filter.stress` — "Stressniveau"
- `filter.categories` — "Categorieën"
- `filter.noMatch` — "Geen activiteiten passen bij deze filters."
- `filter.clear` — "Filters wissen"
- `filter.done` — "Klaar"

(Reuse existing `categories.*`, `stress.low`, `stress.high`.)

### 8. Light test — `composables/useActivities` (Vitest)
Add a focused unit test for `filterByIncludedCategories` (and the optional
`source` arg composing with `filterByStress`): empty selection returns all,
single/multi category intersect correctly, composition narrows as expected.
Follows the `/test` skill patterns; keeps the new pure logic covered.

## Files

- `frontend/src/composables/useSuggestionFlow.ts` (state + reset)
- `frontend/src/composables/useActivities.ts` (helpers)
- `frontend/src/components/StressLevelPicker.vue` (new, extracted)
- `frontend/src/pages/StressPage.vue` (use extracted picker)
- `frontend/src/components/SuggestFilters.vue` (new)
- `frontend/src/components/icons/FilterIcon.vue` (new)
- `frontend/src/pages/SuggestPage.vue` (pool + render + empty state)
- `frontend/src/locales/nl.json` (strings)
- `frontend/src/composables/*.spec.ts` (filter helper test)

## Out of scope

- Persisting filters across reload / devices
- Filtering on Stress / Counterbalance / chat modes
- Any backend / schema / API change

## Verification

1. `cd frontend && npm run lint:check && npx vue-tsc --noEmit && npm run test`
   — type-check, lint, and the new unit test pass.
2. Run the app (`npm run dev` in `frontend`, backend running) and on `/suggest`:
   - Filter button shows top-left; tapping opens the panel.
   - Pick a stress level → close → suggestion respects the level. Re-open, tap
     the same level → clears.
   - Select one/more categories → suggestions only from those categories.
   - Combine stress + category → pool narrows by both.
   - Button shows the active (filled) styling whenever a filter is set.
   - Over-restrictive filters → "no activities match" message + clear action;
     clearing returns to the full pool.
   - Navigate away and back → filters persist (in-memory).
3. Confirm `StressPage` still works unchanged after the picker extraction.
