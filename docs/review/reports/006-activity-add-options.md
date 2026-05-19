# Review 006 — Activity-add mechanisms on top of the starter library

**Date:** 2026-05-19
**Scope:** Panel review of the basic app concept (one suggestion at a time, ~30 shared starter activities) plus four proposed mechanisms for users to add activities on top of that library. Long-term retention question included.
**Reviewed by:** Seven personas (Sanne, Daan, Fatima, Jeroen, Yuna, Lisa, Tom) and three expert lenses (giftedness, neurodivergence, average/below-average cognitive profile).

---

## The proposal under review

The current state:

- **Mode 1 (Suggereer)** — one random activity at a time from a shared starter library of ~30 items. Accept or skip.
- Other modes still in flux (see 004, 005).

The four library-growth mechanisms under review:

1. **Self-add CRUD.** User types in their own activity. Basic create / edit / delete.
2. **AI-generated.** User tells the AI things about themselves (e.g. "I'm autistic", "I'm gifted", "I want to stay inside"); AI uses that plus the user's accept/skip history to generate a handful of activities the user can edit and add.
3. **Swipe-up on a suggestion.** Two actions: *"meer zoals dit"* (AI generates similar, user can edit/add) and *"stel deze nooit meer voor"*.
4. **"Voeg toe in je eigen woorden"** — after a user accepts an activity, an option appears to rephrase and save it to their personal list.

And the retention question: *would you still be using this app in 3 / 6 months, and if not, what would have to change?*

---

## Headline

**The concept is right; the library-growth strategy is the make-or-break decision now.**

The single-suggestion-at-a-time spine is endorsed without dissent — every persona named it explicitly as "the one thing not to change." The shared starter library is also endorsed *as a floor*, but every voice independently named the same shelf-life: **two to four weeks before the library feels exhausted**, regardless of activity quality. Library growth is therefore not an optional fifth feature — it is the spine's load-bearing complement, and the choice of *which* growth mechanism the team builds first determines whether the app holds at three months.

The panel converges on a clear ranking of the four mechanisms:

1. **Swipe-up "more like this" / "never again"** — unanimous endorsement. Zero typing, one gesture, grows the library through pure behaviour. The avg/IQ lens calls this *the single most accessible library-growth mechanism* in the proposal; every persona endorses it. *"Never again"* matters more than *"more like this"* — three personas (Sanne, Yuna, Fatima) flagged this independently.
2. **"Add in your own words" after accepting** — **the experts' top pick, the personas' most-skipped option.** The giftedness lens calls it "the sleeper": lowest cognitive cost, highest authorship yield, because the activity has already been validated by the body and authorship is captured *on the way out*. The ND lens calls it the DBT self-generated-coping-menu intervention attached to the moment of behavioural success. The personas reject it as "homework after the activity" — but they all assumed a form. **Implementation as one-tap save-as-is with an optional rename is the entire ballgame.**
3. **AI-generated from self-description + history** — high ambition, sharp subgroup split. The strongest library-growth lever for the average-cognitive / ADHD / Lisa-mainstream user *if* inputs stay tappable; **catastrophic for PDA-coded users** (ND lens: the maximal-demand framing they pattern-match as coercive); **unreliable for alexithymic users** (self-description input is noise); **deskilling for the gifted-archetype** (giftedness lens: trains the user to outsource self-knowledge).
4. **Self-add CRUD** — lowest persona enthusiasm but structurally necessary. The giftedness lens names it precisely: *"necessary but insufficient — the destination of authorship, not the entry point."* Everyone agreed that if it ships, it must be **one field, no title/description/tags/duration/category** — the moment it looks like a form it dies.

The retention question lands sharply: with the current scope (Mode 1 + 30 activities), **nobody on the panel would still be using the app at six months.** What sustains use is a quiet, almost-stealth inversion: the shared library fades into background as the user's own / rephrased / AI-tailored items become the foreground. The giftedness lens names this "the inversion" and treats it as the design's success state.

---

## What the panel agrees on

### 1. Single-suggestion-at-a-time is the spine. Do not touch it.

Every persona named it as the thing to keep:

- Daan: *"Eén ding op het scherm. Geen lijst, geen categorieën, geen filter-UI die ik eerst moet instellen. Op het moment dat dit een keuzemenu wordt ben ik weg."*
- Fatima: *"De eenvoud. Eén suggestie. Eén tap. Niet meer."*
- Tom: *"De eenvoud van mode 1. Eén ding, accepteren of overslaan. Niet aan komen."*
- Sanne: *"Houd het donker, houd het stil, houd het traag."*
- Lisa (NT): *"The restraint is genuinely refreshing — the opposite of every wellness app I've quit."*
- Yuna: *"De eenvoud van één knop, één suggestie. Voeg dingen toe ónder die laag, niet erboven."*

The avg/IQ lens names *why* it works: a binary yes-now / not-now decision sits below the working-memory ceiling that derails grid-based pickers. The ND lens names *for whom* it works best (ADHD-dominant: natural fit; ND-burnout: only manageable two-tap surface) and *for whom* it needs scaffolding (monotropic / autistic-dominant: random will miss the tunnel almost always, library must personalise fast).

### 2. The ~30 shared starter library is a floor, not a runway.

Universal: somewhere between two and four weeks, the library feels exhausted, regardless of content quality. Daan: *"Bij ronde 4–5 zie ik al iets dat ik eerder zag en dan ben ik weg."* Yuna: *"Drie weken, niet drie maanden."* Lisa: *"I'd churn in two weeks."* Avg/IQ lens: *"Once a user has seen each item three or four times and skipped the ones that don't fit them, the app silently converges to a tiny effective set, and the user — not the library — gets blamed in the user's own head."*

This makes the library-growth question structural, not optional.

### 3. Swipe-up "never again" is universally endorsed; "more like this" is endorsed with a caveat.

Every voice on the panel endorsed the swipe-up mechanism. Specifically:

- **"Never again"** — three personas (Sanne, Yuna, Fatima) flagged this as *more* important than "more like this." Fatima: *"Heerlijk. Dat ik dat één keer kan zeggen en het is weg, dat voelt als gehoord worden."* Tom: *"Als iets drie keer voorbijkomt dat ik niet aankan, wil ik dat weg kunnen vegen zonder uitleg."* This is the **agency-without-effort** lever — the single cheapest way to make the app feel responsive.
- **"More like this"** — endorsed by every voice, with one caveat from the ND lens: *"Similarity in a shared-library taxonomy is rarely similarity along the dimension the user's tunnel runs on. A monotropic user fixated on the tactile-water aspect of 'shower' does not want more bathroom activities; they want more wet-skin sensory activities, and no embedding will reliably catch that."*

