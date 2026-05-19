# Review 005 — Mode 3 as AI assistant (prune + interview-led generation)

**Date:** 2026-05-19
**Scope:** Stress-test Noor's draft direction in response to review 004 — a rebuilt Mode 3 in which the AI acts as a *gardener* (pruning based on accept/skip data) and as an *interview-led generator* (one activity at a time, sourced from short reflective questions inspired by the KernTalenten methodology).
**Reviewed by:** Three expert lenses (giftedness, neurodivergence, average/below-average cognitive profile) and three personas (Jeroen, Yuna, Sanne).

---

## The proposal under review

Noor's draft direction:

- New users start with the ~30 base activities. (Unchanged.)
- **Mode 1** remains the primary mode — random suggestion from the user's pool, one at a time.
- **Mode 2** (stress-level filter) is **deleted**.
- **Mode 3** is **rebuilt as an AI assistant** with two functions:
  - **Pruning** — proposes items to remove or hide based on the user's accept/skip history, optionally augmented by an explicit "this worked really well" rating.
  - **Generation** — proposes *one* activity at a time, after a small interview. Example questions:
    - *"Noem drie dingen die je als kind graag deed"* (inspired by **KernTalenten**, the Dutch talent-identification framework developed in giftedness practice)
    - *"Noem drie dingen van afgelopen week die niet als werk voelden"*

    The AI uses these answers plus the user's existing activity list, accept/skip data, and prior question history to propose one activity. The user accepts or rejects each into their list.
- Mode 4's fate is unspecified — the proposal may or may not subsume it.

The intent is to operationalise the 004 panel's "AI-as-gardener" direction while keeping Mode 1 as the depleted-user spine.

---

## Headline

**The direction is right; the specific instantiation is half-finished and over-indexed on Noor's own (gifted) profile.**

Six panel voices converge on a single verdict: dropping the bulk batch and repositioning AI as gardener-plus-author is correct, *but the proposal does not actually solve the authorship-collapse problem that 004 named* — it stages it more politely. The user still ends up with AI-authored items entering their list; the interview is consent to ghostwriting, not authorship in the SDT or provenance sense.

Three specific failures emerge from every lens:

1. **The childhood interview question is gifted-coded and gets refused by every audience that is not Noor's.** Avg/below-IQ, ND, and the autistic-shutdown persona all reject it on different grounds (abstract autobiographical recall, alexithymia, fractured childhood/masked play). Yuna accepts it; nobody else does. This is the second time a 005-style proposal has been built on Noor's own preferred mode of thinking — see 004 tension #1.

2. **Pruning on accept/skip is pruning on the wrong signal.** Universal: accept/skip is *behavioural state at the moment of suggestion*, not *preferential fit*. A skip at 22:00 on a depleted Tuesday is not preference data. Auto-pruning on it will silently remove activities the user would use on a good day. The "this worked really well" explicit signal must be the *primary* input, not augmentation.

3. **The infrastructure that 004 actually asked for is missing.** Jeroen's lens lands the sharpest blow: Mode 1 is still uniform random over the pool. The AI features being layered on top are *cosmetic over missing pipes*. The weighted-pool scoring (per-activity score from accept/skip + recency + time-of-day context) is what would deliver the data-using behaviour 004 demanded, and it can ship without an LLM in the stack at all.

The constructive direction the panel converges on: **build the weighted pool first; rewrite the interview as recent and behavioural, not childhood and reflective; split prune from generate into different surfaces with different cadences; offer multiple library-growth paths (not just the interview).**

---

## What the panel agrees on

### 1. The proposal moves authorship from minute one to minute six of every Mode 3 session — same wound, slower bleed.

The giftedness lens names this most directly: "Three interview answers + accept tap is *not* authorship. It is *consent to ghostwriting*. The activity Claude proposes will still read in Claude's voice, still lack ribbels, and the criticality engine will still spin up." The ND lens, the avg/IQ lens, Jeroen, Yuna, and Sanne all reach the same destination by different routes — the *output* of the interview must be the activity itself, in the user's own words, with the AI only paraphrasing duration and present-tense form. Anything else recreates the 004 problem.

### 2. Pruning on accept/skip without context is dangerous.

Every lens flags this. The specific concerns:

- **State variance** (giftedness, ND, Jeroen): a skip is a snapshot of state, not a verdict on the activity. Sanne's case: she skips "bel een vriend" 14 nights in a row because she is in shutdown, not because it's wrong for her. Pruning that out removes one of the few items that would serve her on a good day.
- **PDA framing** (ND): a PDA-coded user skips good activities precisely because they were suggested. Their skip-rate is inversely correlated with fit.
- **Attention/literacy fluctuation** (avg/IQ): for users with weaker working memory, skip patterns reflect cognitive fluctuation, not preference. AI pruning on this data reads noise as signal and erases usable items.
- **Authored items** (Yuna): user-added activities must be off-limits to AI pruning, period. The list is not the AI's to edit.

The convergent fix: prune is a *user-driven action* with AI as *evidence presenter*. Show the data ("je sloeg deze 6× over de afgelopen maand, allemaal na 21:00"), let the user decide. Never auto-hide. Default action is "verbergen" with one-tap undo, not delete. Use the explicit "this worked really well" rating as the *primary* prune-direction signal, not the secondary one.

