# Review 002 — Onboarding: choosing activity sources

**Date:** 2026-05-12
**Scope:** Proposed change to the onboarding flow
**Reviewed by:** UX-designer lens, developer lens, all 7 personas (Sanne, Daan, Fatima, Jeroen, Yuna, Lisa, Tom)

---

## Final direction (added after iteration)

The original proposal — a three-checkbox screen at onboarding — was workshopped
in conversation through two further iterations. The chosen direction is
**no onboarding + device-first auth**:

- Drop the onboarding gate entirely. A new visitor lands directly on the
  suggest page with the base activity library available.
- Auto-create an anonymous device session on first app load. Login becomes
  an opt-in menu action ("Maak een account") that upgrades the existing
  device user via the already-built `POST /auth/upgrade` route.
- Move both customisation options into the menu, alongside the existing
  Mode/theme/privacy entries:
  - *Voeg activiteit toe* → already exists at `/activities` (full CRUD UI
    is built; just needs to be surfaced).
  - *Verzin activiteiten voor me* → reuses the existing onboarding
    generate flow as an in-app feature rather than a gate.

The detailed analysis below explores the design space (single-screen
forced AI vs. multi-source tickbox vs. no onboarding) and remains useful
context. The final direction is the no-onboarding path. See
`docs/adr/ADR-012-device-first-auth.md` and
`docs/plan/17-device-first-auth-no-onboarding.md`.

---

## The proposal

Today a new user is funnelled through an AI-driven onboarding: four
questions → Claude generates 10-15 personalised activities → user lands in
the app with those activities plus the ~26 seeded base activities. The user
*can* add their own activities (the schema and `POST /activities` already
exist), but nothing in the UI encourages it.

The proposal: replace the single forced path with a three-way pick at
onboarding. The user must tick **at least one** of:

1. Add the standard activity library
2. Let AI generate activities for me
3. I want to add my own

Tick one, two, or all three. Goal: make the app feel less rigid, give the
user agency, and avoid the passivity of having everything dropped in their
lap.

---

## Verdict

**The diagnosis is right; the prescription needs work.**

The current onboarding *does* push AI generation as the default path, and
"add your own" is invisible. Both problems are real. But a three-checkbox
gate at the moment of weakest decision-capacity (a depleted user who just
signed up) trades one rigidity for another kind of friction.

The fix is mostly about defaults and discoverability, not about asking the
user to assemble their library at the door. Below is what changes if you
ship the proposal as-is, and a softer alternative that preserves the goal
without inflating onboarding load.

---

## UX-designer lens

### What the proposal gets right

- **Frames the app as customisable, not prescriptive.** The current flow
  signals "we know what's good for you" — fine for some users, alienating
  for others (especially Lisa, who has no diagnosis to anchor against, and
  Jeroen, who likes to control his own systems).
- **Surfaces "add your own" at all.** Right now it's a hidden feature.
  Anything that nudges users toward authorship over passivity is a win for
  retention — the 001 panel called pool exhaustion an existential risk for
  Daan-type users.
- **Decouples AI from the default path.** Some users will never want AI
  involvement and should not have to opt out of it as the only escape.

### What worries me

1. **Onboarding decisions are the wrong place for high-agency choices.**
   The 001 report's #1 finding was "navigation itself is keuzestress." A
   tickbox triad at onboarding *is* the same anti-pattern. The user who
   just installed the app at 21:30 because they couldn't decide what to do
   is being asked to make a strategic decision about how their library is
   composed. They don't yet know what "standard activities" feel like vs.
   "AI activities" — they have no basis for the choice.

2. **A multi-select widget is heavier than it looks.** "Tick at least one"
   means the user has to (a) read three labels, (b) parse each option's
   implications, (c) decide whether to combine them, (d) validate they
   ticked enough, (e) commit. That's five micro-decisions. The current
   four-question form is already at the upper bound for Fatima and Daan.

3. **Empty-state risk.** A user who ticks only "I want to add my own" lands
   on a screen with nothing on it and has to invent activities cold. That's
   precisely the problem the app exists to solve — generating ideas the
   user cannot generate themselves. The proposal allows the user to opt
   into the failure mode the product was built to prevent.