Implementation notes from the panel: discoverable without a tutorial pop-up (Sanne, Daan, Lisa); undo-able (Yuna); no "are you sure?" modal (Daan).

### 4. The "add in your own words" mechanism is the highest-yield / highest-risk feature in the proposal.

This is where personas and experts diverge most sharply. The experts converge on it as the strongest of the four mechanisms; five personas (Daan, Fatima, Tom, Lisa, Yuna) would not use it. The reconciliation:

- **All the persona rejections assume a form.** Daan: *"Dit voelt als de app die nog iets van me wil terwijl ik klaar ben."* Tom: *"Typen blijft typen. Verplicht: nee, dan zou ik skip gaan drukken om de prompt te vermijden."* Lisa: *"Once I've accepted [...] I'm going to the bank, not back to the app to journal about it."*
- **The experts assume one-tap save with optional rename.** ND lens: *"A one-tap save-as-is with an optional rename, not a form. The save itself is the attachment event; the rename is the authorship layer for users who have the words. This single change serves monotropic authoring, PDA non-demand framing, alexithymic limits, and burnout decision-surface — without forcing any of them through the same flow."*

When asked to imagine the experts' version, Sanne's response is the strongest endorsement on the panel: *"Dit vind ik het mooist van de vier. 'Doe een ademhalingsoefening' betekent niks voor mij. 'Drie keer langzaam door je neus inademen terwijl je naar het plafond kijkt' is iets dat ik kan doen."* — which is precisely the provenance-flipping mechanism the giftedness lens predicts.

**Implementation is the entire feature.** A form here is wasted; one-tap save-as-is is the highest-leverage authorship capture in the design.

### 5. AI-generated activities work — under strict conditions, and badly for at least one subgroup.

Personas who would use it (Daan, Yuna, Fatima, Lisa) converged on identical requirements:

- **Tappable form, not freeform text.** Freeform = depleted users bounce. The form-style onboarding ("setting / social / interests") already in the codebase is the right shape; do not regress.
- **No clinical / therapy-coded Dutch.** Yuna: *not* "U zou kunnen overwegen…", but *"zin om wat te schetsen met die fineliners die je laatst kocht?"* Tom: *"Geen 'wat tof dat je van wandelen houdt!' — dan haak ik af."*
- **Neutral, calibrated tone.** Yuna (echoing 005): *"Een AI die durft te zeggen 'dit is een gok' in plaats van 'hier is een suggestie speciaal voor jou'."*
- **Skip-history as the primary input.** Daan: *"Het moet écht uit mijn skips komen, niet alleen uit wat ik intik. Want intikken doe ik niet — ik tap door tot de eerste vraag waar ik geen zin in heb en dan stop ik."*

The expert lenses add three subgroup-specific warnings:

- **Giftedness:** by session 10, an authorship-gradient leak. The model returns a tidy list; the list will be *good* and feel *external*. Quietly trains the user that "knowing what relaxes me" is something to outsource. Six months in, the gifted user resents this without naming it. **Mitigation: AI suggestions land in a draft tray that must be edited before they become part of "your" list.** The edit step is where authorship transfers.
- **ND (PDA-coded):** *catastrophic.* "The AI picked these for you based on what you told it" combines personal *and* authoritative — the maximal-demand framing PDA pattern-matches as coercive. Cannot serve both this user and the ADHD-novelty-seeker with the same flow without copy that re-frames AI output as offering, not assignment.
- **ND (alexithymic):** the self-description input is noise, so the output is noise dressed as personalisation. Behavioural history (accept/skip with state context — see §6) is the only signal that works for this subgroup.

### 6. Skip ≠ "wrong for me." It means "too much effort right now."

This is the single most important reframe from the round, surfaced independently by Jeroen and the ND lens and consistent with the warning Jeroen also raised in 005:

> Jeroen: *"Mijn skips zijn vaak 'te veel moeite', niet 'verkeerde suggestie'. Als de AI dat onderscheid niet leert, gaat hij me steeds laagdrempeligere dingen voorstellen tot ik alleen nog 'ademhaling' krijg."*

> ND lens: *"Alexithymic users are largely unbothered by the suggestion itself but are harmed if accept/skip is ever framed as 'did this help?' — they will not know."*

If AI generation and pruning (005) both treat skip as fit-signal, the entire library converges to the smallest-effort subset for every user, regardless of what would actually serve them on a good day. The convergent fix surfaced in the round:

- An **after-the-fact** signal — *"dit hielp echt"* / *"deed het maar het hielp niet"* — feeding back as the primary fit-signal.
- A **"log what I just did outside the app"** button (Jeroen): observation, not introspection. Closes the gap between behaviour and self-report.

### 7. Long-term retention requires the shared library to fade into the background.

What sustains 3–6 month use, named consistently across the panel:

1. **The inversion** (giftedness lens): the user's own / rephrased / AI-tailored items become the foreground; the shared starter library fades. *"At six months, sustained use requires the app to have become a mirror of the user's own pattern recognition, not a content source."*
2. **Quiet automatic top-up** (avg/IQ lens): "*the app must generate new activities for this user on a cadence — e.g., a quiet background top-up triggered by skip-streaks or low novelty — not wait for them to ask.*" Re-onboarding prompts at month 2 and 4, tappable not typed.
3. **No streaks, no badges, no notifications, no "we miss you" emails.** Lisa, Tom, Fatima, Sanne all volunteered this independently. Tom: *"De dag dat ik het breek, verwijder ik de app."* Sanne: *"Geen notificaties. Geen 'we missen je'-mails. Geen nieuwe features die ik moet leren."*
4. **The app must feel like it asks less of you over time, not more** (Sanne). The arc is *receptive entry, authorial exit* — generation captured on the way out (option 4), never demanded on the way in.
5. **Provenance is visible** (giftedness lens): every activity card silently signals *yours / yours-rephrased / library / AI-suggested*. Not as a gamifiable badge — as honest sourcing. *"The team will be tempted to hide the distinction for cleanliness. Resist that."*

### 8. The ND-burnout subgroup will use the app episodically and abandon it between episodes. That is correct behaviour, not failure.

ND lens, unambiguous: *"ND-burnout users use the app intensely during burnout episodes and abandon it between them — that is correct behaviour, not failure, and retention metrics that punish it are measuring the wrong thing."* Tom's review confirms: he will not engage with Option 1, 2 or 4 in the moment he needs the app most; he will use Option 3 (swipe-up) and accept/skip. That is the entire product for him, and that is fine — provided the design does not push him toward features he cannot operate on a bad day.

---

## Where the panel disagrees (design trade-offs, not bugs)

### Tension 1 — AI-generated activities serve ADHD / avg-cognitive / mainstream users and harm PDA-coded users with the same flow.