### 3. The childhood interview question is the wrong default question for this audience.

Five of six voices (every voice except Yuna) reject *"Noem drie dingen die je als kind graag deed"* — for distinct reasons that compound:

- **Gifted lens**: KernTalenten is a *therapist-mediated synthesis across weeks of data*. Compressing it into "name three, AI proposes one" turns a depth instrument into an icebreaker, and the gifted user will evaluate the output against the standard the framing invokes — a comparison the AI will lose every time.
- **Avg/IQ lens**: abstract autobiographical recall across a decade-plus span, requiring verbal fluency to produce three items. Audience cannot do this; honest answer is "I don't know" and it is not enough fuel for the AI to generate from.
- **ND lens**: assumes autobiographical coherence (alexithymia breaks this), assumes a non-fractured childhood (a non-trivial slice of ND adults had play-suppressing childhoods, often the very reason they cannot switch off as adults).
- **Sanne**: "een gemaskeerde jeugd. Wat ik leuk *deed* en leuk *vond* zijn niet hetzelfde. Dat is therapeutische archeologie op zondagochtend in een app. Te intiem voor het medium."
- **Jeroen**: "Geen warme bibliotheek van gevoelens-bij-herinneringen om uit te putten."

The convergent direction: ask about **observable recent behaviour**, not introspected childhood. Shift from *recall* to *observation*, from *feeling* to *behaviour*, from *childhood* to *this week*. Allow "weet ik niet" as a valid response that proceeds the flow.

Strong candidates surfaced by the panel:

- ND: *"Was er deze week één moment dat lichter voelde dan de rest? Wat was je toen aan het doen?"* — one item, recent, alexithymia-tolerant (asks about a *moment*, not a *feeling*)
- Jeroen: *"Welke drie dingen heb je afgelopen maand het vaakst gedaan op een vrije avond?"* — feitelijk, telbaar; or *"welke YouTube-kanalen kijk je zonder dat het werk voelt?"*; or *"wat staat er op je bureau dat geen werk is?"*
- Yuna: *"Wanneer was de laatste keer dat je je verveeld voelde — wat deed je toen?"*; or, more radical: *"Welk geluid mis je?"*

Verveling-as-source, behaviour-as-source, and absence-as-source all work where childhood-recall doesn't.

### 4. The one-at-a-time drip is right for some, wrong for others, and needs a fast path.

The panel splits sharply by subgroup:

- Autistic-dominant (Sanne): one is enough, one is right. Don't ship the option for more.
- Gifted-pattern (Jeroen): *"één voorstel is een kale datapunt zonder context"* — wants five at once to see the pattern (or the mismatch).
- ADHD-dominant (ND lens): a slow drip will lose them at the second question. Needs *"skip questions, just give me something"* fast-path and *"give me five now"* on dopamine-hunting evenings.
- Avg/IQ: gating library growth on interview success means library never grows for users who cannot interview well. Needs a *"genereer me nu 5 ideeën"* peer-button, not a hidden alternative.
- Yuna: drip is fine *if user controls tempo* — wants one per session, but decides whether there is a next one. No forced drip cadence.

