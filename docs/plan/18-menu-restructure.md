# Menu restructure + mode renaming

**Status: planned, not started.**

## What this document covers

Remove the `BottomNav` and consolidate all primary nav into a restyled
`UserMenu`, while renaming the four modes from internal labels
("Suggestie / Stress / Balans / Chat") to user-perspective names
("Verras me / Ik ben op / Wat heb ik nodig? / Praat met me"). Add a
one-time hint card on first visit so users discover the menu exists.

Background: `docs/review/reports/003-menu-restructure.md`. The panel and
the UX designer both endorsed this direction with two non-negotiables:
the modes must be renamed alongside the layout change, and a first-visit
hint must accompany the BottomNav removal.

This is a frontend-only change. No backend, schema, or routing changes.
The router already lands on `/suggest` for authenticated users, which
satisfies the panel's load-bearing condition (open directly on Mode 1).

## Design decisions

- **Kebab stays as the trigger, but the open state reads as
  navigation.** Two type sizes (`text-base font-medium py-3.5` for the 4
  modes, `text-sm py-2.5` for library/account), whisper-uppercase group
  labels, panel widened from `w-56` to `w-64`. No icons. The personas
  who pushed back on the proposal (Daan, Lisa, Jeroen) wanted a visible
  bar; the designer's compromise — make the dropdown *feel* like nav —
  was the path Noor chose.
- **Group A order is Mode 1 → 2 → 3 → 4, not Suggest+Chat on top.**
  The original proposal put the current BottomNav tabs first by analogy,
  but Chat is nobody's primary mode (per 001) and the designer's order
  matches actual use frequency.
- **No icons next to mode names.** Considered and rejected — the warm
  names carry the meaning, icons would clutter the calm aesthetic and
  invite bikeshedding.
- **Group labels are whispered, not hidden.** Yuna's specific call:
  *"Stilte met alleen dividers werkt in Notion, niet hier — gebruikers
  zijn afgemat, geen designers."* Use the existing `Thema` label
  pattern (`text-xs text-uw-ink-mute`, uppercase via Tailwind utility or
  literal copy) for "Wat wil je doen", "Jouw activiteiten", and
  "Account".
- **"Mijn activiteiten" becomes "Mijn lijst".** Shorter, warmer, fits
  the menu rhythm. Internal route stays `/activities`.
- **"Verzin activiteiten voor me" stays as-is.** Already in the house
  voice, already user-facing.
- **Hint reuses the existing `unwind-welcomed` key — no new key.**
  The hint is for new users only; anyone who already dismissed the
  WelcomeCard has been using the app and either knows where the menu is
  or will tap the kebab eventually. The trigger is *session-scoped*: a
  module-level ref in `useWelcome` (`justDismissedWelcome`, no
  persistence) flips true inside `dismiss()` and back to false when the
  hint is dismissed or the menu opens. No localStorage write for the
  hint itself.
- **The hint is a tooltip-style callout, not a card.** Small, light,
  anchored to the kebab with a pointer. Plain text + arrow, no card
  chrome or button. Dismisses on tap anywhere or on menu open — no
  auto-timeout (the user reads at their own pace). A full card would
  feel like a second gate after the WelcomeCard; a tooltip whispers
  "by the way, there's a menu here."
- **No active-state dot on the kebab in this PR.** The designer flagged
  it as deferrable; users still have the page header as their "you are
  here" anchor. Revisit only if testing surfaces confusion.
- **Page headings (`suggest.heading`, `stress.heading`,
  `counterbalance.heading`, `chat.heading`) are not renamed in this
  PR.** Scope this PR to menu labels. Page headings are visible only
  after navigation, so the mismatch is acceptable short-term — but flag
  for a follow-up to align them with the new names.
- **`role="menu"` → `<nav>` with section headings** for better
  accessibility semantics. The current `role="menu"` with `router-link`
  children doesn't satisfy ARIA's expectations (menu requires
  `menuitem` children with arrow-key navigation). A `<nav>` with
  `<h3>`-style group headings is simpler code, better semantics, and
  screen readers will announce it as navigation.
- **Keep all `nav.*` i18n keys; change only the values.** Avoids a
  rename ripple through templates that reference `t('nav.suggest')` etc.

What we are NOT doing here:
- Adding mode icons in the menu.
- Adding an active-state indicator on the closed kebab.
- Renaming page headings (`*.heading` keys).
- Renaming Mode 4's underlying behavior — only the menu label changes.
  System prompts and chat-page heading are untouched.