The avg/IQ lens calls Option 2 *"the best library-growth lever for the authoring-limited user"* (provided inputs are tappable); the ND lens calls it *"catastrophic for PDA"*. Cannot be served by the same UI without copy that re-frames the output as **offering, not assignment**. A practical resolution surfaced by Yuna and the ND lens: the AI's voice should carry **calibrated uncertainty** (*"dit is een gok"*) rather than authoritative match-claims (*"hier is een suggestie speciaal voor jou"*) — the uncertain framing dissolves the demand quality PDA reacts to and is *more* honest for everyone else.

### Tension 2 — "More like this" clusters by surface taxonomy, not by the user's actual tunnel dimension.

A monotropic user fixated on tactile-water sensation does not want more bathroom activities. No embedding-based clustering will reliably catch the dimension. **No fix surfaced this round.** Two candidate directions for a future review:
- Let the user, on swipe-up, optionally pick one of a few facets the AI guesses ("water / outside / quiet / hands") — collapses to a single tap, refines the cluster.
- Treat "more like this" as a *prompt extension* rather than clustering — the AI re-reads the user's whole activity history when generating siblings, not just the activity in front of them.

### Tension 3 — ND-targeted framing vs. mainstream framing (Lisa-positioning vs. Sanne/Tom-positioning).

Sanne and Tom want the app to feel built for them. Lisa explicitly stated: *"if anywhere on the landing it says 'voor neurodivergente breinen,' I close it. Sanne can have it."* This is the same positioning tension named in earlier reviews; this round did not resolve it but did surface a useful frame from Lisa: *"a permission slip for overscheduled adults, not a wellness app for them, not me."* Whether that copy holds for both audiences is a content question, not a panel verdict.

### Tension 4 — Authoring romanticism vs. depletion reality.

The giftedness lens self-corrects in its bias-watch: *"A design optimised entirely for generation will fail the user at exactly the moment of need. Receptive entry, authorial exit: let her consume one library item now, and capture her authorship on the way out (option 4), not on the way in. Do not let the gifted-authorship frame talk the team out of a low-friction consume path for the worst evenings."* This explicitly endorses the avg/IQ lens's depletion-floor concern from earlier reports.

### Tension 5 — Where does Option 1 (full CRUD) live?

Giftedness lens: *"the destination of authorship, not the entry point."* Personas: would only use on a good-day Sunday. ND lens (implicit): monotropic users would use it as the attachment moment at session 50. **No conflict if framed correctly**: Option 1 ships as a low-prominence "edit / add" surface that the user discovers after they have already accumulated a personal list through Options 3 and 4. Not the on-ramp.

---

## The single highest-impact recommendation from this round

> **Implement Option 3 (swipe-up) and Option 4 (post-accept save) first. Implement Option 4 as one-tap save-as-is with an optional rename — not a form.** Together they grow the library through pure behaviour and capture authorship on the way out, without ever requiring authoring on the way in. Implement Option 2 (AI-generated) next, gated behind the tappable-form-only constraint, an edit-tray for the giftedness/PDA risks, and a calibrated-uncertainty copy register. Implement Option 1 (CRUD) last and keep it one-field-minimal — it is the destination, not the entry point.

And the cross-cutting design recommendation the experts converged on:

> **Make provenance visible** on activity cards (*yours / yours-rephrased / library / AI-suggested*). The shared library fading into background as the user's own items dominate is the design's success state — users need to be able to see that happening.

---

## Expert lenses

## Expert lens — Giftedness psychologist

### 1. Concept-level read

A single random suggestion from a shared starter library places the archetypal gifted adult firmly in *consume* mode from session one. The library is unearned input: well-meant, possibly objectively fine, but it carries none of her autobiography, so her criticality engine activates before her nervous system can. Randomness compounds this — it strips the one feature that would make consumption tolerable (legible curation logic she could argue with). Around thirty items also implies fast collision with repeats, which for an intellectually overexcitable brain reads as "this app does not know me" within a handful of sessions. The shared-library framing telegraphs *wellness content*, which is precisely the genre her existential-frustration reflex is primed to reject.

### 2. The four add-options

*Self-add CRUD.* The strongest authorship signal of the four. The activity is unambiguously hers; provenance is self-evident; it deskills nothing. The risk is not the feature — it is that on a depleted evening she cannot generate from cold. So CRUD is necessary but insufficient: it works as the *destination* of authorship, not the entry point.

*AI-generated from self-description.* High first-session appeal, steep authorship gradient leak by session ten. She tells the model she is gifted/autistic/introverted; the model returns a tidy list. The list will be *good* and feel *external* — the exact provenance-vs-quality trap her lens predicts. Worse, it quietly trains the user that "knowing what relaxes me" is something to outsource. Six months in, that is a deskilling she will resent without naming.

*Swipe-up "more like this" / "never again."* The most ambivalent. "Never again" is pure agency and cheap to honour — keep it unconditionally. "More like this" is consume-mode dressed as choice: she is evaluating AI guesses about her own pattern, which her criticality engine will do *involuntarily and exhaustingly*. Acceptable only if the generated items land in a draft tray she must edit before they become hers — the edit step is where authorship transfers.

*"Add in your own words" after accepting.* The sleeper. It exploits a moment when the activity has already been validated by her body (she accepted, presumably did it), and asks her to *name* it. Five words of her own attach autobiographical weight to a previously-external item; provenance flips mid-flight. Lowest cognitive cost, highest authorship yield. Rank: **4 > 1 > 3 (with edit-gate) > 2**.

### 3. Long-term trajectory

At three months: the archetype is still present only if her list is now visibly *hers* — meaning option 4 (and 1) have done their work and the shared starter items are a shrinking minority. If the ratio is still mostly-library, she has churned, probably citing "it got repetitive" — the surface complaint for what is actually a provenance failure. At six months: sustained use requires the app to have become a *mirror of her own pattern recognition*, not a content source. The shared library must fade into background; her additions, her rephrasings, her never-again list, are the foreground. Without that inversion, six-month retention for this archetype is near zero, regardless of activity quality.

### 4. Concrete design recommendation

Make provenance visible in the UI. Every activity card should silently signal *yours / yours-rephrased / library / AI-suggested*. Not as a badge to gamify — as honest sourcing. The gifted user cannot accrue ownership over items whose origin is opaque, and the team will be tempted to hide the distinction "for cleanliness." Resist that.

### 5. Bias to watch

This lens romanticises authoring. On a genuine shutdown evening, the archetype cannot author — that is the whole reason she opened the app. A design optimised entirely for generation will fail her at exactly the moment of need. The correct read is *receptive entry, authorial exit*: let her consume one library item now, and capture her authorship on the way out (option 4), not on the way in. Do not let the gifted-authorship frame talk the team out of a low-friction consume path for the worst evenings.

