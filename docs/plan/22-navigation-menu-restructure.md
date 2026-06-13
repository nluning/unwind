# Navigation / menu restructure — implementation plan

**Status: COMPLETE (2026-06-13).** All chunks (1–6) built and committed; Chunk 7's
automated gate passes (`lint:check`, `vue-tsc --noEmit`, `build` all clean). Only the
manual UX walkthrough (Chunk 7.2) remains optional. Derived from
`docs/review/reports/009-navigation-menu-restructure.md` (2026-06-12).**
**Reads on top of:** report 009 (the design + persona verdicts), plan 20/21 (the
*Jouw activiteiten* restructure this builds on), ADR-012 (device-first auth /
menu-as-opt-in). Supersedes the menu shape locked in plan 21 §4 where it conflicts.

This file translates report 009's settled decisions into concrete, reviewable chunks
against the current codebase. Each chunk is sized to the AI-collaboration workflow
(a component, a route param, a copy pass — not the whole feature) so it can be
reviewed with why/what-if/trace questions before the next starts.

---

## The one-line summary

The three triggering problems are one problem: **the menu had no explicit
navigation model.** The fix is a hub-and-spoke model made physical:

- **Hub** = the core page `/suggest` (renamed *"iets voor nu"*).
- **Spokes** = every other in-app page.
- **Return to hub** = a single persistent, themed, round **home button** in a fixed
  corner on every spoke — *not* a menu item, *not* history-based back.
- The **menu** becomes a flat list of opt-in detours (list / add / two AI routes /
  account), grouped by **dividers only**, no headers, no colour.
- The **back chevron** is reserved for stepping back *within* a multi-step flow.

---

## Decisions locked before building

From report 009 plus the three micro-decisions settled with Noor (2026-06-12):

1. **Core rename → "iets voor nu"** (unanimous persona pick). Replaces "Verras me".
2. **Home button is the sole route back** — fixed corner, never moving; unambiguous
   house icon; theme-primary (`var(--uw-primary)`), **static + desaturated, no
   glow/animation**. These are requirements, not polish (Sanne won't experiment in
   shutdown).
3. **Split add from view-list** — two menu entries, both → `/activities`; the add
   entry uses `?new=1` to open the form on mount. No new route/page.
4. **Add-entry label → "zelf iets toevoegen"** (Noor's pick over "Nieuw" /
   "iets toevoegen" — most explicit that it's the user's own addition vs AI ideas).
5. **Dividers only, no group headers, no zone colour** — let the home button be the
   only thing that earns colour attention.
6. **Privacyverklaring → demoted to a footer link on `/account`**, removed from the
   menu (Noor confirmed).
7. **Menu panel stays a top dropdown** — bottom-sheet is deferred (Noor confirmed).
8. **Chevron = in-flow step-back only.** Home button and chevron are deliberately
   different controls (shape, colour, icon, job) so they never overload one affordance.

### One micro-decision still open (resolve at Chunk 5, sensible default chosen)

- **Where does "iets voor nu" become *visible*?** With the suggest menu link removed
  and `suggest.heading` intentionally empty (calm landing), the rename currently only
  surfaces in the home button's accessible name. **Default:** use it as the home
  button's `aria-label` ("Naar iets voor nu") and *do not* fill the empty suggest
  heading (preserve the calm core). Flag to Noor; flip only if she wants the core
  screen to show the name.

---

## Current-state assessment (what already exists)