4. **"Add your own" at onboarding is performative for most users.** Daan,
   Sanne, Fatima, Tom will tick it because the box is there and never
   actually add anything because they have no activities in mind on first
   open. It would feel like agency, but produce nothing. Real ownership
   happens *during use* ("oh, I want to add the thing I just thought of"),
   not at the gate.

5. **It shifts the moment of authorship away from when it's useful.**
   The most powerful time to invite a user to add their own activity is
   when they've just skipped three suggestions in a row, or after they
   complete an activity they liked, or when the library is exhausted —
   not when they've never seen a suggestion yet.

### What I'd recommend instead

**Strong defaults + permanent invitation, not a gate.**

- **Standard activities are always on at onboarding.** Make them the
  guaranteed floor — the user can't end up with nothing. They can hide
  ones they dislike later (the `user_hidden_activities` table is already
  there).
- **AI generation is one optional step, not a tickbox.** Keep the existing
  4-question form but reframe the framing: "Wil je dat we ook een paar
  activiteiten voor je verzinnen?" → if yes, the questions; if no, straight
  to the app. This is what already exists (skip path) — just present it
  as equally legitimate, not as opting out.
- **"Add your own" is a feature in the app, not a step at onboarding.**
  Put a prominent `+` button on the library and on Mode 1's empty/exhausted
  state. Add a one-line encouragement in the post-onboarding "done" screen:
  *"Mis je iets? Voeg het zelf toe — onder in je lijst."* That's where
  agency actually lives.

If you do want a three-way picker, structure it as a **path tile screen,
not a checkbox list**, with one tile preselected and the others framed
as additions rather than independent choices:

```
Hoe wil je beginnen?

  [✓] Begin met onze basis-activiteiten          (preselected)
  [ ] Plus: laat AI er een paar voor jou verzinnen
  [ ] Plus: ik voeg er straks zelf bij

         [ Verder ]
```

A preselected sane default, additive language, no validation needed. Same
expressive power as the proposal, half the cognitive load.

---

## Developer lens

### What's already in place

- `activities.source` already accepts `'base' | 'user' | 'ai'`. The schema
  supports all three sources side-by-side; no migration needed for that.
- `POST /activities` exists with full CRUD. The "add your own" frontend
  is the only missing piece — backend is done.
- `user_hidden_activities` (migration 005) is the right primitive for
  letting a user suppress base activities without deleting them globally.
- `onboarding/skip` exists and stamps `onboarding_completed_at` — so
  "decline AI generation" is already a supported path.

### What the proposal would actually require

| Piece                                       | Effort | Notes |
|---------------------------------------------|--------|-------|
| New UI: tickbox/tile step in onboarding     | S      | One step in the existing wizard |
| "User opted out of base activities"         | S      | Either one column on `users` (`show_base_activities BOOL`) or bulk-insert into `user_hidden_activities` at onboarding. The column is simpler and reversible. |
| Apply the filter in suggestion queries      | S–M    | Every query that touches `WHERE source = 'base' OR user_id = $1` needs the new predicate. There's a handful — check `activities.ts`, `buildSystemPrompt.ts`, Mode 2/3 endpoints. |
| "Add your own" UI (form, list edit, delete) | M      | Backend is ready. Needs an `ActivitiesPage.vue` or library tab, an `ActivityForm.vue`, and route wiring. This is the bulk of the work, but it's worth doing *regardless* of the onboarding proposal. |
| Empty-state handling                        | S      | If user picks only "add my own" and the list is empty, Mode 1 needs a useful empty state. |
| Tests                                       | S      | Filter logic + the new opt-out column. |

### Architectural notes

- **Prefer a `show_base_activities` boolean on `users` over fan-out into
  `user_hidden_activities`.** Two reasons: (a) reversibility — the user
  can flip it later in settings without orphaned hidden rows; (b) it's a
  user preference, not a per-activity decision, so it belongs on the user
  row. The hidden-activities table stays for granular "hide *this one*"
  actions during use.
- **Don't copy base activities into per-user rows.** That breaks the
  "shared library" model, blows up the table, and decouples future edits
  to base activities from existing users.
- **AI generation already rate-limited at 3/week.** If users opt out of
  AI at onboarding but turn it on later, the same limiter applies — good.
  But this means "opt in later" needs an entry point in settings or the
  library page.
- **Don't gate suggestion queries on `onboarding_completed_at`.** A user
  who picks "only my own" and adds nothing still has the base library or
  AI-generated activities (depending on their pick). Just make sure the
  filter is correct.