---

## Expert lens — Neurodivergence psychologist

### 1. Concept-level read

A single random suggestion from a shared library lands very differently across the ND population. For the **monotropic / autistic-dominant** user, a random pick is statistically almost always *outside* the current attention tunnel — it will read as noise and be skipped reflexively, regardless of how well-curated the activity is. For the **PDA-coded** user, the act of the app proposing anything at all carries implicit demand; the lighter the framing ("wil je…?" rather than "probeer…"), the longer they last. The **ADHD-dominant** user is the natural fit here: novelty + low decision surface + external push is exactly the affordance executive-dysfunction needs, and the shared-library randomness is a feature, not a bug. The **alexithymic** user is largely unbothered by the suggestion itself but is harmed if accept/skip is ever framed as "did this help?" — they will not know. The **ND-burnout** user can manage the two-tap surface, but only if the copy does not ask them to evaluate, only to act-or-defer.

### 2. The four add-options — per subgroup

**Self-add CRUD.** Lands best for the monotropic user — this is the attachment moment the lens looks for, the naming-in-own-words step that makes items non-inert at session 50. Also good for PDA: nothing the app authors is a demand. Backfires for ND-burnout (typing is a wall at 9 PM) and is largely irrelevant for the ADHD-dominant user, who wants externally-supplied novelty and will not curate.

**AI-generated from self-description + history.** This is the option with the sharpest subgroup split. *Good* for ADHD-dominant: more novelty, less authoring labour. *Catastrophic* for PDA: "the AI picked these for you based on what you told it" is the maximal demand framing — it makes the suggestion personal *and* authoritative, which is the exact combination PDA pattern-matches as coercive. *Unreliable* for alexithymic users: the self-description input is noise, so the output is noise dressed as personalisation. *Mixed* for monotropic: helpful if the AI happens to land in-tunnel, useless otherwise, and the user has no way to tell the system what the tunnel currently is.

**Swipe-up "more like this" / "never again".** "Never again" is universally good — it shrinks decision surface for everyone, especially burnout. "More like this" is where monotropism bites: similarity in a shared-library taxonomy is rarely similarity *along the dimension the user's tunnel runs on*. A monotropic user fixated on the tactile-water aspect of "shower" does not want more bathroom activities; they want more wet-skin-sensory activities, and no embedding will reliably catch that. ADHD-dominant users benefit straightforwardly. PDA users are neutral — it is a refinement of their own gesture, not an external proposal.

**"Add in your own words" after accepting.** Theoretically the strongest mechanism in the lens — it is exactly the DBT self-generated-coping-menu intervention, attached to the moment of behavioural success. *Excellent* for monotropic and PDA. *Hard* for alexithymic users: "in your own words" presumes access to the language of inner experience, which is precisely what is unreliable. *Unusable* for ND-burnout in the moment they most need the app. Needs a no-op default ("save as-is") so the authoring is an option, not a step.

### 3. Long-term trajectory (3 / 6 months)

**ADHD-dominant** is the subgroup most likely to still be opening the app at 6 months, and ironically the one that needs the add-features least — they sustain on a refreshed shared library alone. **Monotropic** users drop off around month 2 unless they have authored ≥5 items themselves; the library becomes inert. **PDA** users drop off fastest of any subgroup unless the copy is rewritten end-to-end in offering-not-instructing voice; current "Suggereer" framing is borderline. **ND-burnout** users use the app intensely during burnout episodes and abandon it between them — that is correct behaviour, not failure, and retention metrics that punish it are measuring the wrong thing.

### 4. Concrete design recommendation

Make the post-accept "add in your own words" step a *one-tap save-as-is* with an optional rename, not a form. The save itself is the attachment event; the rename is the authorship layer for users who have the words. This single change serves monotropic authoring, PDA non-demand framing, alexithymic limits, and burnout decision-surface — without forcing any of them through the same flow.

### 5. Bias to watch

The lens is constructed from a verbal, articulate, theory-fluent ND population — the kind that reads about monotropism and recognises themselves. It will systematically under-weight ND users who are not introspective in this register, for whom *none* of these subgroup distinctions feel like self-descriptions, and who may simply want a button that gives them something to do without any of this being meaningful to them. Designing too hard for the four archetypes risks building an app that only the panel-shaped ND user finds resonant.

---

## Expert lens — Psychologist (average/below-average cognitive profile)

### 1. Concept-level read

A single activity card with accept/skip is, on its face, a near-ideal interaction for this archetype. Reading load is one short Dutch phrase; the cognitive load is binary — yes-now / not-now — which sits well below the working-memory ceiling that derails grid-based or list-based picker UIs. The single-suggestion-at-a-time pattern removes the choice paralysis that compounds in users with weaker self-monitoring. The starter library of ~30 activities, however, is adequate only for the first few weeks. Once a user has seen each item three or four times and skipped the ones that don't fit them, the app silently converges to a tiny effective set, and the user — not the library — gets blamed in the user's own head.

### 2. The four add-options

**Self-add CRUD.** This is the gifted-author default and the worst fit. It demands the user answer "what helps you relax?" — the exact question this population reliably cannot answer. Visible empty-state UI ("Voeg je eigen activiteit toe") functions as a low-grade humiliation when nothing comes to mind. Authoring ceiling: hard wall.

**AI-generated from self-description.** Better in principle — the AI does the authoring — but the input gate ("I'm autistic", "I'm gifted", "stay inside") is still self-description, which is a metacognitive ask. The form-based onboarding (setting/social/interests, tappable) already in place is the right shape; freeform text fields would re-erect the wall. As implemented (tappable, picture/example-anchored), this is the strongest library-growth lever for this archetype, because typing is optional.

**Swipe-up "more like this" / "never again".** This is the only option in the list that grows the library through pure behaviour, with zero authoring. "More like this" is a one-gesture signal the AI can act on. For the archetype, this is the highest-accessibility mechanism reviewed — it asks nothing the user cannot give.

**"Add in your own words" after accepting.** Presented as optional, low-stakes — but still typing, still authoring, still framed as the "personalisation" path. The risk is that better-resourced users build rich personal libraries while this archetype does not, and the gap is invisible to the designer.

**Ranking (most to least accessible):** Swipe-up > AI-generated (tappable form) > "Add in your own words" > Self-add CRUD. Library growth without typing: swipe-up and AI-generated. Those two carry the population.

### 3. Long-term trajectory (3 / 6 months)