| Report 009 item | Current state in code | Work needed |
|---|---|---|
| **Home button** | Does not exist. No `HomeIcon`. Closest visual family is `.uw-badge` (40px round, `var(--uw-primary)`, `base.css:337`). | New `HomeIcon.vue` + `HomeButton.vue` + `.uw-home-btn` style + global mount in `App.vue`. |
| **Back = home, never `router.back()`** | `PageHeader.vue` has a `back` prop emitting `back`; `SuggestFromListPage`, `AccountPage`, `QuickSuggestPage` wire it to `$router.back()`. `QuickSuggestPage.handleBack()` falls through to `history.back()` (guarded by `window.history.length > 1`) at step 1. | Remove the header `$router.back()` chevron from spokes; home button replaces "leave". Fix QuickSuggest step-1 back → `/suggest`. |
| **Menu: remove suggest link, headers, privacy** | `UserMenu.vue` has the `/suggest` link (`:57`), `<h3>` headers (`:69`, `:96`), and the `/privacy` link (`:105`). Globally mounted, top-right fixed. | Rewrite the `<nav>`: drop suggest link, drop headers (dividers only), split add/list, drop privacy. |
| **Split add / view-list** | `UserMenu` has one entry `jouwActiviteiten.selfAdd → /activities`. `ActivitiesListPage` opens its inline form via `startCreating()` (sets `editing='new'`) — no query trigger. | Two menu entries; `?new=1` handling in `ActivitiesListPage`. |
| **Privacy → account footer** | `PrivacyPage` is `meta.public` (no chrome there). Reached today from the menu. | Footer link on `AccountPage`; adjust `PrivacyPage` back target. |
| **Core rename + relabels** | Labels in `src/locales/nl.json`. `nav.suggest` "Verras me"; `jouwActiviteiten.*`; `privacy.link`. | Copy pass (Chunk 6). |

**Key cross-cutting facts for whoever builds this:**
- `UserMenu` + `MenuHintTooltip` render globally from `App.vue`, gated by
  `showChrome` (false on `public`/`onboarding` routes and until `isWelcomed`). The
  home button reuses this gate **plus** `route.name !== 'suggest'`.
