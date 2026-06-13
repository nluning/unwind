# Review 009 — Navigation / menu restructure

**Date:** 2026-06-12
**Scope:** Redesign of the `UserMenu` and the app's navigation model. Three triggering problems: (1) the header back button is inconsistent and history-based; (2) *"Iets toevoegen aan mijn lijst"* opens the list, not the add form; (3) the menu has accreted accidental structure from features added and removed.
**Designed by:** Four expert lenses run in **generative mode** — each independently drafted a full design before seeing the others (Information Architecture, ND / cognitive-accessibility (PDA-aware), Mobile/PWA interaction, Dutch microcopy). Synthesis below; persona pressure-test (Yuna, Eline, Sanne) still to come.

---

## Headline

**The three problems are one problem: the menu has no explicit navigation model.** All four lenses converged on the same spine — back means *home*, "add" and "view" are distinct, and "my list" is separate from "AI suggestions." The remaining choices are presentation (dividers, colour, labels) and one naming question that turned out to be load-bearing: what *"Verras me"* should be called now that it's the core, not one mode among several.

## Settled (all four lenses agreed)

1. **Back = home (`/suggest`), never `router.back()`.** History-based back is unpredictable, and in a cold-launched standalone PWA the current `history.back()` fallback in `QuickSuggestPage` can trap the user (`history.length === 1`). Multi-step flows get a *separate* in-flow step-back; at step 1 that also goes home. Don't trap the OS back gesture.
2. **Split "add" from "view list"** — two entries, both → `/activities`, where an `?new=1`-style param opens the form on mount. No new route or page. A label that lies costs more than an extra row.
3. **Break up "Jouw activiteiten"** — it fused two unlike things (your stored list vs. AI discovery). That fusion *is* the accidental structure.
4. **Don't over-build** — no bottom tab bar, FAB, or Pinia; orphaned routes stay orphaned; cut the disabled-placeholder rows.

## Decided this round

- **No group headers — dividers only** (ND lens). Headers are re-parsing load at ~6 items; dividers carry the grouping for free. (Background colour-coding per zone still open — see below.)
- **Return to the core is a persistent control, not a menu item.** The suggest entry is **removed from the menu**; instead every spoke page carries a **round "home" button in the theme's primary colour** (same visual family as the "doen"/accept badge — `var(--uw-primary)`, *not* hardcoded green) with a home pictogram, which returns to the core page. The core page itself shows neither home button nor chevron (you're already there); it has only the hamburger.
- **The back chevron is reserved for stepping back *within* a multi-step flow** (e.g. the 3-question Q&A); at step 1 it exits to the core. Home button and chevron are deliberately different controls (shape, colour, icon, job) so the two never overload one affordance.
- **Final labels** for the list and idea routes (see structure); "add" and "view list" are split into two entries.

## Candidate structure

The menu (hamburger, top-right) — the core/home is reached via the home button, so it no longer appears here:

```
[ theme picker ]                                 (utility, not nav)
──────────
  Bekijk mijn lijst             → /activities
  Nieuw                         → /activities?new=1   (opens the add form directly)
──────────
  drie vragen, een idee         → /quick-suggest
  ideeën op basis van mijn lijst → /suggest-from-list
──────────
  Account                       → /account
  Privacyverklaring             → /privacy
```

Core/home entry (`/suggest`) — still to be renamed (shortlist below) — is reached by the themed round home button on every other page, never from the menu.

## Personas (in brief)

- **Yuna (ADHD, anxiety, designer's eye).** Finds her way easily — small enough to grok at a glance, and glad "home" is out of the menu ("een menu vol opties is precies waar ik in vastloop"). The themed round home button looks coherent ("alsof het door één iemand is ontworpen") and the house icon reads instantly; only worry is consistency of placement. Labels feel warm, except **"Nieuw"** ("nieuw *wat*?"). Pick: **iets voor nu**.
- **Eline (gifted-AuDHD, ideation-freeze).** The nav "stays out of my way" at 21:00 — opt-in detours, not chores — as long as the core screen is the default landing and she never *has* to open the menu. Home button works *because* it's the same shape/colour as "doen" (hand learns it); wants no redundant menu link. Pick: **iets voor nu** ("doe een gok" now too tentative since half the suggestions are hers). "drie vragen, een idee" names the catalyst perfectly.
- **Sanne (autistic, shutdown, sensory).** The load-bearing voice: a house icon would *probably* read as home even frozen, but "probably" isn't enough — make it unmistakable, one warm anchor, same corner, never moving; then one route is *calmer* than two. Theme-primary colour is fine only if static/desaturated. **Colour-coding the menu: too busy** — keep dividers. Pick: **iets voor nu** ("pauze" over-promises rest).

## Persona panel verdict (Yuna, Eline, Sanne — 2026-06-12)

**Core-entry name → "iets voor nu" (unanimous).** All three picked it, and each moved *off* their earlier naming-round favourite to get there: Yuna dropped "verras me" ("it ignores that the app knows me now"), Eline cooled on "doe een gok" ("almost too tentative when half the answers come from my own list"), Sanne abandoned "pauze" ("over-promises rest — this screen hands me something to *do*"). Rejected and why: "verras me" / "doe een gok" — unpredictable, over-promise; "wat nu?" — makes the depleted user supply the answer, reads helpless; "geef me iets" — slightly grabby. **Decided: rename to "iets voor nu."**

**Home button as the sole route back → endorsed by all three, with conditions.** One reliable door beats two (a menu link "would add a decision"), so removing the suggest link is right. But it only holds if the button is: (1) in the **exact same corner on every screen, never moving** — it's muscle memory ("if it drifts I lose it"); (2) **unmistakable** — Sanne won't experiment in shutdown, so if the icon doesn't instantly read "home" she's stuck; (3) the theme primary, **static and desaturated, no glow/animation**. **Decided: keep as the only route; consistent placement + an unambiguous home icon are requirements, not polish.**

**Colour-coding the menu zones → rejected (Sanne, strongly).** Backgrounds add contrast edges to parse exactly where she's most depleted; dividers + no headers are "already the right amount." **Decided: dividers only, no zone colour — let the home button be the only colour that earns attention.**

## Still open

- **The "Nieuw" label.** Yuna found it bare/ambiguous ("nieuw *wat*?"), but the obvious fix "voeg toe" is a banned demand verb. Candidates: keep **Nieuw**, or **iets toevoegen** (gerund — softer than the imperative), or **zelf iets toevoegen**. One micro-decision for Noor.
- **Menu panel: dropdown vs. bottom sheet** (mobile lens; thumb-zone targets) — optional, bigger change.
- **Demote *Privacyverklaring* to a footer link on `/account`?** ND lens wants it out of primary nav.

## Note on the list-route label

*"ideeën op basis van mijn lijst"* is plural on purpose — that route returns **3** ideas, not one. (An earlier single-idea phrasing was rejected for misstating the count.)

## Next step

Build the menu restructure against the decisions above: a themed round **home button** (fixed corner, unambiguous home icon, static/desaturated) on every spoke; **remove the suggest link** from the menu; **rename the core to "iets voor nu"**; split add/list (**Bekijk mijn lijst** + the add entry); **dividers only**, no headers, no zone colour; **chevron reserved** for in-flow back. Settle the **"Nieuw"** label first.