### Risk to flag

If you ship the three-way tickbox without making "add your own" actually
work first, you'll have created a UI promise the app doesn't deliver on.
Worst case: user ticks "ik voeg zelf toe" expecting an editor, lands in
Mode 1, sees no obvious add button, and concludes the app is broken.
Build the library/add-activity UI first; *then* expose source choice.

---

## Panel of users

| Persona | Reaction to the proposal | Would tick |
|---------|-------------------------|------------|
| Sanne   | Three checkboxes is three decisions she can't make tonight. Picks whichever is preselected. | Whatever's default |
| Daan    | "Sure, why not." Won't read the labels. Taps through. | All three, probably |
| Fatima  | Extra decision step. Picks the safest-looking option and moves on. | Standard only |
| Jeroen  | **Loves this.** Wants control, will tick deliberately. | Standard + AI, maybe own |
| Yuna    | Notices the wording. Likes that AI is opt-in. Worried "add your own" feels like homework. | Standard + AI |
| Lisa    | Welcomes options, expects this from any consumer app. Won't be intimidated. | Standard + AI |
| Tom     | Three options is too many. Brain fog. Wants the path of least resistance. | Whatever's default |

### Sanne — *autistic, shutdown, sensory-sensitive*

> Vier vragen, en nu nog drie vakjes. Ik ben hier juist omdat ik niets kan
> beslissen. Wat is het verschil tussen "standaard" en "AI"? Geen idee. Ik
> klik gewoon op de bovenste en hoop dat het goed is.

Strongly prefers a single preselected default. The tile/path framing
(with one preselected) works for her; the freeform checkbox list does
not.

### Daan — *ADHD, restless, impulsive*

> Drie knoppen. Tik tik tik klaar. Wat doen ze? Boeit niet, ik wil de app
> in.

Will tick all three without reading, then forget he did. The risk for
Daan isn't the choice itself — it's that he'll never use the "add your
own" feature he just enabled. But: he's the persona who'd most benefit
from custom activities once the pool exhausts. Surface the add-your-own
button *in the app*, when he's about to skip his fifth activity in a row.

### Fatima — *ADHD + autistic, burnout, low energy*

> Negen uur 's avonds. De kinderen liggen. Ik open een app om niet meer
> te hoeven nadenken. En dan vraagt-ie me of ik m'n eigen activiteiten
> wil bedenken? Nee. Doe maar gewoon iets.

For Fatima, the proposal moves in the wrong direction. She does not have
the bandwidth to architect her library at onboarding — that's a Sunday-
afternoon task, not a 21:30 task. Strong default + visible "+"
button-in-the-app would serve her better.

### Jeroen — *autistic, alexithymic, pattern-oriented*

> Logisch. Drie bronnen, ik kies welke ik wil. Geen verborgen aannames.
> Ik tik standaard en AI aan, eigen activiteiten later als ik een patroon
> heb gezien.

**This is the persona the proposal is designed for.** Jeroen treats the
app as a system and likes explicit control over its inputs. He's also
the user who'd most rigorously use "add your own" later, once he's seen
which AI activities don't match his life.

### Yuna — *ADHD, designer, language-sensitive*

> Hoe is dit verwoord? "Voeg mijn eigen activiteiten toe" klinkt als
> werk. Maar de keuze zelf vind ik wel netjes — dat de AI niet wordt
> opgedrongen is fijn. Ik vertrouw apps die me niet pushen.

For Yuna, the *framing* is the whole feature. "Plus: laat AI er een paar
voor jou verzinnen" lands differently than "Activiteiten door AI laten
genereren." The proposal succeeds or fails on the copy. If the Dutch
sounds clinical or institutional, she'll dismiss the screen aesthetically
before reading it.

### Lisa — *neurotypical, polish-conscious*

> Prima. Drie opties, ik snap het. Wel zo prettig dat het mijn keuze is
> en niet automatisch. De AI-route had me misschien afgeschrikt — die
> voelt soms een beetje "wellness app voor mensen met problemen."

Lisa welcomes the opt-in framing for AI specifically because it
de-emphasises the neurodivergence-coded "we'll figure out what's wrong
with you" implication. She'd tick standard + AI and move on. The
proposal serves her well *if* the page looks finished — she'll dismiss
the app over a flat or developer-prototype UI before she dismisses it
over the concept.