- `/stress`, `/counterbalance`, `/onboarding`, `/chat` are intentionally orphaned
  (URL-only). The home button *will* show on them (they're spokes) — desirable: it's
  the way out.
- Icons are inline Vue SVG, `viewBox="0 0 16 16"`, no icon library. Match `BackIcon.vue`'s shape.
- `--uw-card` is referenced but undefined (fallbacks apply); dark-mode CSS doesn't
  exist yet. Don't depend on either.

---

## Build sequence (reviewable chunks)

### Chunk 1 — The home button (the spine)

The load-bearing piece; build and review it first because every later chunk assumes
"leave = home button."

1. **`src/components/icons/HomeIcon.vue`** — a house pictogram matching `BackIcon`'s
   conventions (`viewBox 0 0 16 16`, `stroke="currentColor"`, `stroke-linecap/join
   round`, `size`/`strokeWidth` props, `aria-hidden`). Unambiguous house silhouette
   (roof triangle + body); legibility is a hard requirement (Sanne).
2. **`.uw-home-btn`** in `base.css` — a *new sibling* of `.uw-badge` (don't reuse
   `.uw-badge` itself: it's semantically "the accept badge"). Same visual family —
   round, `background: var(--uw-primary)`, `color: var(--uw-primary-fg)` (token-driven,
   so it recolours per `[data-theme]` for free — satisfies the report's "not hardcoded
   green"). Add the button affordances `.uw-badge` lacks: `cursor: pointer`,
   `border: 0`, `padding: 0`. **No `transition`, no animation, no glow** — static and
   desaturated, per the persona verdict.
3. **Size — unify all chrome circles at 40px (decided 2026-06-12).** The accept badge
   is already 40px; conform the two chrome buttons to it so home / hamburger / accept
   form one circular-control vocabulary (the coherence Yuna praised), and 40px is a
   better thumb target than 34px. Two 40px buttons at the same `top-[18px]` on opposite
   corners share an optical baseline with no `top`-nudge bookkeeping.
   - **Edit `.uw-menu-btn` in `base.css` from 34px → 40px** (`width`/`height` 40,
     `border-radius` 20). This class has **three** consumers — verify each:
     - `UserMenu` hamburger — intended bump. ✓
     - `PageHeader` back chevron — removed in Chunk 2, so irrelevant after. ✓
     - `ChatPage.vue` reset button (`fixed top-[18px] right-[68px]`) — orphaned route,
       but the 40px hamburger now spans 22–62px-from-right, leaving a 6px gap before
       this button. **Nudge it to `right-[70px]`** so it doesn't crowd.
   - `.uw-home-btn` is 40px to match (it clones the badge anyway).
   - Icon: `MenuLinesIcon` stays 16px (sits fine in 40px, like `CheckIcon` in the
     badge); bump to ~18px only if it reads small at build time.
4. **`src/components/HomeButton.vue`** — mirror `UserMenu`'s structure: a `fixed`
   UnoCSS wrapper (`fixed top-[18px] left-[22px] z-20`, mirroring the hamburger at
   top-right) around a `<button class="uw-home-btn">`. `aria-label` = `$t('nav.home')`.
   Click → `router.push({ name: 'suggest' })`.
4. **Mount globally in `App.vue`** next to `UserMenu`, with a new gate:
   ```ts
   const showHome = computed(() => showChrome.value && route.name !== 'suggest')
   ```
   ```html
   <HomeButton v-if="showHome" />
   ```
   - Top-left (home) + top-right (hamburger) gives symmetric, never-moving chrome.
   - Core page shows neither home button nor chevron — only the hamburger.

**Review (why/what-if/trace):**
- *Why* a persistent fixed control instead of a menu item? (decision-load,
  muscle-memory, shutdown-proof)
- *What if* we'd reused `router.back()` for the home button? (cold-launch PWA trap;
  `history.length === 1`)
- *Trace* the gate: cold-launch directly to `/account` → does the home button render?
  Does it on `/suggest`? On `/privacy` (public)? On the welcome landing?

### Chunk 2 — Kill history-based back on the spokes

With the home button covering "leave," the header chevron's `$router.back()` becomes
the redundant, unpredictable control the report wants gone.

1. **`SuggestFromListPage.vue`, `AccountPage.vue`** — remove `back`/`@back` from
   `<PageHeader>`. The home button replaces it.
2. **`QuickSuggestPage.vue`** —
   - Remove the header chevron (`<PageHeader back @back="$router.back()" />` →
     `<PageHeader />`).
   - Keep `StepActions`' in-flow back (this *is* the reserved chevron — content-level,
     stepping through questions). **Fix `handleBack()` step-1 branch**: replace the
     `window.history.length > 1 → history.back()` fallback with
     `router.push({ name: 'suggest' })` (step 1 exits to the hub, never to history).
   - Confirm `StepActions` (OnboardingStepActions) renders a chevron-style back so it
     reads as "step back," visually distinct from the round home button.
3. **`PageHeader.vue`** — `back` prop/emit **kept** (not removed). After the cut it
   still has legitimate users: `PrivacyPage` (a public, chrome-less page that needs its
   own escape — repointed to `/account` in Chunk 5) and the dormant `StressPage` /
   `CounterbalancePage`, whose header chevron is a genuine *in-flow* step-back (resets
   the level/category picker), not a leave-back.

**Done in this chunk (2026-06-12):**
- Removed redundant *leave*-backs (`$router.back()`) from `SuggestFromListPage`,
  `AccountPage`, `ChatPage` — the home button is the way out.
- `QuickSuggestPage`: removed the header chevron; `handleBack()` step-1 now
  `router.push({ name: 'suggest' })` instead of the `window.history.length > 1 →
  history.back()` fallback. In-flow step-back stays in `OnboardingStepActions`.
- **Left untouched:** `StressPage` / `CounterbalancePage` (orphaned, URL-only behind
  the no-UI hook). Their in-flow header chevron now visually sits under the global
  home button (both top-left). Acceptable while dormant; revisit if those routes are
  revived. `PrivacyPage` deferred to Chunk 5.

**Review:**
- *What if* a user deep-links to `/quick-suggest` and presses step-1 back — where do
  they land now vs. before? (hub vs. possible dead-end / trapped gesture)
- *Why* is `StepActions` back allowed to remain when header back is removed? (different
  job: within-flow vs. leave-flow; different affordance)

### Chunk 3 — Menu restructure (`UserMenu.vue`)

Rewrite the `<nav>` to the report's candidate structure. Theme picker stays at top.

Target shape (dividers `h-px bg-uw-border-soft`, **no `<h3>` headers**):
```
[ theme picker ]                                  (unchanged utility block)
──────────
  Bekijk mijn lijst              → /activities
  zelf iets toevoegen            → /activities?new=1
──────────
  drie vragen, een idee          → /quick-suggest
  ideeën op basis van mijn lijst → /suggest-from-list
──────────
  Account                        → /account
```
- **Delete** the `/suggest` link section (`UserMenu.vue:53–66`) — the hub is reached
  via the home button only.
- **Delete** both `<h3>` group headers (`:69`, `:96`).
- **Delete** the `/privacy` link (`:105–112`) — moves to the account footer (Chunk 5).
- Replace `jouwActiviteitenLinks` with an array carrying the four entries above (drop
  the `disabled`-placeholder support — report: "cut the disabled-placeholder rows").
  Note the two link targets that differ only by query (`/activities` vs
  `/activities?new=1`); use `:to="{ path: '/activities', query: { new: '1' } }"` for
  the add entry so `active-class` matching stays sane.
- Keep `@click="open = false"` and the outside-click close. Keep `dismissMenuHint()`.

**Done in this chunk (2026-06-12):**
- `<nav>` rewritten as a data-driven `menuGroups` array (3 groups) rendered with a
  divider before every group after the first; one uniform link style; no headers.
- Dropped the `/suggest` link, the `disabled`-placeholder support, and the `/privacy`
  link. Add entry uses `:to="{ path: '/activities', query: { new: '1' } }"`.
- **Folded in Chunk 6's menu copy** (the labels are intrinsic to the menu — wiring old
  keys then rewiring made no sense): `jouwActiviteiten` now `viewList` "Bekijk mijn
  lijst" / `selfAdd` "zelf iets toevoegen" / `quickSuggest` "drie vragen, een idee" /
  `fromList` "ideeën op basis van mijn lijst". Removed `jouwActiviteiten.group` and
  `menu.groupAccount`. `nav.suggest` ("Verras me") is now unused but left in place
  (harmless; revisit in the final copy sweep).
