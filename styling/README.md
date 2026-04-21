# Unwind · full redesign export (v2)

Drop-in package covering every screen in the redesign.

## Files

| File | Route / purpose |
|---|---|
| `base.css` | Theme tokens + shared primitives. Replaces or extends `src/assets/base.css`. |
| `SuggestPage.vue` | `/` — Home / main suggestion (Chrome B actions). |
| `StressPage.vue` | `/stress` — 5-dot stress scale → suggestion. |
| `CounterbalancePage.vue` | `/counterbalance` — category picker → suggestion. |
| `OnboardingPage.vue` | `/onboarding` — 6-step welcome → setting → social → interests → loading → done. |
| `ChatPage.vue` | `/chat` — conversation with starter chips, inline activity cards, round composer. |
| `UserMenu.vue` | Slide-over drawer from the header menu button. Houses theme swatches + nav. |
| `i18n.snippet.json` | Keys to merge into `src/locales/nl.json`. |

## Install

1. **Tokens.** Paste `base.css` into `src/assets/base.css`. Themes are scoped per-element via `[data-theme="warm" | "calm" | "playful"]`. Default = warm.
2. **Fonts.** Add Fraunces + Inter to `index.html` or `uno.config.ts`.
3. **Pages.** Drop each `.vue` into `src/pages/` and wire up in the router. They assume:
   - `useActivities`, `useSuggestionFlow`, `useTheme` composables (already in your repo — we didn't change their signatures)
   - `api` client at `src/api/client.js`
   - `vue-i18n` set up with `nl` locale
4. **Menu.** Add `<UserMenu :open="menuOpen" @close="menuOpen = false" @signout="..." />` to your layout shell; each page emits `open-menu` on the header button.
5. **Copy.** Merge `i18n.snippet.json` into `nl.json`. The `_note` field explains what's new vs. changed.

## Theme switching

```js
document.documentElement.dataset.theme = 'calm'; // or 'warm' | 'playful'
```

`useTheme().setColorScheme('calm')` already does this — `UserMenu` calls it directly.

## Design decisions

- **Chrome B across every screen** — inline verbs, no button rectangles. Primary = 40px round accent badge, secondary = label + arrow.
- **Per-theme accent** — warm `#a4614d`, calm `#3f6670`, playful `#3d7a4a`. Used for: primary action badge, selected dots/chips, nav marker dot, user bubble in chat, progress pill in onboarding, menu active link.
- **Onboarding** — 4-dot progress pill (welcome step unnumbered), single-select lists styled as Fraunces rows with hairline dividers, interests as tonal chips.
- **Chat** — user bubbles use primary, assistant bubbles use the chip tonal colour; saved-activity card nests inside assistant bubble with a `uw-primary` "Save" text link.
- **Side menu** — slide-over from the right, theme swatches up top as 42px rounded gradients, nav as Fraunces rows. Active route uses the palette accent.
- **Stress scale** — 5 circular dots spanning full width with "laag / hoog" labels; selected dot fills with primary.
- **Counterbalance** — three category rows with round outlined glyph + label; selecting filters the suggestion pool.

## Still to sanity-check

- We used `CATEGORY_ID_MAP` and `filterByExcludedCategories` based on the composable signature in the repo — re-check if you've renamed them recently.
- `/chat` endpoint payload is assumed to return `{ reply, activity? }`. Adjust if your backend differs.
- Onboarding drops the explicit memory-consent question; `memory_consent: false` is sent by default. Add that step back if legal needs it.