- Splitting Group A by interaction model (Jeroen's regrouping). Out of
  scope; revisit if the menu starts to feel flat.
- Removing `--uw-nav-*` CSS variables in `base.css`. Cheap to keep; may
  be reused. Their consuming styles get deleted, the vars stay.

## Code touch points

| File | Change |
|---|---|
| `frontend/src/components/BottomNav.vue` | **Delete.** |
| `frontend/src/App.vue` | Remove `BottomNav` import and `<BottomNav v-if="showChrome" />` line. |
| `frontend/src/components/UserMenu.vue` | Restructure into three groups; add new mode links at top; widen panel; bump type size for Group A; switch outer element from `role="menu"` div to `<nav>` with `<h3>` group headings. |
| `frontend/src/locales/nl.json` | Update `nav.suggest`, `nav.stress`, `nav.counterbalance`, `nav.chat` values to System A names; change `activitiesList.link` to `"Mijn lijst"`; add `menu.groupModes`, `menu.groupLibrary`, `menu.groupAccount`, `menu.hint`, `menu.hintDismiss`. |
| `frontend/src/assets/base.css` | Delete `.uw-nav-bar`, `.uw-nav`, `.uw-nav__item`, `.uw-nav__item--active`, and the `.uw-nav__item--active::before` dot rule (lines ~349–386). Update `.uw-frame` `padding-bottom` from `calc(5rem + env(safe-area-inset-bottom))` to `env(safe-area-inset-bottom)` (line 205). Keep `--uw-nav-*` vars. |
| `frontend/src/composables/useWelcome.ts` | Add a module-level `showMenuHint` ref (in-memory only). Flip true at the end of `dismiss()`. Export a `dismissMenuHint()` that flips it back to false. No new localStorage key. |
| `frontend/src/components/MenuHintTooltip.vue` (new) | Tooltip-style callout anchored near the kebab. Plain text + small arrow pointing up-right at the kebab. No card chrome, no dismiss `×`, no auto-timeout — any tap dismisses it. Dutch copy: *"Hier vind je meer manieren om de app te gebruiken."* |
| `frontend/src/components/UserMenu.vue` | When the menu opens, call `dismissMenuHint()` so the tooltip disappears in sync. |
| `frontend/src/App.vue` | Mount `MenuHintTooltip` near the chrome (alongside `UserMenu`), shown when `showMenuHint && showChrome`. App-level so it's not tied to a specific page. |

## Dutch strings (final)

```json
{
  "nav": {
    "label": "Hoofdnavigatie",
    "suggest": "Verras me",
    "stress": "Ik ben op",
    "counterbalance": "Wat heb ik nodig?",
    "chat": "Praat met me"
  },
  "menu": {
    "label": "Menu",
    "groupModes": "Wat wil je doen",
    "groupLibrary": "Jouw activiteiten",
    "groupAccount": "Account",
    "hint": "Hier vind je meer manieren om de app te gebruiken.",
    "theme": "Thema",
    "logout": "Uitloggen",
    "createAccount": "Maak een account",
    "generateActivities": "Verzin activiteiten voor me",
    "deleteAccount": "Account verwijderen",
    "deleteConfirm": "Weet je het zeker? Dit kan niet ongedaan worden."
  },
  "activitiesList": {
    "link": "Mijn lijst"
  }
}
```

## Menu structure (open state)

```
Thema  [warm] [calm] [playful]  |  [moon]
─────────────────────────────────────
WAT WIL JE DOEN
  Verras me                  (text-base font-medium, py-3.5)
  Ik ben op
  Wat heb ik nodig?
  Praat met me
─────────────────────────────────────
JOUW ACTIVITEITEN
  Mijn lijst                 (text-sm, py-2.5)
  Verzin activiteiten voor me
─────────────────────────────────────
ACCOUNT
  Privacyverklaring
  Maak een account / Uitloggen
  Account verwijderen
```

## Step order

Small, reviewable chunks. Each step independently demoable.

1. **Rename modes in i18n.** Change `nav.*` values in `nl.json`. The
   BottomNav will pick the new labels up immediately. Visual smoke test:
   open the app on `/suggest`, confirm the bottom-bar reads "Verras me"
   and "Praat met me", and the menu reads "Ik ben op" and "Wat heb ik
   nodig?". *No code structure change yet.*
2. **Restructure `UserMenu`**: add the four mode links at the top,
   reorder remaining items into Group B / Group C, add whisper labels,
   widen panel to `w-64`, bump Group A type. The BottomNav is still
   present — both nav surfaces coexist briefly. This is the visually
   biggest chunk; do it on its own.
3. **Add `MenuHintTooltip`** + the `showMenuHint` ref in `useWelcome` +
   the `menu.hint` string. Mount at the `App.vue` level. Verify it
   appears immediately after dismissing the WelcomeCard, disappears on
   any tap or on menu open, and persists until the user actually
   dismisses it. Does NOT reappear on reload — it's tied to the
   in-session WelcomeCard dismissal.
4. **Delete `BottomNav`**: remove the file, remove the import and the
   render from `App.vue`, delete the bottom-nav CSS rules, drop
   `.uw-frame` `padding-bottom` to safe-area only. Manual check: short
   pages don't collapse, long pages don't scroll under a phantom bar.
5. **Switch `UserMenu` outer element to `<nav>` with `<h3>` group
   headings.** Accessibility-only step; defer if time-constrained.

## Testing notes

- **Smoke test on iPhone SE viewport** (375×667) — the smallest target.
  After step 4, the `SuggestPage` content gains ~64px vertical space.
  Verify the suggestion card doesn't bottom-anchor awkwardly and the
  accept/skip buttons remain in reach.
- **Test the menu with the iOS keyboard up** on `ChatPage`. The kebab is
  `fixed top-[18px]` so it should stay visible, but Safari's URL bar
  collapsing can affect `top` anchoring on real devices.
- **Verify `MenuHintTooltip` shows only for new users.** Brand-new
  visitor: WelcomeCard → dismiss → tooltip appears → tap anywhere or open
  menu → tooltip disappears. Returning user (already welcomed): no
  WelcomeCard, no tooltip. Reload mid-tooltip: tooltip is gone (it's
  in-memory only, which is fine — the WelcomeCard already oriented them).
- **No automated tests required** for this PR — it's UI-only, no logic
  branches worth covering. The existing snapshot/Vitest coverage in
  `frontend/src/__tests__/` doesn't include `UserMenu` or `BottomNav`.

## Open questions (low stakes)

- **Should `groupAccount` actually be labelled "Account" once a future
  `/account` page exists?** For this PR it's just a group header for
  three items, but it'll read better if it sits above an entry-point to
  a real account page. Defer until that page exists.
- **Page-heading alignment.** `chat.heading` is "Praat met Unwind",
  which already matches the new `nav.chat` ("Praat met me"). The other
  three page headings (suggest empty, "Hoe gestrest ben je?",
  "Balanceer je dag") drift from their new menu labels. Worth a tiny
  follow-up PR to align.