### Tom — *burnout recovery, anhedonia, low activation*

> Standaard. Verder. Ik wil niks bedenken. Ik wil dat iemand zegt: doe
> dit, vijf minuten.

Tom is the strongest argument for **strong defaults**. He won't engage
with the choice screen at all — he'll pick whatever requires the least
thought. If "standard activities" is preselected and the next button is
prominent, he gets through. If he has to tick a box first, he might just
close the app.

---

## Cross-cutting findings

**1. 4/7 personas (Sanne, Fatima, Tom, Daan) need the choice to have a
sensible default.** Without preselection, they'll bounce or pick
arbitrarily.

**2. 2/7 personas (Jeroen, Lisa) want the choice and will use it
deliberately.** They are the audience the proposal genuinely serves.

**3. Nobody at onboarding is in a state to *use* the "add your own"
option meaningfully.** Across all seven personas, the moment of authorship
that matters is *after* they've seen some suggestions — not before.
Surfacing the option at onboarding is symbolic; surfacing it in-app is
functional.

**4. Tone and copy matter as much as structure.** Yuna and Lisa would
respond to "Plus: laat AI er een paar voor jou verzinnen" very
differently than "Activiteiten genereren met AI". The exact Dutch needs
review.

---

## Recommendations (revised for final direction)

### Do

1. **Drop onboarding as a gate.** Land new visitors on `/suggest` with the
   base library already available. The base activity descriptions were the
   *only* asset all 7 personas praised in 001 — they are the strongest
   possible first impression and the fastest path to value.
2. **Auto-create a device session on first app load.** The infrastructure
   exists (`POST /auth/device`, `unwind-device-id` in localStorage). What
   needs to change is the router boot: instead of redirecting unauthenticated
   visitors to `/login`, transparently device-auth them.
3. **Surface both customisation features in the menu.** Add
   "Voeg activiteit toe" (the existing `ActivitiesListPage.vue` CRUD form is
   already built — just promote it) and "Verzin activiteiten voor me"
   (reuses `POST /onboarding/generate` as an in-app feature). The library
   page also doubles as Mode 1's exhausted-state recovery: when the pool
   runs out, link there rather than dead-ending on "Geen nieuwe suggesties
   meer".
4. **Make login an upgrade, not a gate.** A user only logs in if they want
   sync across devices or to protect their data. The endpoint is
   `POST /auth/upgrade` and it already works for an anonymous user — they
   keep their activities, memories, and history, just gain an email +
   password.

### Don't

5. **Don't ship a multi-checkbox source-choice screen.** It introduces
   decisions at the moment of weakest decision-capacity. Strong defaults
   beat expressive choice for this audience.
6. **Don't auto-prompt for account upgrade on first visit.** That recreates
   the gate problem. Wait until the user has invested in customisation
   (added activities, generated AI ones, accumulated memories) before
   nudging them to protect their data.

### Defer

7. **Welcome card on first open.** Optional. A tiny dismissable card on
   the first suggest-page visit naming the menu actions (Voeg toe / Verzin
   voor me) helps Lisa and others who expect *some* signal that the app is
   complete. Cheap to add later if the deletion-first approach feels too
   bare.
8. **Contextual upgrade nudge after N custom activities.** Solves the
   data-loss-without-account risk, but only useful once users actually
   have data worth losing. Defer until the no-onboarding shape is live and
   real users have started to invest.

---

## Open questions

- **Anonymous logout UX.** The menu currently has a "Logout" button that
  pushes to `/login`. For anonymous users this is incoherent — there's
  nothing to log out of, and `/login` will no longer be a destination. The
  button should probably be hidden for anonymous users and replaced with
  "Maak een account" (upgrade) in the same slot. Logged-in (email) users
  keep the current logout behavior.
- **Welcome state copy.** If we do add a first-open card, what does it
  say? The Yuna lens applies — Dutch tone matters. Probably one sentence
  + two action affordances.
- **Mode 4 cold start.** Memory injection currently relies on the
  onboarding-generated facts. Without that step, Mode 4's system prompt
  has less personalisation context. Probably fine per 001 (Mode 4 is
  nobody's primary), but worth naming.
- **`onboarding_completed_at` column.** Becomes vestigial after the gate
  is removed. Keep for analytics or migrate away in a later cleanup.