- Interim gap until Chunk 5: `/privacy` is reachable only by URL (still linked from
  `LoginPage`). The account-footer link lands in Chunk 5.

### Chunk 4 — `?new=1` opens the add form (`ActivitiesListPage.vue`)

Make the split label honest: the add entry must land *on the form*, not the list.

1. Import `useRoute`/`useRouter`. In `onMounted` (after/independent of
   `fetchActivities`), if `route.query.new` is truthy, call `startCreating()`.
2. **Clean the query** with `router.replace({ query: {} })` once consumed, so a refresh
   or a `cancelEditing()` → list doesn't re-trigger the form, and the URL doesn't carry
   stale state.
3. No template change needed — `editing='new'` already swaps the list view for the form
   (the `StateLoading` branch still wins until `loaded`, then the form shows; verify
   this ordering holds).

**Done in this chunk (2026-06-12) — revised away from the query param:**
The `?new=1` approach was built first but **failed in practice**: `/activities` →
`/activities?new=1` is a query-only change on the same route, so Vue doesn't remount
and `onMounted` never re-runs; and after stripping the query, "Bekijk mijn lijst"
(`/activities`) is the same URL you're already on, so no navigation fires at all. A
`watch` patches the first case but not the no-op second one, and it tangles with the
inline "Bewerk" edit.