At 3 months, a user who never authored and never re-onboarded has seen the same shrinking pool repeatedly. Suggestions feel stale; acceptance rates drop; the user concludes the app "stopped working." At 6 months, churn is near-total for this segment unless the library has grown without their input. The fix is structural: the app must generate new activities *for* this user on a cadence (e.g., a quiet background top-up triggered by skip-streaks or low novelty), not wait for them to ask. Re-onboarding prompts ("zullen we wat nieuwe ideeën maken?") at month 2 and 4, tappable not typed, would extend the runway materially.

### 4. Concrete design recommendation

After every accept, surface a single tap-target: **"meer zoals dit"** (and a discreet **"nooit meer"**). No text input, no rating scale, no category picker. Feed those signals to a periodic background AI generation pass that quietly extends the personal library. This converts ordinary use into library growth and removes authoring from the critical path entirely.

### 5. Bias to watch

The lens risks treating this archetype as incapable of any authorship. Some users in this band *can* and *want to* type — particularly when the prompt is concrete ("which word fits this activity for you?") rather than open ("describe what relaxes you"). The danger is removing the typing path entirely in the name of accessibility and patronising users who would have used it. Keep the optional in-own-words field; do not make it the spine.

---

## Panel of users

### Sanne — *autistisch, sensorisch gevoelig, shutdown*

**Eerst even over het basisidee.** Eén suggestie per keer — ja. Dat is precies wat ik nodig heb als ik 's avonds op de bank lig en niks meer kan. Een lijst van 30 dingen om uit te kiezen zou me direct doen afhaken, dus dat het er één tegelijk is, dat klopt. Wat me wel zorgen baart: een gedeelde bibliotheek van 30 activiteiten klinkt klein. Als de eerste vijf "ga wandelen" en "bel een vriend" zijn, ben ik weg. Voor mij in shutdown is "ga wandelen" niet alleen onbruikbaar, het voelt als een verwijt.

**De vier toevoeg-opties.**

1. *Zelf toevoegen (CRUD).* In theorie zou ik dit gebruiken — overdag, op een rustig moment, als ik denk "oh ja, dat hielp laatst." Niet 's avonds. Het blok is typen op kleine velden, formulieren invullen. Wat zou helpen: één veld, geen titel/beschrijving/tags-onzin. Gewoon één regel tekst en klaar. En geen verplichte categorieën.

2. *AI-gegenereerd op basis van wie je bent.* Hier word ik nieuwsgierig én voorzichtig. "Vertel iets over jezelf" — als dat een gesprek wordt waarbij ik moet typen ben ik weg. Als het een formulier is met aanvinkbare opties (autistisch / binnen blijven / weinig energie / sensorisch overprikkeld), dan wel. Dan zou ik het 's avonds zelfs kunnen doen, mits het echt 4–5 tikken is. Wat me écht zou overtuigen: dat de AI begrijpt dat "doe yoga" en "bel iemand" geen relax-activiteiten zijn voor mij. Skip-geschiedenis meenemen is slim.

3. *Swipe-up op een suggestie.* "Stel deze nooit meer voor" — ja, alstublieft. Dat is een kleine handeling met grote opluchting. "Geef me meer hiervan" zou ik gebruiken als ik een goeie te pakken heb. Het blok: swipe-up is een gebaar dat ik moet onthouden. Maak het ontdekbaar zonder een tutorial of pop-up. En geen animatie die m'n oog trekt als de kaart omhoogkomt.

4. *In je eigen woorden herschrijven.* Dit vind ik het mooist van de vier. "Doe een ademhalingsoefening" betekent niks voor mij. "Drie keer langzaam door je neus inademen terwijl je naar het plafond kijkt" is iets dat ik kan doen. Mits — en dit is groot — het pas verschijnt nadat ik accepteer, niet ervoor. En als het ook overslaan-baar is. Ik wil niet bij elke acceptatie een tweede beslissing.

**Lange termijn.** Drie maanden: misschien, als de bibliotheek groeit met míjn activiteiten en de generieke suggesties verdwijnen. Zes maanden: alleen als de app stil blijft. Geen notificaties. Geen "we missen je"-mails. Geen nieuwe features die ik moet leren. Wat me eruit zou drukken: één update met een onboarding-tour, één animatie te veel, één felle accentkleur die ik niet kan uitzetten. Wat me erin zou houden: dat de app aanvoelt als iets dat *minder* van me vraagt naarmate ik 'm langer gebruik, niet meer.

**Eén ding niet veranderen.** De dark mode als standaard. En dan bedoel ik echt donker — niet die "dark mode" die eigenlijk donkergrijs met witte tekst is. Als ik de app open op m'n laagste helderheid en ik krijg een flits wit te zien, ben ik direct weg. Houd het donker, houd het stil, houd het traag.

### Daan — *ADHD, snel, decision-paralyse*

Oké, even kort dan want ik heb echt geen zin in een lang verhaal.

**De basis.** Eerlijk? Eén random suggestie tegelijk is best chill. Geen menu met 50 dingen waar ik in vastloop. Tap, krijg ding, skip of doe. Als skip ook gewoon één tap is en binnen een halve seconde het volgende laadt, blijf ik er wel in zitten. Mijn zorg: bij ronde 4–5 zie ik al iets dat ik eerder zag en dan ben ik weg. Random zonder geheugen gaat me irriteren.

**De vier add-opties.**

1. *Zelf typen.* Ga ik niet doen. Als ik op mijn telefoon zit te ijsberen om 23:47 ga ik geen activiteiten in een formulier intikken. Misschien één keer als ik chill ben en even speel met de app, maar daarna nooit meer. Drempel is gewoon te hoog voor mijn avond-brein.

2. *AI op basis van wie ik ben + skip-history.* Dit is de enige die ik echt zou gebruiken. Maar dan moet het écht uit mijn skips komen, niet alleen uit wat ik intik. Want intikken doe ik niet — ik tap door tot de eerste vraag waar ik geen zin in heb en dan stop ik. Maximaal 3 tappable vragen, geen tekstvelden, en het resultaat moet *meteen* in de rotatie verschijnen, niet in een aparte "review je activiteiten" lijst die ik moet bevestigen. Als ik 5 activiteiten moet zitten editen voor ze tellen ben ik weg.

3. *Swipe-up "meer zoals dit" / "nooit meer".* Ja. Honderd procent ja. Dit is precies de interactie die past — ik hoef niks te lezen of typen, alleen reageren op wat er staat. "Nooit meer" is bijna belangrijker dan "meer zoals dit" eerlijk gezegd, want één suggestie die ik blijf zien en steeds skip gaat me agressief maken. Voorwaarde: het moet één gesture zijn, geen modal die popt met "weet je het zeker?". Gewoon doen.

