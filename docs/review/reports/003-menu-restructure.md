# Review 003 — Menu restructure & mode renaming

**Date:** 2026-05-13
**Scope:** Remove `BottomNav`, consolidate the 4 modes into `UserMenu`, and rename the modes.
**Reviewed by:** UX/UI-designer lens, all 7 personas (Sanne, Daan, Fatima, Jeroen, Yuna, Lisa, Tom)

---

## The proposal

Today: `BottomNav` (fixed bottom bar) shows **Suggestie + Chat**; the other two
modes (**Stress, Balans**) live as flat links in the kebab `UserMenu`. The
proposal removes the BottomNav and groups the menu into three sections:

- **Group A** — the 4 modes: Suggestie, Chat, Stress, Balans
- **Group B** — library/customisation: Mijn activiteiten, Verzin activiteiten voor me
- **Group C** — account: Privacy, Maak een account / Uitloggen, Account verwijderen

Plus: pick better names for the 4 modes — the current ones are functional
labels, not user-facing language.

---

## Verdict

**Restructure the menu — but don't ship a kebab-only nav. Three personas
walked away from the design, two more conditioned approval on the modes
being renamed *and* `/suggest` opening directly.**

The diagnosis is right: the BottomNav is too heavy on small screens, only
covers 2 of 4 modes, and over-weights Chat (50% of the bar for a mode
nobody uses primarily — see 001). But hiding *all* primary nav behind the
kebab regresses on discoverability and reads as a half-finished prototype
to anyone benchmarking against consumer apps (Lisa).

The path that satisfies all seven personas:

1. **Remove the BottomNav.** ✅ Universally supported (or at minimum,
   accepted with conditions). The vertical space win is real.
2. **`/suggest` stays the landing page and shows Mode 1 immediately**, with
   no extra tap to reach it. This is the load-bearing requirement —
   Sanne, Fatima, and Tom all said zero-friction Mode 1 is what makes the
   trade-off worth it.
3. **The menu carries the other 3 modes + everything else**, grouped as
   proposed, but styled as navigation rather than as a settings drawer
   (see "Menu structure" below).
4. **Rename the modes.** ✅ Universally supported. The current names are
   the single most-flagged friction across the panel — "Stress" actively
   excludes Tom, "Balans" reads as yoga-marketing, "Suggestie" reads as
   email-from-your-manager.

What you do *not* need: a BottomNav with all 4 modes (Daan/Lisa/Jeroen's
fallback). It re-introduces the keuzestress 001 already flagged. The
single-landing-page-plus-menu pattern is stronger if executed properly.

---

## UX/UI-designer lens

**Ship it, but treat the menu as primary nav, not as a kebab.** The
designer's full review is consistent with the panel:

- Mode 4 being 50% of the bottom bar overstates a mode nobody uses
  primarily — removing the bar correctly demotes it.