**Resolution — dedicated routes (diverges from report 009's "no new page"):** the SPA
behavior wasn't anticipated when 009 chose the param. Extracted the form into its own
page so list ↔ form is always a real route change:
- **New `ActivityFormPage.vue`** — create + edit. `:id` param ⇒ edit (loads the
  activity from the `useActivities` singleton, falls back to `/activities` on a stale
  id); no param ⇒ create. Save/cancel → `router.push('/activities')`.
- **Routes** `/activities/new` (`activity-new`) and `/activities/:id/edit`
  (`activity-edit`), both → `ActivityFormPage`.
- **`ActivitiesListPage`** reduced to list-only: "+ Nieuwe activiteit" / empty-state →
  `/activities/new`; "Bewerk" → `/activities/:id/edit`. Removed the inline form,
  `editing` state, and the `?new=1` `onMounted` logic.
- **Menu** "Zelf iets toevoegen" → `/activities/new`.
- i18n: added `activitiesList.editHeading` ("Activiteit bewerken").

### Chunk 5 — Privacy demotion + the "iets voor nu" surfacing decision

1. **`AccountPage.vue`** — add a quiet footer link to `/privacy` at the bottom of
   `<main>` (e.g. a `uw-text-button`-styled `router-link`, muted). Uses `privacy.link`.
2. **`PrivacyPage.vue`** — it's a `public` page (no global chrome → no home button), so
   it needs its own way back. Point its back affordance at `/account` (its new entry
   point) via `router.push('/account')` instead of `router.back()`, to stay consistent
   with the no-history-back principle. (If `PrivacyPage` is also reachable from
   `/login`, keep `router.back()` as a pragmatic exception and note it.)
3. **Resolve the open micro-decision:** set `nav.home` aria-label to "Naar iets voor
   nu" (default). Leave `suggest.heading` empty. Confirm with Noor whether the core
   should ever display the name visibly.

**Done in this chunk (2026-06-12):**
- `AccountPage.vue` — added a quiet muted `router-link` to `/privacy` as a footer at the
  bottom of `<main>` (`privacy.link`).
- `PrivacyPage.vue` — **left on `router.back()`** (the noted exception): it's reachable
  from both `/login` and the new account footer, so `router.back()` returns to the
  correct origin; repointing to `/account` would bounce a login→privacy visitor through
  the auth guard.
- "iets voor nu" surfacing: confirmed **aria-label only** (`nav.home` = "Naar iets voor
  nu"); `suggest.heading` stays empty to keep the hub calm. No visible core title.

### Chunk 6 — Copy pass (`src/locales/nl.json`)

Consolidate all string changes into one reviewable diff. Casing follows the report's
intent (sentence-case for the user's own list routes; lowercase for the AI-idea
routes, matching "drie vragen, een idee").

| Key | Old | New |
|---|---|---|
| `nav.home` *(new)* | — | "Naar iets voor nu" *(aria-label)* |
| core name | `nav.suggest` = "Verras me" | introduce `core.name` = "iets voor nu"; `nav.suggest` now unused — remove or repurpose |
| `jouwActiviteiten` view-list *(new)* | — | "Bekijk mijn lijst" → `/activities` |
| `jouwActiviteiten.selfAdd` | "Iets toevoegen aan mijn lijst" | "zelf iets toevoegen" → `/activities?new=1` |
| `jouwActiviteiten.quickSuggest` | "Drie vragen, één suggestie" | "drie vragen, een idee" |
| `jouwActiviteiten.fromList` | "Suggesties op basis van mijn lijst" | "ideeën op basis van mijn lijst" *(plural — the route returns 3)* |
| `jouwActiviteiten.group` | "Jouw activiteiten" | remove (no more header) |
| `menu.groupAccount` | "Account" | remove (no more header) |

> ⚠️ The `quickSuggest`/`fromList` relabels change strings that plan 21 §4 locked.
> Report 009 (newer, 2026-06-12) and its persona panel explicitly endorse the new
> wording, so 009 governs — but call this out in the commit so the divergence from
> plan 21 is intentional and visible.

**Done (2026-06-13):**
- Menu copy landed in Chunk 3. Final wording kept **sentence-case with the natural
  Dutch "één"** rather than the all-lowercase draft in the table above — i.e.
  `quickSuggest` = "Drie vragen, één idee", `fromList` = "Ideeën op basis van mijn
  lijst", `selfAdd` = "Zelf iets toevoegen". The lowercase styling in this table was a
  draft intent; the capitalised forms read better and are the shipped strings.
- `nav.home` ("Naar iets voor nu") was **removed**; the home button's `aria-label`
  now reuses `nav.suggest` = "Verras me" (Noor's call, 2026-06-13). The "iets voor nu"
  phrase therefore no longer appears anywhere — the calm hub stays unlabelled, as
  intended.

**Review:**
- *Why* keep `fromList` plural? (it returns 3 ideas — an earlier singular phrasing was
  rejected for misstating the count)

### Chunk 7 — Verify

1. `cd frontend && npm run lint:check && npx vue-tsc --noEmit && npm run build`.
2. Manual walk-through (use the `run` skill if launching the app):
   - Home button: same corner on `/activities`, `/account`, `/quick-suggest`,
     `/suggest-from-list`, `/chat` — never moves; absent on `/suggest` and the welcome
     landing; absent on `/privacy`.
   - No animation/glow on the home button; colour is static theme-primary across all
     three themes (warm/calm/playful).
   - "zelf iets toevoegen" lands directly on the add **form**; cancel returns to the
     list; refresh doesn't re-open the form.
   - QuickSuggest: step-back walks questions; step-1 back → core; no header chevron.
   - Menu: dividers only, no headers, no suggest link, no privacy link; privacy reached
     from the account footer.
3. Persona gut-check against the verdict: placement consistency (Sanne), no redundant
   home link (Eline), icon reads as "home" at a glance (Sanne/Yuna).

---

## Out of scope (deferred, per report 009 "Still open")

- **Bottom-sheet menu panel** (mobile thumb-zone) — bigger change; dropdown stays.
- **Dark-mode CSS / `--uw-card` definition** — pre-existing latent gaps, not this work.
- **Bottom tab bar, FAB, Pinia** — explicitly rejected ("don't over-build").
- **Un-orphaning `/stress`, `/counterbalance`, `/chat`** — they stay URL-only.

---

## File-change checklist

- `src/components/icons/HomeIcon.vue` *(new)*
- `src/components/HomeButton.vue` *(new)*
- `src/assets/base.css` — add `.uw-home-btn`; bump `.uw-menu-btn` 34px → 40px
- `src/pages/ChatPage.vue` — nudge reset-button offset `right-[68px]` → `right-[70px]`
- `src/App.vue` — `showHome` gate + `<HomeButton>`
- `src/components/PageHeader.vue` — added `wordmark` prop (Chunk 1 follow-up); `back` prop kept (still used by PrivacyPage + dormant Stress/Counterbalance)
- `src/pages/SuggestFromListPage.vue`, `AccountPage.vue`, `ChatPage.vue` — removed redundant header leave-back
- `src/components/UserMenu.vue` — rewrite `<nav>`, new links array
- `src/pages/QuickSuggestPage.vue` — drop header chevron, fix step-1 back
- `src/pages/SuggestFromListPage.vue` — drop header back
- `src/pages/AccountPage.vue` — drop header back, add privacy footer link
- `src/pages/ActivitiesListPage.vue` — `?new=1` → open form, clear query
- `src/pages/PrivacyPage.vue` — back → `/account`
- `src/locales/nl.json` — copy pass (Chunk 6 table)