4. *Achteraf herformuleren.* Nee. Als ik net iets gedaan heb dat werkte, wil ik de app dichtdoen en níet nog een schermpje met een tekstveld. Dit voelt als de app die nog iets van me wil terwijl ik klaar ben. Skip.

**3 / 6 maanden.** 3 maanden: alleen als suggestie 3 nu werkt en als de variatie groeit. Anders maand 1. 6 maanden: nul kans bij de huidige opzet. Wat moet veranderen: counterbalance-modus (Head/Hands/Heart) — dat is denk ik wat ik écht nodig heb want ik zit altijd in m'n hoofd. En een soort "ik heb 10 minuten" vs "ik heb 2 uur" filter, want sommige suggesties zijn nu te groot voor het moment. En écht voorkomen dat dezelfde dingen terugkomen.

**Eén ding niet veranderen.** Het simpele "één ding op het scherm" idee. Geen lijst, geen categorieën, geen filter-UI die ik eerst moet instellen. Op het moment dat dit een keuzemenu wordt ben ik weg — keuzes maken is precies wat ik om 23:47 níet kan. Eén ding, accepteer of skip, klaar.

Wat me zou laten bouncen: trage laadtijden tussen skips, herhaling binnen een week, en élke vorm van "vul eerst dit in voor je begint".

### Fatima — *uitputting, kleine flat, partner + kinderen op de bank*

**First reaction to the basic concept.** Eerlijk? Eén suggestie tegelijk is precies wat ik nodig heb. Als ik om 9 uur op de bank zit met de TV op de achtergrond en mijn partner naast me, kan ik geen lijstje aan. Een lijst is gewoon nog een ding waar ik uit moet kiezen, en daar heb ik dan al de hele dag mee gedaan. Maar — en dit is groot — als de suggestie niet past bij mijn situatie (een uur wandelen, mediteren in een rustige ruimte), dan ben ik binnen drie keer skippen weg. Skip wordt dan nog een micro-beslissing die geld kost.

**The four add-options.**

1. **Zelf toevoegen (CRUD).** Nee. Op het moment dat ik de app open zou ik dit nooit doen — typen voelt al zwaar als ik een appje aan mijn man stuur. Misschien op een goede zaterdagochtend, in theorie. In de praktijk: nooit. Wat zou helpen: als mijn partner ze voor mij kon toevoegen, of als ik ze kon inspreken.

2. **AI-gegenereerd op basis van info over mij.** Dit is degene die ik *zou* willen gebruiken, maar ik ben bang ervoor. "Vertel iets over jezelf" — wat moet ik zeggen? "Ik ben autistisch en heb ADHD en ben burn-out en heb twee kleine kinderen en een kleine flat en mijn man kijkt altijd TV." Dat is te veel om uit te typen. Als het tikbare opties waren ("binnen blijven", "stil", "max 10 min", "geen spullen halen") — ja, dan wel. Eén keer, snel, klaar. Vertrouwen in AI: gemiddeld. Ik wil niet dat het te slim doet alsof het mij kent.

3. **Swipe-up "meer zoals dit" / "nooit meer".** Ja. Dit is goed. Geen typen, geen denken, gewoon één gebaar. "Nooit meer mediteren" — heerlijk. Dat ik dat één keer kan zeggen en het is weg, dat voelt als gehoord worden. Dit zou ik echt gebruiken.

4. **"Voeg in eigen woorden toe" na accepteren.** Nee. Op het moment dat ik iets accepteer is mijn energie al op — ik wil de activiteit gaan doen, niet erover schrijven. Misschien als knop "deze was fijn" / "deze was niet fijn" zonder tekst. Maar typen na een accept? Dat voelt als huiswerk.

**Long-term — 3 / 6 months.** 3 maanden: alleen als de suggesties echt aansluiten. Na een week of twee zelfde dingen — wandelen, mediteren, bad nemen — ben ik weg. Ik heb geen bad. Ik kan niet wandelen om 9 uur 's avonds met twee slapende kinderen. Als de app dat na een paar skips niet doorheeft, ben ik klaar. 6 maanden: alleen als de AI-optie er is *en* werkt zonder dat ik veel hoef te typen, *en* als swipe-up bestaat. Dan voelt het alsof de app met mij meegroeit. Anders is het nog een leuk idee dat ik twee weken probeerde. Wat zou moeten veranderen: meer suggesties die echt klein zijn (3 minuten, op de bank, met TV aan, partner ernaast). Suggesties die zeggen "het is oké als je niets doet" — soms is mijn beste activiteit nul activiteit, en ik wil dat de app dat snapt.

**One thing to keep.** De eenvoud. Eén suggestie. Eén tap. Niet meer. De dag dat er een dashboard of streak-teller of "jouw rustprofiel"-pagina bijkomt, ben ik weg.

### Jeroen — *autistisch, alexithymisch, patroon-gericht*

**Het basisconcept.** Eén suggestie, accepteren of overslaan — dat past bij mij. Geen vraag vooraf hoe ik me voel, geen schuifbalk van 1 tot 5 waar ik toch maar 3 zou kiezen. Dat is precies goed. Maar hier zit ook meteen mijn probleem: ik weet vaak niet of een suggestie *goed voor mij* is. Als er "ga even wandelen" staat, denk ik niet "ja dat heb ik nodig" of "nee dat past niet" — ik denk "ok" of "te veel moeite nu". Dat is geen oordeel over wat ik nodig heb, dat is een inschatting van energie. Of ik écht had moeten wandelen weet ik pas anderhalf uur later, als ik me beter voel. Of niet. Dus accept/skip is voor mij eigenlijk geen signaal van geschiktheid — het is een signaal van haalbaarheid op dat moment. Ik hoop dat de app dat onderscheid op de een of andere manier kan maken, want anders leert hij de verkeerde dingen.

**De vier opties.**

*Self-add CRUD.* Hier loop ik vast. Niet technisch — ik ben developer, een formulier vul ik blind in — maar inhoudelijk. Als ik moet bedenken "welke activiteiten zijn rustgevend voor mij?", dan kom ik met de voor de hand liggende dingen (LEGO, lezen, wandelen) en mis ik waarschijnlijk de helft van wat eigenlijk werkt. Mijn partner zou dit beter kunnen invullen dan ik. Wat zou helpen: een knop "voeg toe wat ik net deed" als ik buiten de app iets goeds heb gedaan. Dat is observatie, geen introspectie.

*AI-gegenereerd op basis van accept/skip.* Dit is wat ik wil. Gedragsdata in plaats van zelfrapportage. Maar zie hierboven: mijn skips zijn vaak "te veel moeite", niet "verkeerde suggestie". Als de AI dat onderscheid niet leert, gaat hij me steeds laagdrempeligere dingen voorstellen tot ik alleen nog "ademhaling" krijg. Wat helpt: een knop achteraf "dit hielp echt" versus "ik deed het maar het hielp niet". Dat is nog steeds observatie (achteraf, met meer afstand), niet emotioneel inschatten op het moment zelf.