The convergent fix: **multiple library-growth paths, not one**. The interview is one path. The "five now" button is another. The picture-domain selection (avg/IQ) is a third. The "more like this" after an accepted activity (universally endorsed) is the fourth. The after-activity authorship save (Sanne's 004 ask, still missing) is the fifth.

### 5. Mode 2 deletion is endorsed, but a thin replacement is needed.

Universal agreement that the 1–5 stress slider was abstract self-report that produced noise for alexithymic users. Fine to delete. *But* — the ND lens flags that for users who *can* tell they are crashing (Lisa, late-day Jeroen, NT users), losing it means losing the only fast filter to "klein, nu." The proposed replacement: a single behavioural toggle on the Mode 1 suggest screen — *"klein houden"* — surfaces only short, low-stimulation activities. One tap, behavioural anchor, no scale.

### 6. The framing "AI assistant" carries the wrong baggage.

Yuna's lens lands this one cleanly: *"Assistentie is voor mensen-met-problemen. Een vraag is voor iedereen."* The framing for this surface should be a *question*, not an *assistant*. A menu item like *"Stel me een vraag"* changes the relational frame from being-helped to a small exchange. The AI is still under the hood; the user-facing concept is not.

Sanne adds: tone should be *functional, not empathic*. Not "ik snap je nu beter" — that recreates the spiegel-die-teruglacht problem from 004. Instead: *"je zei X, hier is iets dat daarop lijkt."* Yuna goes further: *"Een AI die durft te zeggen 'dit is een gok' in plaats van 'hier is een suggestie speciaal voor jou'."* Calibrated uncertainty in the copy is more human than warm copy.

---

## Where the panel disagrees

### Tension 1 — Is this an improvement for the average/below-IQ user, or actively worse?

**The avg/IQ lens dissents materially again.** Its 005 verdict: *"This is worse than the current app for my population, and it is worse than my 004 prescription. The current app at least gave a BIF user fifteen plausible activities at signup — a genuine library to fall back on. The proposal trades that floor for a slow drip gated on interview competence the audience does not have."* From this lens, the panel has — for the second report running — produced gifted-coded recommendations and lost the dissent on the floor.

The other lenses do not dispute this *for that audience*. The disagreement is whether that audience is in scope.

**The unresolved decision from 004 is now load-bearing.** If Noor is building primarily for the gifted-ND quadrant, the proposal (with the panel's amendments) is approximately right. If she is building for a wider audience, she needs to actively counter-engineer for users who cannot interview, who cannot author, and who will silently churn with the story "I tried, it didn't work, I'm the problem."

The avg/IQ lens proposes a survivable hybrid: keep the interview path *and* add a *"Genereer me 5 ideeën nu"* button as an equal peer to the interview, plus picture-domain selection cards (tap-the-pictures-that-look-appealing, no recall), plus the universally-endorsed "more like this" after-accepted button. All four growth paths live side by side; the user picks whichever they can operate.

### Tension 2 — Does the interview enrich or expose?

The giftedness lens: invoking KernTalenten "inherits the standard it sets" and a one-shot question loop does not meet that standard. The interview will *primarily* train the user to evaluate Claude's translation of their inner life — the exact skill the user did not come to the app to develop.

The avg/IQ and ND lenses: the interview is too heavy a metacognitive ask for a large swathe of the intended audience.

Sanne's persona: emotionally too intimate for an app.

Yuna's persona: when the question lands ("welk geluid mis je?"), it lands harder than any wellness-app prompt ever has, and would be the single most valuable feature in the app.

So the interview is a high-variance feature. It is either the best thing in the product or actively counter-therapeutic. The variance is *user-specific* and the design needs to acknowledge that — i.e., the interview cannot be the only growth path, and the questions in it cannot be Noor's own preferred questions on the assumption that they generalise.

### Tension 3 — Where does pruning live?

Jeroen wants pruning as an architectural primitive — a per-activity score table, a debug view, no AI-mediated interpretation. *"Geef mij het dashboard, niet de samenvatting."*

Sanne wants pruning as a one-tap evening chore, distinct from the Sunday-morning generation ritual. *"Splits Mode 3 in tweeën."*

The giftedness lens wants prune *on the suggestion card itself* as a long-press, fed by the felt-signal rating, not a separate Mode 3 destination.

The ND lens wants prune to be user-confirmed per item with reason chips ("past niet bij mij" / "klopt voor nu, niet altijd" / "alleen op slechte dagen").

These are not in conflict — they specify different layers. The dashboard (Jeroen) is the *transparency surface*; the long-press (giftedness) is the *common-case action*; the reason chips (ND) are the *interaction detail*; the avond-klus framing (Sanne) is the *temporal positioning*.

### Tension 4 — How fast is the drip?

Already covered in §4. The relevant unresolved point: whether the *default* presented to a new user is one-per-session, five-per-session, or user-controlled-tempo from the start. The panel implicitly favours user-controlled tempo, with a sensible default of *one and a "nog één?" button*, no forced cadence.

---

## Expert lenses

## Expert lens — Giftedness psychologist

### Honest read on the proposal

This is a real improvement over the current shape, and it is *also* a smarter wrapper around the same disease. Killing the onboarding batch is the right move — that part of 004's verdict has held. Demoting Mode 2 is correct; stress 1–5 was a fiction for half the panel anyway. Repositioning AI as gardener-then-author is conceptually cleaner than the four-mode pile.

But the new Mode 3 generation path doesn't solve authorship collapse — it stages it more politely. The user still ends up with an AI-authored item entering their list. Three interview answers + accept tap is *not* authorship in the SDT or provenance sense. It's *consent to ghostwriting*. The activity Claude proposes will still read in Claude's voice, still lack ribbels, and the gifted criticality engine will still spin up on it. You've moved the unearned-input problem from minute one of onboarding to minute six of every Mode 3 session. Slower bleed, same wound.

The KernTalenten framing is **half load-bearing, half decorative**. Load-bearing because childhood-activity recall and peak-experience inventory are genuinely the right epistemic source for what restores a gifted adult — they bypass the criticality engine by sourcing from autobiographical memory rather than from external menus. Decorative because Krekels' method is a *therapist-mediated synthesis* across dozens of data points over weeks; compressing it into "name three things, AI proposes one" turns a depth instrument into an icebreaker. If you invoke KernTalenten you inherit the standard it sets, and a one-shot Q→A→suggestion loop does not meet that standard. Worse, it primes the gifted user to evaluate the AI's output against their own talent profile — a comparison the AI will lose every time.

### The two failure modes I'm most worried about

1. **The interview becomes a content-quality test the AI fails.** Gifted user types "tekenen, vioolspelen, hutten bouwen in het bos." AI returns "Bouw vanavond 20 minuten aan een kleine constructie van keukenspullen." The user reads it and thinks: *that is not what I said*. The criticality engine has just been handed a target. One miss is recoverable; the third miss in a row recodes the entire feature as "AI that translates me badly," which is psychologically worse than "AI that doesn't know me" because now it *does* know and still fails. Mode 4's empty text field killed nobody; this one will kill harder because it solicited intimacy first.

2. **Pruning on accept/skip is pruning on the wrong signal.** Accept/skip is *behavioural state at moment of suggestion*, not *preferential fit*. Sanne skips "bel een vriend" 14 times because she is in shutdown 14 evenings in a row — not because it isn't her. If the AI proposes hiding it, the app removes one of the few items that would actually serve her on a *good* day. For the gifted-autistic user with high state-variance, behavioural data without state context is actively misleading. Pruning needs the "this worked really well" explicit signal *as the primary input*, not as augmentation. Build prune on the felt signal alone, or don't ship it.

### What this trains over 100 sessions

Better than the current design, worse than it could be. The interview ritualises a small act of self-articulation — that's a real meta-skill being built. But the payoff (AI proposes, user accepts) lands on the consumption side of the gradient. Net trajectory: the user gets slightly better at *describing* what they like and no better at *generating* what they like. At session 100 the gifted user has a list that is 60% AI-paraphrased and a self-perception of "I told the app, it knew." That is not knowing-what-restores-you; that is outsourcing-with-extra-steps.

### Concrete amendments

- **Make the interview's output the activity, verbatim.** "Hutten bouwen in het bos" becomes the saved item, in the user's exact words, with the AI only proposing *a duration and a present-tense variant* ("20 minuten in het Amelisweerd, tak en touw") that the user edits or accepts. AI as paraphraser of the user's memory, not author of a new thing.
- **Split prune from generate.** Different mental models, different sessions. Prune lives on the suggestion card as a long-press, fed by the explicit "this really worked" rating. Generate lives in Mode 3 with the interview.
- **Cap interview frequency.** Once a fortnight, not on demand. Scarcity protects the ritual.

### The single risk to flag

If the AI's role in Mode 3 is to *propose the activity*, the gifted user will spend 100 sessions training the meta-skill of *evaluating Claude's translation of them*, which is the exact skill they did not come to this app to build.

---

## Expert lens — Neurodivergence psychologist

This is a better proposal than the one I reviewed in 004, but it is still not a finished design. Two of the four shifts are clearly correct; two of them carry risks Noor seems not to have fully metabolised yet.

**Subgroup-by-subgroup read.**

*Autistic-dominant.* The new Mode 3 is closer to right for this group than anything in the current app. Monotropic users plateau early on 3–5 anchor activities; AI generating *one at a time, on user request, after a small interview* lets the library extend a tunnel rather than break it. The risk is the interview itself: an autistic user who has had a bad week of masking will not have access to the "what felt like play this week" answer. They will stall, freeze, or write something performatively safe. The interview must tolerate "ik weet het niet" as a valid answer that proceeds the flow, not a dead-end. Mode 1 staying as default is the right call — autistic-dominant users will live there forever.

*ADHD-dominant.* This is the subgroup the proposal serves least well. ADHD-dominant users want *novelty injection on demand, now*, not "answer three questions and wait for one activity." The slow-drip pace will lose them at the second question. They need a fast path through Mode 3 — ideally "skip questions, just give me something" — and they need the option to ask for *five* novel suggestions in a session when the dopamine system is hunting. The 004 panel was clear on this and the new design has narrowed it. Don't.

*AuDHD.* Noor's own quadrant, and the canary case. The interview-then-generate cadence is autistic-friendly; the patience requirement is ADHD-hostile. The likely failure mode: she'll use it once at the kitchen table on a Sunday and never on a Tuesday at 21:30 when she actually needs it. Make sure Mode 3 has a *fast* path (skip interview, prune-only, or one-question version).

*ND-burnout.* This is the design-against case. Tom will not engage with Mode 3 at all under this proposal. Reflective questions are *more* effortful than the old empty text field, not less. That's fine — Mode 1 + base library is the entire product for burnout users — but Noor needs to be explicit that Mode 3 is *not for them* and stop trying to make one mode serve everyone. The pruning function in particular must never trigger automatically for a burnout user; receiving "wegdoen, verbergen of houden?" as a notification when you're already depleted is one more decision than they have.

**The interview questions.** "Drie dingen die je als kind leuk vond" is a bad question for this audience. It assumes autobiographical coherence (alexithymia breaks this), assumes a non-fractured childhood (a non-trivial slice of ND adults had play-suppressing childhoods, often the very reason they can't switch off as adults), and asks for *three* items when one is already hard. KernTalenten works in a clinical room with a trained interviewer — it does not translate to a phone form unsupervised at 21:30. The "afgelopen week" question is better: it's recent, concrete, behavioural. Best phrasing: *"Was er deze week één moment dat lichter voelde dan de rest? Wat was je toen aan het doen?"* — one item, recent, no demand to categorise it as work or play, alexithymia-tolerant because it asks about a *moment*, not a *feeling*. Always allow "weet ik niet" → AI proposes something speculative the user can react to.

**The pruning role.** Accept/skip is behavioural noise, not preference signal, and AI-driven pruning on this data is materially risky for ND users. A skip at 22:00 on a depleted Tuesday is not the same as a skip on a curious Saturday. The PDA user will skip *good* activities precisely because they were suggested. Solution: AI proposes prunes, user confirms each individually with reason chips ("past niet bij mij" / "klopt voor nu, niet altijd" / "alleen op slechte dagen"). Never auto-hide. Pruning must read as the user defending their own list, not the AI editing it.

**Mode 2 deletion.** Defensible — alexithymia made it half-fictional anyway — but for the users who *could* self-rate (Lisa, Jeroen, late-day ND-burnout users who know they're crashing), losing it means losing the only fast filter to "give me something tiny, now." Replace with a single behavioural toggle on Mode 1: *"klein houden"* — surfaces only short, low-stimulation activities. No 1-5 scale, one tap, behavioural anchor not introspective one.

**The single risk to flag.** That the interview-then-generate cadence is a Saturday-morning feature shipped as a Tuesday-night tool, and users will discover at the worst moment that Mode 3 doesn't help when they need help most.

---

## Expert lens — Psychologist (average/below-average cognitive profile)

### 1. Honest read on the proposal

This is worse than the current app for my population, and it is worse than my 004 prescription. The current app at least *gave* a BIF user fifteen plausible activities at signup — a genuine library to fall back on. The proposal trades that floor for a slow drip gated on interview competence the audience does not have. From my lens, this is not a course correction toward me; it is the gifted lens of 004 winning, with the avg/below-IQ dissent quietly dropped on the floor. I named the failure mode in 004 — *the app silently confirms the user's worst belief about themselves* — and this design has made that failure mode more, not less, likely. If Noor ships this, the bottom-IQ quartile gets ~30 base activities and then a pruner that *removes* items they were already barely tolerating, with a "growth" mechanism they cannot operate. That's a shrinking library, not a growing one.

### 2. The KernTalenten framing is gifted-coded design wearing a wellness wrapper

KernTalenten is a Dutch talent-identification framework developed for the *gifted* population — that is its origin and its native context. Importing its method ("name three childhood activities") into a tool meant to serve a wider audience is exactly the bias the lens warns about. The question demands four operations the audience does poorly: (1) abstract autobiographical recall across a decade-plus span, (2) selecting "things you liked to do" as a coherent category from undifferentiated childhood experience, (3) producing *three* — not one, *three* — with verbal fluency, and (4) writing them into a text field. For a user with weaker autobiographical narrative coherence, "I dunno, played outside?" is the honest answer, and it is not enough fuel for the AI to generate from. "Things this past week that didn't feel like work" is worse: "didn't feel like work" is a metacognitive contrast that requires the user to (a) recall the past week, (b) classify episodes as work or not-work, (c) detect *which* not-work episodes had a subjective quality of effortlessness. That is three layers of self-monitoring. The clinical baseline answer is "I don't know," and the literature says it again: that is not evasion. That is the user.

### 3. What the slow drip does to library growth

It kills it. The 004 onboarding batch was the only feature in the app that grew the library for users who cannot author. Replacing it with "one activity per successful interview" means the new library-growth rate for my population is *approximately zero per month*. The pool shrinks under pruning, never refills, and we are exactly back at the failure mode I described in 004 — except now it arrives faster, because pruning is active. The 004 panel's confident move to "AI-as-gardener" assumed the user can generate the things being gardened. My audience cannot. A gardener without seeds is just someone who tidies an empty bed.

### 4. Concrete alternatives within this Mode 3 architecture

If the architecture stays, three changes make it survivable:

- **Replace the interview with picture prompts.** A grid of 12-16 illustrated activity-domain cards (outdoors / hands / water / animals / cooking / music / quiet / motion / making / fixing / people / alone). Tap the ones that look appealing. No recall, no fluency, no typing. The AI generates from selections.
- **Add a "Generate me 5 ideas now" button as a peer to the interview, not a hidden alternative.** Same surface, same prominence. Users who cannot or will not interview get the same product as those who can. Repeatable — monthly, not once.
- **Add "more like this" after every accepted activity.** One tap. The AI proposes a sibling. This is the only authoring-free growth mechanism that bypasses the interview entirely, and it is the change the 004 personas (Daan, Sanne, Tom) also asked for, so it costs nothing politically.
- **Pruning must require explicit user confirmation per item, and must default to "hide" not "delete."** Auto-pruning based on skip patterns will read attention/literacy fluctuation as preference and silently erase usable items. Hazardous.

### 5. The single risk to flag

This proposal, as written, designs the average-and-below-IQ user out of the app entirely while looking, on the surface, like a gentler and more respectful version of the previous one.

---

## Panel of users

### Jeroen — *autistisch, alexithymisch, patroon-gericht*

**1. Het ontwerp door mijn systems-bril.** Nee. Dit is niet het systeem dat ik in 004 voorstelde, het is iets dat erop *lijkt*. Wat ik vroeg: één pool, herkomst-tag, gewogen sample op basis van accept/skip + recency + tijd-van-dag. Een gewone weighted-randomizer met een explore/exploit-knob. Dat is een paar honderd regels code en een SQL-query met `ORDER BY score * random()`. Wat ik nu krijg: een **AI-pruner** die op basis van diezelfde data *voorstellen doet aan mij* die ik vervolgens moet beoordelen. Dat is een UI-loop geplakt op het probleem in plaats van een fix. De data zit nóg steeds aan de zijlijn — alleen nu met een LLM-tussenstap die hem leesbaar maakt. Het ranking-systeem dat ik bedoelde bestaat nog niet. Mode 1 blijft een uniform-random over de pool. Dat is de eigenlijke bug, en die wordt hier niet geraakt.

**2. Pruning door AI.** Je hebt gelijk: accept/skip is gedrag, geen voorkeur. Ik skip "bel een vriend" niet omdat ik die activiteit haat, maar omdat ik om half tien 's avonds geen sociale energie meer heb. Een naïeve pruner die dat als "deze activiteit past niet bij Jeroen" interpreteert, gooit een legitieme zondagmiddag-optie weg. Voorwaarden waaronder ik het wél vertrouw: (a) de AI **voorstélt**, ik beslis — geen auto-removal, ooit; (b) de score is **contextueel** (tijd van dag, dag van de week), niet één globaal getal; (c) de optie is "verbergen" met undo, niet "verwijderen". En zelfs dan: ik wil de **ruwe data** zelf kunnen zien. Een tabelletje met activity, accept count, skip count, last accepted. Geen AI-interpretatie. Geef mij het dashboard, niet de samenvatting.

**3. De interview-vragen.** "Drie dingen die je als kind graag deed." Eerlijk: nee, dat kan ik niet beantwoorden. Ik weet dat ik LEGO had en buiten was, maar ik heb geen warme bibliotheek van *gevoelens-bij-herinneringen* om uit te putten. Dat is exact het soort vraag waarop ik vastloop — net als "hoe voel je je?" in Mode 4. Voor mij werkt **observatie, niet introspectie**. Betere vragen voor iemand als ik: *"Welke drie dingen heb je afgelopen maand het vaakst gedaan op een vrije avond?"* (feitelijk, telbaar), *"Welke YouTube-kanalen kijk je zonder dat het werk voelt?"*, *"Wat staat er op je bureau dat geen werk is?"* Gedrag dat al gebeurt, geen jeugd-archeologie.

**4. Drip-tempo van één.** Past niet bij hoe ik denk. Eén voorstel is een **kale datapunt zonder context**. Geef mij vijf, dan zie ik het patroon ("oh, drie van de vijf zijn solo + Hands + onder 30 min — de AI heeft mijn profiel goed begrepen") of de mismatch ("vier van de vijf zijn sociaal, dat klopt niet"). Pattern recognition werkt niet op N=1.

**5. Mode 2 verwijderen.** Akkoord. Ik gebruikte hem niet en heb nooit een zinvolle waarde kunnen kiezen op die 1–5 schaal. Het *bestaan* van de filter zei vooral dat de app self-report serieus nam — dat is conceptueel een verkeerde aanname voor alexithymische gebruikers. Weghalen is winst.

**6. Eén structurele kritiek.** Bouw de **weighted pool eerst**, AI-features daarna. Volgorde: (1) per-activity score gebaseerd op accept/skip/recency/tijd-context, (2) Mode 1 = weighted sample, (3) een debug-view waar ik zie *waarom* een activiteit boven of onder kwam. *Dán* pas een AI-laag erbovenop voor edge cases (cold start, gap detection, herformuleren). Wat hier voorgesteld wordt is een AI-feature die de gemiste infrastructuur cosmetisch verbergt. Eerst de pipes, dan de UX.

### Yuna — *ADHD, designer, taalgevoelig*

Ik heb dit voorstel drie keer gelezen voordat ik wist wat ik ervan vond. Dat is op zich al een signaal — het is geen voor de hand liggend "ja" of "nee". Het raakt iets goed, maar het laat ook iets liggen.

**De interview-vragen.** "Drie dingen die je als kind graag deed" — eerlijk: dit landt bij mij. Het haakt ergens vast. Ik denk meteen aan stickerboeken bijhouden en aan de manier waarop ik patronen uit tijdschriften knipte. Dat is geen activiteit, dat is een herinnering, maar er zit een activiteit in verstopt die nog steeds van mij is. Dát is het verschil met een formulier. "Drie dingen die niet als werk voelden" is zwakker — te dichtbij m'n werk, het roept een soort productiviteits-zelfevaluatie op ("doe ik wel genoeg dingen die niet als werk voelen?"). Schrap die, of vervang door iets fysieker, zintuiglijker. *"Wat heb je laatst gemaakt met je handen, ook al was het niks?"* Of: *"Wanneer was de laatste keer dat je je verveeld voelde — wat deed je toen?"* Verveling is een goudmijn die niemand meer aanboort. Een vraag die ik nooit zou verwachten van een app: *"Welk geluid mis je?"* Dat zou me écht laten typen.

**Toon van de AI.** Niet "we gaan samen kijken naar wat jou helpt ontspannen." Dat is de zachte therapie-stem en daar haak ik direct af, net als Lisa. Liever droog, klein, een beetje schuin. *"Ik weet niet veel van je, maar één ding dan."* Geen "we", geen "jij en ik", geen vriendelijke vlakke begeleiding. Een AI die durft te zeggen *"dit is een gok"* in plaats van *"hier is een suggestie speciaal voor jou"*. Onzekerheid in de toon maakt 'm menselijker dan elke vorm van warme woordkeuze. En géén emoji's. Géén exclamaties. Korte zinnen. Lowercase als 't kan.

**Drip-tempo, één per keer.** Goed. Zorgvuldig, niet traag. Maar — en dit is belangrijk — alleen als ik zelf het tempo bepaal. Eén per sessie, oké, maar laat *mij* beslissen of er nog een komt. Geen "morgen weer een nieuwe" als dwingende drip. 's Avonds laat wil ik er soms drie achter elkaar, woensdagochtend nul. De AI moet wachten tot ik tik.

**Pruning.** Hulp, mits de formulering klopt. *"Wil ik deze 4 weghalen?"* — fout, te bazig. *"Deze sla je vaak over. Weghalen, of laat ik 'm staan?"* — beter, observatie eerst, beslissing bij mij. En cruciaal: gééft de AI alleen voorstellen voor dingen die de AI zelf heeft toegevoegd of die uit de basislijst komen. Áls ik ooit iets zelf heb toegevoegd, blijft dat van mij — daar mag de AI niet aankomen, ook niet voorstellen. Anders voelt het als iemand die mijn boekenkast komt uitzoeken.

**Mode 2 weg.** Akkoord. Ik heb 'm nooit gebruikt.

**Eén ding radicaal.** Noem het geen "AI-assistent". Dat woord brengt automatisch een ChatGPT-toon mee en daar ga je tegen vechten. Noem het *een vraag*. Eén knop in het menu: *"Stel me een vraag."* Wat erachter zit is een AI, prima, maar het frame is ruil — ik geef iets, ik krijg iets — niet *assistentie*. Assistentie is voor mensen-met-problemen. Een vraag is voor iedereen.

### Sanne — *autistisch, shutdown, sensorisch gevoelig*

Ik moet hier even bij stilstaan, want dit voorstel raakt precies aan wat ik vorige keer probeerde te zeggen — en het lost het deels op, en deels maakt het het erger.

**Wanneer ik Mode 3 zou openen.** Niet om half acht 's avonds. Echt niet. Op het moment dat ik de app open zit ik plat op de bank, lampen uit, en kan ik nog net ja of nee tikken. Een AI die mij iets vraagt, hoe vriendelijk ook geformuleerd, is dan een gesprek, en gesprekken zijn precies wat ik dán níét aankan. Dus Mode 3 wordt automatisch een feature voor "een rustig moment." Bestaat dat moment? Zondagochtend, soms. Met koffie, gordijnen half open, voordat de dag begint. Eén keer per week, misschien. Niet meer. En dat is een ander gebruikspatroon dan Mode 1 — dit is geen *unwind*-moment, dit is een *onderhouds*-moment. Dat is fundamenteel oké, maar wees daar dan eerlijk over. Niet verstoppen achter "Mode 3" alsof het inwisselbaar is met Mode 1.

**De vragen.** "Drie dingen die je als kind graag deed" — nee. Dat is geen lichte vraag voor mij. Ik heb een gemaskeerde jeugd, dingen die ik leuk *deed* en dingen die ik leuk *vond* zijn niet hetzelfde, en die vraag dwingt me in vijf seconden tot een soort therapeutische archeologie waar ik niet op zit te wachten op een zondagochtend in een app. Aan een AI? Voelt onveilig. Niet omdat ik denk dat er iets engs mee gebeurt, maar omdat het te intiem is voor het medium. De tweede vraag is veel beter — "iets van afgelopen week dat niet als werk voelde" — concreet, recent, lage emotionele inzet. Hou het daar. Heden, geen verleden.

**De AI als gesprekspartner.** Vorige keer zei ik: de AI-activiteiten voelden als "een spiegel die teruglacht." Een AI die nu *actief mee-denkt* maakt dat erger, niet beter — want nu glimlacht de spiegel terug *en stelt vragen*. Tenzij. Tenzij het frame verandert van "AI die mij leert kennen" naar "tool die mijn eigen antwoorden teruggeeft." Geen "ik snap je nu beter." Wel: "je zei X, hier is iets dat daarop lijkt." Functioneel, niet empathisch. Geen menselijke toon nadoen.

**Eén-tegelijk.** Past, ja. Dat is goed. Liever één dan tien.

**Pruning.** Opluchtend, mits de AI niet doet alsof het iets *over mij* heeft begrepen. "Je hebt deze 6× overgeslagen — weg?" — prima. "Ik denk dat dit niet bij jou past" — nee, ga weg.

**Eén ding radicaal anders.** Splits Mode 3 in tweeën. De pruning is een avondklus (één tik, weg). De generatie is een zondagochtend-ritueel, met andere visuele toon, andere drempel. Niet één deur. En houd vast aan wat ik vorige keer zei: de échte authorship-knop is *na* een activiteit, niet ervoor. Die ontbreekt hier nog steeds.

---

## Recommendations

Ordered by strength of panel endorsement and clarity of the next concrete step.

### Strongly endorsed (5+ voices)

1. **Build the weighted-pool infrastructure first.** Per-activity score from accept/skip + recency + time-of-day context; Mode 1 becomes a weighted sample over the pool. This is the 004 ask that did not get delivered. It can ship without an LLM in the stack. Jeroen's lens is uncompromising on this and the giftedness, ND, and avg/IQ lenses all support it implicitly — *first the pipes, then the UX.* Without this, every AI feature is cosmetic over a missing system.

2. **Rewrite the interview questions.** Drop the childhood question — it is gifted-coded, emotionally heavy, and only one of six voices endorses it. Move from *recall* to *observation*, from *feeling* to *behaviour*, from *childhood* to *this week*. Default question: *"Was er deze week één moment dat lichter voelde dan de rest? Wat was je toen aan het doen?"* Always accept "weet ik niet" as a valid response that proceeds the flow (with the AI proposing a speculative item the user can react to). Provide a small rotating set of behaviour-anchored alternatives — Yuna's *"welk geluid mis je?"*, Jeroen's *"wat staat er op je bureau dat geen werk is?"*, the ND lens's *"één moment dat lichter voelde."*

3. **The interview's output is the activity itself, in the user's words.** AI paraphrases to duration + present-tense form, user edits and accepts. AI does not author from scratch off the interview answers. This is the giftedness lens's load-bearing amendment and the change that turns the interview from ghostwriting-with-consent into genuine retrospective authorship.

4. **Multiple library-growth paths, not one.** Make all of these peers, not hidden alternatives:
   - The interview (current proposal, revised)
   - *"Genereer me 5 ideeën nu"* — repeatable, no interview, for the dopamine-hunting and the avg/IQ user
   - Picture-domain selection (12–16 illustrated activity-domain tiles, tap the appealing ones) — for the user who cannot author or interview
   - *"Meer zoals dit"* — one tap after an accepted activity, AI proposes a sibling
   - After-activity save in the user's own words (Sanne's 004 ask) — the strongest authorship moment in the entire app, still missing

5. **Pruning is user-driven; AI is evidence presenter.** Never auto-hide. Per-item user confirmation with reason chips ("past niet bij mij" / "klopt voor nu, niet altijd" / "alleen op slechte dagen"). Default action is *verbergen* with undo, not delete. The *primary* prune-direction signal is the explicit *"dit werkte echt goed"* rating — accept/skip is secondary at most. AI proposals must be worded as observation, not insight ("je sloeg deze 6× over" — yes; "ik denk dat dit niet bij jou past" — no). User-authored items are off-limits to AI pruning, full stop.

6. **Don't call it an AI assistant.** Yuna's framing: *"Stel me een vraag."* The user-facing concept is a small exchange, not assistance. AI under the hood, question on the surface. *Assistentie is voor mensen-met-problemen. Een vraag is voor iedereen.*

7. **AI tone: functional, calibrated-uncertain, lowercase.** No "we," no "jij en ik," no warm-vague guidance. *"Dit is een gok"* beats *"hier is een suggestie speciaal voor jou."* No emoji. Short sentences. Calibrated uncertainty in copy is more human than warm copy.

### Endorsed (3–4 voices)

8. **Split prune from generate temporally.** Prune is an *avondklus* — one tap, lives on the suggestion card as a long-press, or in a small evening review. Generate is a *zondagochtend-ritueel* — separate visual tone, separate cadence, treated as a maintenance moment, not a Mode-1 replacement. Mode 3 today conflates the two; pulling them apart reduces decision load and matches when each is actually usable.

9. **Replace Mode 2 with a single behavioural toggle on Mode 1.** *"Klein houden"* — surfaces only short, low-stimulation activities. One tap. Behavioural anchor, not 1–5 self-report. Preserves the fast-filter capability that Mode 2 attempted without re-introducing the alexithymia tax.

10. **Cap interview frequency.** Once a fortnight, not on demand. Scarcity protects the ritual (giftedness). Avoids the dopamine cliff that would otherwise burn out the feature in week 3.

11. **Allow the user to control drip tempo.** Default: one suggestion per session with a *"nog één?"* button. Not a forced drip. Yuna and ND ADHD-dominant both flag this; Sanne is happy with one but doesn't object to a button.

### Open questions for Noor

12. **Is the avg/below-average IQ user in scope?** Unresolved from 004; the avg/IQ lens dissented again in 005 and warned that the proposal "designs the average-and-below-IQ user out of the app entirely while looking gentler." Recommendations 4 (multiple growth paths) and the picture-domain prompt make the proposal *survivable* for this audience. If you actively want them in scope, ship those. If you don't, say so explicitly. Drifting between the two is the worst outcome.

13. **What happens to Mode 4?** Unspecified in the proposal. The panel reads the new Mode 3 as effectively a replacement for Mode 4 (structured interview + AI generation = exactly what 004 recommended Mode 4 become). If they're being merged, name that. If both exist, there is now a Mode 4 with no obvious job — that needs answering or removing.

14. **Mode 3 is a Sunday-morning feature, not a Tuesday-night feature.** Sanne and the ND lens both name this. Be honest about it in the UI; *don't* shelve it under "Mode 3" alongside Mode 1 as if they're peers. Possibly: don't call it Mode 3 at all. *"Stel me een vraag"* (Yuna) + a separate prune surface, not under a single mode entry.

---

## What to keep

- **Mode 1 as the spine.** Universal. Don't redesign the open-app moment. All the redesign work goes into what *feeds* the pool.
- **The base library.** 004 made this point loudly; 005 reaffirms by implication — every voice still references it as the floor.
- **Deletion of Mode 2.** All six voices endorse, modulo the "klein houden" replacement.
- **The intent of the proposal.** Repositioning AI as gardener-plus-paraphraser, not generator, is the right direction. The implementation is what needs work.

---

## Net verdict

The proposal moves Unwind in the right direction. It also leaves three of the four things 004 asked for un-shipped: the data-using infrastructure (Jeroen), the authoring-from-completed-activity surface (Sanne), and the avg/below-IQ growth path (the dissenting lens). The interview-led generation is genuinely new and genuinely promising, but only with the revisions above — particularly the verbatim-output rule and the broader question palette. As drafted, it is built on Noor's own preferred way of thinking about herself; the panel's job in 005 was to remind her that this is, again, the bias to correct for.