- Order within Group A should be **Suggestie → Stress → Balans → Chat**
  (not the user's proposed Suggest/Chat-on-top), because Chat is nobody's
  primary mode and the proposed order is just legacy from the current
  BottomNav.
- Patterns that make the open menu *read* as nav:
  - Uppercase whisper labels per group (extend the existing `Thema`
    pattern in `text-uw-ink-mute`).
  - Two type sizes: Group A at `text-base font-medium py-3.5`, Groups
    B/C at `text-sm py-2.5`.
  - No icons (would bloat the design and invite bikeshedding).
  - Widen panel from `w-56` to `w-64` to fit longer names without
    wrapping.
- Mock:

  ```
  Thema  [warm] [calm] [playful]  |  [moon]
  ─────────────────────────────────────
  WAT WIL JE DOEN
    Verras me
    Ik ben op
    Wat heb ik nodig?
    Praat met me
  ─────────────────────────────────────
  JOUW ACTIVITEITEN
    Mijn lijst
    Laat Unwind er verzinnen
  ─────────────────────────────────────
  ACCOUNT
    Privacyverklaring
    Maak een account / Uitloggen
    Account verwijderen
  ```

Risks the designer flagged that are worth carrying into implementation:

- **Mode-switching from inside Chat** becomes one extra tap. Verify the
  kebab button is still reachable when the iOS keyboard is up.
- **First-visit discoverability** of modes 2–4 drops. Mitigation: ship a
  tiny dismissable hint on first `/suggest` visit pointing to the menu
  ("Meer manieren om te starten vind je in het menu rechtsboven"). The
  WelcomeCard infrastructure (`useWelcome`) is already in place — extend
  it or add a second one-time card.
- **Active-state indicator** disappears (the BottomNav had one). Low
  stakes, defer unless users get lost.
- **Accessibility**: `role="menu"` expects `role="menuitem"` children
  with keyboard arrow-key navigation. If the kebab becomes primary nav,
  consider switching to `<nav>` with section headings.

---

## Mode names

This is where the panel reached the strongest consensus. The current
names mix paradigms: outcome ("Suggestie"), input ("Stress"), concept
("Balans"), mechanism ("Chat"). Six of seven personas independently
proposed warmer, verb-led, user-perspective alternatives.

### Convergence across the panel

| Mode | Strongest signal | Runner-up |
|---|---|---|
| 1 (random) | **Verras me** (Sanne, Daan, Fatima, Yuna, Lisa) | Geef me een idee / Iets doen (Tom, Jeroen, UX) |
| 2 (stress) | **Ik ben op** (Sanne, Daan) — and *anything but "Stress"* (Tom, Yuna, Fatima all flagged the word itself) | Iets rustigs (Jeroen, UX); Even uitademen (Lisa); Hoe gaat het? (Yuna) |
| 3 (counterbalance) | **Wat heb ik nodig?** (Sanne, Daan, Lisa, Yuna) | Iets anders dan vandaag (Jeroen, Tom); Balanceer m'n dag (UX) |
| 4 (chat) | **Praat met me** (Sanne, Daan, Fatima, Yuna, Lisa) | Praat met Unwind (UX) |

### Recommendation

Two viable systems, depending on tone:

**System A — Imperative (recommended)**, matches the existing house voice
(`Verzin activiteiten voor me`, `Geef me een suggestie`):

| Mode | Name |
|---|---|
| 1 | **Verras me** |
| 2 | **Ik ben op** |
| 3 | **Wat heb ik nodig?** |
| 4 | **Praat met me** |

Why this wins: it is the only system every persona would actually tap.
"Verras me" was named verbatim by five personas. "Ik ben op" sidesteps
the Stress-the-word problem that excludes Tom and triggers Yuna/Fatima.
"Wat heb ik nodig?" reframes Mode 3 from a categorisation puzzle
(Head/Hands/Heart) to a need — Jeroen's exact critique of the current
names. "Praat met me" was the single most-converged-on name in the panel.

Trade-off: longer than the current 1-word labels. The UX designer's
recommendation to widen the menu panel to `w-64` handles this.

**System B — Outcome ("Een suggestie / Iets rustigs / Iets in balans /
Een gesprek")** is more scannable as a set but obscures what Mode 2/3
actually *do*. Defer unless A feels too informal.

Whichever system you pick, **lock all four names in the same paradigm at
once** — Jeroen's main critique of the current state is that they're a
mixed taxonomy, and shipping two new ones plus two legacy ones
reintroduces that.

---

## Panel of users

| Persona | Verdict | Key signal |
|---|---|---|
| Sanne | **Ship (conditional)** | Less screen noise = relief, but open on Suggest. Names *must* change — "balansen" isn't a verb anyone uses. |
| Daan | **Don't ship** | Bottom nav was one tap; kebab is three. "Het kebabmenu is een graf." |
| Fatima | **Don't ship** | Extra tap at 21:30 with a sleeping toddler is real friction. Make Mode 1 the home, hide the rest. |
| Jeroen | **Don't ship** | Group A is "not a group, it's a list" — four incompatible interaction models. Regroup or keep some bar. |
| Yuna | **Ship (conditional)** | Less is more, *if* the names land. The current ones are "productmanager-woorden." |
| Lisa | **Don't ship** | Reads as half-finished against Spotify/Calm/Notion. Wouldn't discover Mode 3 — the one she'd actually want. |
| Tom | **Don't ship** | Mode 1 needs to be the first thing he sees. "Stress" excludes him outright — his issue is anhedonia, not overload. |
| UX/UI | **Ship (conditional)** | Right call structurally, but treat the menu *as* nav (typography, labels, sizes), and ship a hint-card so first-visit users find the other modes. |

### Sanne — *autistic, shutdown, sensory-sensitive*

> Die twee tabs onderin trekken altijd mijn aandacht — ook als ik er niks
> mee wil. Minder ruis op het scherm is voor mij echt winst. Maar als ik in
> shutdown ben en de app open, wil ik geen menu zien. Ik wil één suggestie
> zien.

Sanne carries the strongest version of the "open directly on Mode 1"
requirement. The menu structure works for her *only* if it stays optional.

### Daan — *ADHD, restless, impulsive*

> Bottom nav is daar met een reden. Niet doen. Stress en Balans bestaan al
> half niet voor mij — als alles in dat hamburgerding zit, wordt het één
> grijze brij.

The clearest "no" from the panel. But notably, Daan's reason is
discoverability of Modes 2/3, *not* extra friction on Mode 1 — and his
own renames track the panel consensus exactly.

### Fatima — *ADHD + autistic, burnout, low energy*

> Een kebab-menu (dat puntjes-ding rechtsboven) — ik klik daar nooit op.
> M'n moeder zou dat nooit vinden. Maak de "geef me iets"-knop gewoon
> meteen het scherm dat ik zie.

Fatima's solution is essentially the recommended path: Mode 1 *is* the
home, everything else is in the menu. She's "don't ship" of the
literal proposal but "ship" of the actual recommendation.

### Jeroen — *autistic, alexithymic, pattern-oriented*

> Groep A is geen groep, dat is een lijst. Je hebt vier compleet
> verschillende interactiemodellen in één bak gegooid.

Jeroen is the only persona who pushed back on the grouping itself. His
alternative — split Group A by *passive vs. with input* — is a coherent
design but requires more change than this iteration intends. Worth
noting as a future-state consideration if the menu starts to feel flat.

### Yuna — *ADHD, designer, language-sensitive*

> Leeg ≠ incompleet als de content centraal sterk is. Vermijd alles op -ie
> of -atie. Werkwoorden &gt; zelfstandige naamwoorden.

Yuna's specific design instruction: **whisper-label the groups**, don't
just use dividers. "Stilte met alleen dividers werkt in Notion, niet
hier — gebruikers zijn afgemat, geen designers." Adopt this.

### Lisa — *neurotypical, polish-conscious*

> Apps die ik gebruik — Spotify, Notion, Calm — hebben *altijd* een bottom
> bar of een duidelijke home met je kernfuncties zichtbaar. Een kebab is
> waar instellingen wonen.

Lisa's frame is the convention concern. Mitigations: the menu must
*look* like nav when open (designer's typography recommendations), and
the first-visit hint card needs to surface that other modes exist.

### Tom — *burnout recovery, anhedonia, low activation*

> Een knop met "Stress" sla ik over. Mijn ding is geen stress, het is
> leegte.

Tom is the strongest argument for **renaming Mode 2 away from the word
"Stress" entirely** — not euphemising it, but reframing what it asks.
"Ik ben op" or "Hoe voel je je" lets him in without re-labeling himself.

---

## Cross-cutting findings

**1. The proposal isn't wrong — the BottomNav genuinely should go.**
6/7 personas + the designer accepted removal in some form. Nobody
defended the current bar on its merits.

**2. The single load-bearing condition is that `/suggest` opens
immediately with Mode 1 visible.** Sanne, Fatima, Tom, Daan all gated
their answer on this. The router already lands here — just don't
regress.

**3. Renaming the modes is not optional.** 7/7 personas independently
flagged the current names as friction. The names are doing more work
than the layout in determining whether the app feels usable.

**4. The kebab pattern as primary nav fails on convention** (Lisa) and
**discoverability** (Daan, Lisa). The mitigations exist (typography,
hint card, label-by-group) but require deliberate execution — a literal
"flat list in a dropdown" is what failed for them.

**5. Group A doesn't need a label of "Modi"** — Yuna's "wat wil je doen"
(or similar) lands warmer, and Jeroen's "the modes aren't really one
group" critique evaporates when the label reframes them as user-goals
instead of app-features.

---

## Recommendations

### Do

1. **Remove the BottomNav.** Delete `BottomNav.vue` and its import
   from `App.vue`. Adjust `PageShell.vue`'s bottom padding accordingly.
2. **Land on `/suggest` with Mode 1 immediately visible.** The router
   already does this. Verify nothing regresses (no welcome card, no
   intermediate state) for returning users.
3. **Restructure the menu into the three groups**, in this order within
   Group A: **Mode 1 → Mode 2 → Mode 3 → Mode 4** (not the user's
   proposed order — Chat goes last, matching its actual use).
4. **Rename the modes (System A).** Update `nav.suggest`, `nav.stress`,
   `nav.counterbalance`, `nav.chat` in `frontend/src/locales/nl.json`:
   - `nav.suggest`: **Verras me**
   - `nav.stress`: **Ik ben op**
   - `nav.counterbalance`: **Wat heb ik nodig?**
   - `nav.chat`: **Praat met me**
   Keep the keys; change the values only.
5. **Style the menu as navigation, not as a settings drawer.** Whisper
   labels per group (`WAT WIL JE DOEN` / `JOUW ACTIVITEITEN` /
   `ACCOUNT`), Group A items at `text-base font-medium py-3.5`,
   Groups B/C at the current `text-sm py-2.5`. Widen panel to `w-64`.
6. **Ship a first-visit hint card** that names the menu. Either extend
   the existing `useWelcome` flow or add a second one-time card on
   `/suggest`. Copy suggestion: *"Meer manieren om te starten vind je in
   het menu rechtsboven."* This is non-negotiable per Lisa and the UX
   review — without it, the discoverability hit is real.

### Don't

7. **Don't put all 4 modes back in a BottomNav.** That's Daan/Lisa's
   fallback, but it re-introduces the keuzestress 001 already flagged.
8. **Don't ship the rename and the layout change separately.** The
   personas conditioned on both — half the change is worse than no
   change.
9. **Don't add mode icons.** The designer's call: warm names carry the
   meaning, icons would clutter and invite bikeshedding.

### Defer

10. **Active-state indicator on the kebab.** A subtle dot when not on
    `/suggest` would help orient users. Add only if testing surfaces
    confusion.
11. **Jeroen's regrouping of Group A by interaction model.** Out of
    scope here. Revisit if the menu starts to feel flat or if a Mode 5
    is added.
12. **`<nav>` + section headings instead of `role="menu"`.** Better
    semantics, simpler code, but not blocking — current implementation
    works for sighted users.

---

## Open questions

- **WelcomeCard versioning.** The first-visit hint should be a *second*
  one-time card or an addition to the existing one. If we extend the
  existing card's copy, returning users won't see the new hint (the
  `unwind-welcomed` key is already set for them). A new key
  (`unwind-menu-hint-seen`) is cheap and avoids that.
- **Active state inside Chat.** With the BottomNav gone, a user mid-
  conversation has no visual anchor that they're "in Chat" vs.
  "elsewhere." The page header probably suffices but verify on real
  device with the keyboard up.
- **`PageShell` padding-bottom.** Today there's bottom padding for the
  BottomNav. After removal, mode pages will gain ~64px of vertical
  space — recheck the `SuggestPage` layout on iPhone SE (smallest
  target) to confirm nothing now sits awkwardly low.
- **Mode 2's empty-state friction.** Tom's anhedonia critique points
  beyond renaming. "Ik ben op" gets him in the door, but a 1–5 stress
  slider may still bounce him. Worth a future review of Mode 2's
  internal flow, not just its label.

---

## Round 2 — review of the shipped implementation

**Date:** 2026-05-13
**Scope:** Same panel + UX-designer lens reviewing the actual build against
their round-1 critique. Implementation matches `docs/plan/18-menu-restructure.md`.

### Headline

**8/8 say ship.** In round 1, 5/7 personas said *don't ship* and 2/7 said
*ship conditional*. After the build, every persona and the designer
endorsed shipping — including Daan, Lisa, and Jeroen, who were the
strongest no-votes. The single load-bearing change was making `/suggest`
the immediate home with no nav-tap required; the renames and the active
state did the rest of the work.

### What changed every no-vote to a yes

| Persona | Round 1 | Round 2 | Key shift |
|---|---|---|---|
| Sanne | Ship (cond.) | **Ship.** | "Voelt af." |
| Daan | Don't ship | **Ship.** | "Niet een graf meer" — modes feel discoverable once the menu opens, and Mode 1 opening directly forgives the buried 2/3. |
| Fatima | Don't ship | **Ship.** | "Nu wel shippen — dit is de versie die ik om 21:30 daadwerkelijk gebruik." |
| Jeroen | Don't ship | **Ship (caveat).** | Accepts the build; flags the kebab-as-trigger pattern as *styled, not solved*. |
| Yuna | Ship (cond.) | **Ship (fix tooltip copy).** | Names sing as a set; tooltip copy still too vague. |
| Lisa | Don't ship | **Ship.** | "Het is geen prototype meer — het is een app." Active-state terracotta is exactly the anchor she missed. |
| Tom | Don't ship | **Ship (next test inside Mode 2).** | "Ik ben op" lets him in; warns Mode 2's internal flow is the next gate. |
| UX/UI | Ship (cond.) | **Ship (one fix).** | Active-mode primary fill is too loud for a nav element. |

### Convergent feedback that didn't drop in round 1

1. **Active-mode background is too loud** (UX designer, Sanne).
   Using `bg-uw-primary text-uw-primary-fg` for the current page is the
   same treatment as the chat send button and the user message bubble —
   a CTA color used for a passive "you-are-here" marker. Sanne: *"Te
   leven mee, niet ideaal."* Designer recommendation: keep the chip row,
   but for active use `bg-uw-accent-soft` (or a darker chip-bg variant)
   plus `text-uw-ink font-medium`. Save `--uw-primary` for things the
   user is supposed to *do*. **Highest-priority follow-up.**
2. **Tooltip copy stayed too generic** (Yuna, UX designer). Both
   independently suggested naming an affordance.
   - Yuna: *"Andere modi en je lijst vind je hier."* (or longer: *"Hier
     vind je andere modi, je lijst en instellingen."*)
   - UX designer: *"Hier zitten de andere manieren om te starten."*
   Both reject the current *"Hier vind je meer manieren om de app te
   gebruiken"* as parking-it-for-later vague. Concrete-named affordances
   would also serve Lisa's discoverability concern (she explicitly wants
   to find Mode 3, *Wat heb ik nodig?*). Worth a follow-up edit.

### What the panel praised

- **Mode names land as a coherent set.** Yuna: *"Vier werkwoorden /
  zinnetjes in dezelfde toon, geen `-atie` of `-ie` meer in zicht. (…)
  Dit is een coherente familie nu."* Tom: *"Ik ben op" laat me wel binnen.*
- **Sentence-case whisper labels** beat the all-caps mock the designer
  originally proposed. Yuna: *"All caps was inderdaad geschreeuw. Sentence
  case + `ink-mute` doet het werk zonder aandacht te vragen."*
- **Tooltip shape (corner-cut, no arrow, soft card surface)** reads as
  anchored to the kebab without visual noise. Designer: *"Better than my
  mock — that would have been visual noise on a screen that's supposed
  to feel calm."* One small dissent: Lisa wondered if the corner-cut is
  sharp enough to read as a pointer (Notion uses a real caret) — minor.
- **Accessibility step (`<nav>` + `<section>` + `<h3>`)** shipped now
  instead of being deferred. Jeroen flagged this as the right
  technical call, even while critiquing the kebab pattern overall.
- **Chat "+" reset at `right-[68px]`** clusters cleanly with the kebab.
  Designer verified: 34px button + 12px gap + 34px button = symmetric
  pair, safe even at iPhone SE width.
- **`.uw-frame` bottom padding** caught the regression cleanly with
  `calc(1.5rem + env(safe-area-inset-bottom))` — designer would have
  hardcoded it less elegantly.

### Persistent dissent (acknowledged, not blocking)

- **Jeroen — pattern-correctness of the trigger.** *"Pattern-wrong
  blijft pattern-wrong."* The dropdown's *content* now behaves like
  navigation, but the *entry point* is still ⋮ — and the kebab convention
  is "overige acties." Acceptable in this build because no persona
  bounced on it, but worth naming: we've styled the kebab-as-nav
  problem, not solved it.
- **Jeroen — Group A still has four incompatible interaction models
  in one bucket.** Visually clustered now (chip backgrounds + active
  highlight), but not regrouped. *"Acceptabel voor nu, niet correct."*
- **Tom — Mode 2's internal flow is the next test.** The label *Ik ben
  op* gets him into the room, but if tapping it leads to a 1–5 stress
  slider, he bounces again. Out of scope for this PR; flagged for a
  future Mode-2 review.

### Recommendations (revised after round 2)

#### Do (small follow-ups, before this lands in main)

1. **Soften the active-mode chip.** Replace `!bg-uw-primary
   !text-uw-primary-fg !font-medium` on `router-link-active` with a
   subtler treatment — `!bg-uw-accent-soft !text-uw-ink !font-medium`
   (theme-aware via `--uw-accent-soft`, which already exists per theme).
   Removes the CTA-shout while keeping the "you are here" signal.
2. **Update the tooltip copy.** Replace the current generic with one
   of the named-affordance alternatives. The shortest that hits both
   Yuna and Lisa's concerns: *"Andere modi en je lijst vind je hier."*
   Or, if Noor still doesn't want the word "modi": *"Andere manieren
   om te kiezen, je lijst en je account."*

#### Don't (resist scope creep)

3. **Don't add an active-state dot on the closed kebab yet.** No
   persona reported being lost; defer until someone does.
4. **Don't replace the tooltip corner-cut with a caret/arrow.** Lisa's
   nit is real but two other reviewers (designer + Yuna) called the
   corner-cut the right amount of visual noise. Real caret would
   over-pin the tooltip.

#### Defer

5. **Mode 2 internal flow review** (Tom's anhedonia point). Should be
   its own report once Mode 2 has user testing behind it.
6. **Regrouping Group A by interaction model** (Jeroen). Revisit if/when
   a Mode 5 is added or the menu starts to feel flat.
7. **Page-heading alignment** to the new mode names (`stress.heading`
   "Hoe gestrest ben je?" doesn't match `nav.stress` "Ik ben op"). Tiny
   follow-up PR.

### Verdict

**Ship the build after the two small follow-ups** (active-mode color
softening + tooltip copy update). The structural decision — kebab as
primary nav surface — was contested in round 1 and now holds across
every persona, including the three round-1 no-votes who explicitly
changed their position. The remaining critiques are real but they're
either small (color, copy) or out of scope (Mode 2 internals, Group A
regrouping).