*Swipe-up "meer zoals dit" / "nooit meer".* Ja, prima. "Nooit meer" zou ik gebruiken voor alles met "voel even in je lichaam wat je nodig hebt"-energie. "Meer zoals dit" is lastiger — ik weet niet altijd *waarom* iets paste. Was het de duur? De fysieke vs cognitieve aard? Geen idee. Maar de knop indrukken kan ik wel, het classificeren mag de AI doen.

*"Voeg toe in je eigen woorden" na accepteren.* Dit is mijn moeilijkste. Beschrijven wat ik net deed gaat wel — "20 minuten LEGO Technic gebouwd" — maar als er verwacht wordt dat ik beschrijf *waarom het hielp* of *hoe ik me voelde*, dan blokkeer ik. Houd het bij feitelijk: wat, hoe lang. Geen "hoe was het?" Geen emoji-stemming.

**Lange termijn.** 3 maanden haal ik als ik het in een routine zet — bijvoorbeeld om 20:00 elke avond. 6 maanden alleen als de app daadwerkelijk leert en niet steeds dezelfde 30 suggesties roteert. Wat moet veranderen: een manier om "haalbaarheid nu" te onderscheiden van "geschiktheid in principe". Anders convergeert het naar het kleinste gemene veelvoud van mijn vermoeidheid.

**Eén ding om te behouden.** Dat de app niet vraagt hoe ik me voel voordat hij iets voorstelt. Dat is zeldzaam en kostbaar. Elke andere app die ik probeer begint met een mood-tracker en daar haak ik direct af.

### Yuna — *ADHD, designer, taalgevoelig, kleine studio*

**Eerste reactie op het basisconcept.** Eén willekeurige suggestie en klaar — dat vind ik eigenlijk wel rustgevend. Geen menu, geen tien tabbladen, geen keuzes maken terwijl mijn hoofd al vol zit. "Suggereer" leest prima, dat is gewoon spreektaal. Wat me wél zou afhaken: als die ~30 activiteiten dingen bevatten als "ga een stuk wandelen in het park" of "doe yoga in je woonkamer" — mijn woonkamer is ook mijn bed en mijn werkplek, en om 23:00 ga ik niet alleen het Vondelpark in. Als de eerste drie suggesties niet in mijn studio passen, ben ik weg. En één ding: woorden als "activiteitensuggestie" of "stressniveau" zou ik direct herkennen als formulier-Nederlands. Hou het alsjeblieft op "zin om iets te doen?" of zo.

**De vier manieren om activiteiten toe te voegen.**

1. **Zelf toevoegen (CRUD).** Eerlijk? Nee. Als ik de energie had om een lijstje met leuke dingen te maken, had ik die dingen al gedaan. Dit voelt als huiswerk. Misschien op een goede zondag, maar niet als ik de app het hardst nodig heb. Tenzij het echt twee tikken is — naam, opslaan, klaar. Geen categorieën, geen tags, geen duur in minuten invullen.

2. **AI-gegenereerd op basis van wie je bent + accept/skip-geschiedenis.** Hier word ik wakker. Dit is wat ik wil. Mits — en dit is groot — de AI niet in stijf Nederlands praat. Geen "U zou kunnen overwegen om..." Ik wil "zin om wat te schetsen met die fineliners die je laatst kocht?" Als de AI weet dat ik in een studio woon, geen "ruim je woonkamer op" voorstelt, en doorheeft dat ik 's avonds creatieve dingen wil doen i.p.v. sporten — dan blijf ik.

3. **Swipe-up "meer zoals dit" / "nooit meer".** Ja, dit voelt natuurlijk. Lage drempel, geen typen. "Nooit meer" is belangrijker dan "meer zoals dit" voor mij — ik wil dingen kunnen wegduwen die structureel niet werken (alles met "ga naar buiten" na 22:00, alles met groepsmensen, alles met "ruim op"). Eén ding: maak duidelijk wat swipe-up doet vóór ik het per ongeluk doe. Niet onomkeerbaar zonder undo.

4. **"In je eigen woorden" toevoegen na accepteren.** Mooi idee in theorie. In de praktijk: net iets gedaan, voelt goed, nu nóg iets doen (typen wat het was)? Daar haak ik af. Tenzij het optioneel is en heel kort — één regeltje, skipbaar. Als het verplicht is, accepteer ik straks niks meer omdat ik geen zin heb in het "na-werkje".

**Lange termijn — 3 of 6 maanden?** Eerlijk: met alleen Mode 1 en 30 activiteiten — drie weken, niet drie maanden. Ik ga de suggesties uit mijn hoofd kennen. Wat ik nodig heb om bij 6 maanden uit te komen: de AI-generatie (optie 2) plus "nooit meer"-swipe (optie 3). Die twee samen zorgen dat de lijst meegroeit met wie ik die maand ben. Plus — en dit staat los — de playful-theme moet er zijn vanaf moment één, anders haal ik dag 2 niet eens.

**Eén ding om te behouden.** De eenvoud van één knop, één suggestie. Niet uitbouwen tot een dashboard. Het feit dat ik niet hoef te kiezen is precies waarom dit werkt — voeg dingen toe ónder die laag, niet erboven.

### Lisa — *NT, mainstream, positioning-gevoelig*

**First reaction.** Okay so my friend Sanne told me about this — she has ADHD and swears it helps her on Sunday nights. I open it on a Sunday evening, restless after a long week. A single suggestion, accept or skip? Honestly my first thought is: *that's it?* It feels almost too minimal — I can't tell if that's intentional design confidence or just unfinished. Dark mode is nice, the Dutch is fine, but compared to Headspace or Calm it looks bare. If somewhere on the landing or onboarding it says "voor neurodivergente breinen" front-and-center, I'd close it. Sanne can have it. Right now the positioning question is the whole game for me — make me feel like an overscheduled adult who forgot how to rest, not like I'm borrowing her app.

**The four add-options.**

1. **Self-add CRUD.** Marketing-brain says yes, real-Lisa-on-Sunday says no. The whole reason I opened this is because I *can't* think of what to do. If you make me sit down and curate a list of relaxation activities, I will optimize that into another to-do and never open it again. Also feels unpolished — every app has CRUD, that's not a feature, that's a database screen.

2. **AI-generated based on me + accept/skip history.** This is the one I'd actually want. *If* the input form is short, tasteful, and doesn't ask me about my diagnosis or executive function. Ask me about my evenings, my energy, what I miss doing. The accept/skip learning is the part that would keep me coming back — it makes the app feel like it's paying attention. This needs to feel premium though. If the AI step looks like a ChatGPT wrapper with a textarea, I'm out.

3. **Swipe-up "more like this" / "never again".** Yes, intuitively. It's the Tinder/TikTok gesture, everyone knows it, low cognitive cost. This is the most mainstream-feeling option of the four — it doesn't ask me to *think*, just react. Just please don't over-explain it. No tooltip. Let me discover it.

4. **"Add in your own words" after accepting.** Charming idea, won't use it. Once I've accepted "ga even op de bank liggen" I'm going to the bank, not back to the app to journal about it. Maybe occasionally if it's a really good one. Feels like a feature for the ND-power-user, not me.

**Long-term verdict — 3 / 6 months.** 3 months? No. With ~30 generic activities and a random roll, I'd churn in two weeks. "Lees een boek" — I don't need an app to tell me that. To get me to 6 months you'd need: (a) the AI personalization actually learning, so suggestions feel uncannily right by week three, (b) some variety in *type* of suggestion — micro-permissions ("doe even niks, 4 minuten"), not just activities, (c) the option to mark a time of day so Sunday-evening-Lisa gets different suggestions than Wednesday-lunch-Lisa, and (d) a clear "this isn't a wellness app, it's a permission slip" tone in the copy. The counterbalance idea (Mode 3) — the friend mentioned that — *that* I'd stay for. Lead with that, not with random.

**One thing to keep.** The restraint. One suggestion, accept or skip — no streaks, no points, no "you've meditated 3 days in a row!" That part is genuinely refreshing and the opposite of every wellness app I've quit. Don't lose it when you scale up.

### Tom — *burn-out, depressie, ND-adjacent*

**First reaction to the basic concept.** Eén suggestie tegelijk — dat is eigenlijk precies wat ik aankan. Geen lijst, geen keuzes, gewoon: dit. Op een slechte middag, als ik op de bank zit en niet weet wat ik met mezelf aan moet, is "kies uit zes dingen" al te veel. Mijn enige zorg: als het ding dat ie voorstelt te groot voelt ("ga koken", "begin een creatief project"), dan druk ik skip, en bij de derde skip leg ik mijn telefoon weg en doe ik alsnog niks. Dus alles staat of valt bij hoe klein de suggesties zijn.

**De vier toevoeg-opties.**

1. **Zelf toevoegen (CRUD).** Nee. Ik zou dit niet gebruiken. Typen op zo'n moment is precies het soort actief-bedenken dat ik niet kan. Als ik wist welke activiteiten me goed zouden doen, had ik de app niet nodig. Misschien op een goede dag, theoretisch, maar in de praktijk ga ik niet "mijn lijstje beheren". Dat klinkt al als werk.

2. **AI-gegenereerd op basis van wat je over jezelf vertelt.** Hier zit potentie, maar ook risico. Als ik moet typen wat ik leuk vind — ik weet het niet meer. Dat is letterlijk waarom ik hier ben. Een formulier met aanvinkvakjes ("rustig / actief", "binnen / buiten", "alleen / met anderen") zou ik wel kunnen. Maar als de AI dan een opgewekt lijstje terugkroost ("Wat tof dat je van wandelen houdt!") haak ik af. Neutrale toon, korte suggesties. Mijn accept/skip-historie laten meewegen lijkt me slim — dat kost mij geen energie en de app leert ondertussen.

3. **Swipe-up "meer hiervan" / "nooit meer".** Dit zou ik wel kunnen. Het is één gebaar bovenop iets wat ik toch al doe. Geen typen, geen denken, gewoon een reflexreactie. "Nooit meer" vooral — als iets drie keer voorbijkomt dat ik niet aankan, wil ik dat weg kunnen vegen zonder uitleg. "Meer hiervan" is moeilijker, want op een slechte dag voelt zelfs iets wat me goed zou doen niet leuk. Misschien gevaarlijk dat ik op een bodemdag alles wegswipe?

4. **"In eigen woorden toevoegen" na accepteren.** Slim moment — ná de activiteit heb ik vaak iets meer ruimte dan ervoor. Maar typen blijft typen. Als het optioneel is en wegklikbaar, prima. Verplicht: nee, dan zou ik skip gaan drukken om de prompt te vermijden. Dropdown of "wil je dit vaker?" ja/nee-knop zou ik wel doen.

**Lange termijn — 3 / 6 maanden.** Eerlijk: 3 maanden alleen als de suggesties klein genoeg blijven en de app niet aanneemt dat ik gestrest ben. Mijn probleem is leegte, geen overprikkeling. Als ik "ademhalingsoefening" of "doe minder" als suggesties krijg, ben ik na een week weg. 6 maanden zou ik halen als de app zou leren dat ik activerende kleine dingen nodig heb — "loop tien minuten naar de hoek en terug", "zet één liedje op en luister echt" — niet ontspannende. Het woord "ontspannen" in de interface is voor mij gewoon mis. Verander dat in "iets doen" of "een klein dingetje" en het past beter. Tweede ding dat ik nodig zou hebben: geen streaks, geen badges, geen "je hebt 5 dagen op rij!". Op de dag dat ik het breek, verwijder ik de app.

**Eén ding om te behouden.** De eenvoud van mode 1. Eén ding, accepteren of overslaan. Niet aan komen.

---

## Cross-cutting items worth tracking forward

1. **The "fit vs. feasibility" distinction in accept/skip data** — surfaced by Jeroen and the ND lens, reinforces the same concern raised in 005's pruning section. If Options 2 and 3 both use skip data as fit-signal, the AI converges on the smallest-effort subset for everyone. **An after-the-fact "this actually helped" signal is the missing primary input.**
2. **"Add in your own words" succeeds or fails on a single UX decision** — form vs. one-tap save-as-is with optional rename. The experts unanimously want the latter; every persona who rejected the feature assumed the former.
3. **AI tone register** — calibrated uncertainty (*"dit is een gok"*) is more honest *and* dissolves the PDA-demand quality. No upbeat copy, no "we", no therapy voice. Echoes 005's finding.
4. **Provenance visibility on cards** — *yours / yours-rephrased / library / AI-suggested*. The success state of the design is the user's own items becoming the foreground; that needs to be visible to the user, not just to the back-end.
5. **Library top-up cadence** — a background generation pass triggered by skip-streaks or low novelty, plus tappable re-onboarding prompts at month 2 and 4. Library growth without input keeps the avg-cognitive / depleted user in the app.
6. **Lisa-positioning** — still unresolved. "Permission slip for overscheduled adults" is a copy direction worth testing, but the visible ND framing question carries forward into a future review.
