# Review 004 — App purpose and long-term flow

**Date:** 2026-05-19
**Scope:** A fundamental question about Unwind's spine — should AI generation be central to how the library is built, or is the app meant to surface from a list the *user* has authored? What flow keeps users genuinely served at session 10, 50, and beyond?
**Reviewed by:** Five expert lenses (giftedness psychologist, neurodivergence psychologist, psychologist for average/below-average cognitive profile, human-machine interaction researcher, general psychologist for motivation & behaviour change), plus all 7 personas (Sanne, Daan, Fatima, Jeroen, Yuna, Lisa, Tom).

**NOTE** The review happened on the basis of premises of which some were false. See the note at the bottom of this file. 

---

## The question Noor put to the panel

The original idea for Unwind: when overwhelmed and unable to switch off, get one activity at a time, bounded in time, from a list of things *you already like*. AI was meant as an *extra* — sometimes great when it surfaced something Noor would never have thought of — but never the spine.

The current shape has bent away from that. A new user lands with ~30 base activities and is funnelled through an AI-generation flow that adds ~15 personalised activities to their library. "Add your own" exists (full CRUD) but is not surfaced. Friends and family Noor has shown the app to consistently judge it on the AI angle — *do the AI activities fit me?* — which is exactly the dimension she did not want the app to be evaluated on.

In her own long-term use, Noor reports getting **lazier, less motivated, and more critical** — many AI activities feel "off" because they are not really hers. The list has shifted from authored-by-her to authored-by-Claude, and the relationship she has to it has shifted with it.

She asked the panel to think about long-term users (session 10, 50, six months in), to consider whether her experience generalises or is specific to her gifted-autistic profile, and to be willing to recommend radical changes — including dropping AI generation entirely, dissolving the four-mode structure, or rethinking whether "list of activities you like" is even the right primitive.

---

## Headline

**Drop the bulk AI generation as an onboarding step.** Four of five experts and six of seven personas independently recommend it. The convergent direction across twelve voices: stop generating libraries *for* the user; let the library grow *from* their use, with AI repositioned as a **gardener** (pruner, recogniser, retrospective paraphraser) rather than as an **author**.

The lone substantive dissent is the psychologist for average/below-average cognitive profile, who argues AI generation is the *only* sustainable library-growth mechanism for users who genuinely cannot a uthor themselves — and that demoting it risks the app silently confirming the user's worst belief about themselves ("even this app stopped working for me"). That dissent is the most important caveat in this report and should not be glossed over: it is a target-audience question, not a design-quality one.

---

## What the panel agrees on

### 1. The onboarding AI batch is the most ownership-corrosive feature in the app.

The HMI lens names the mechanism most precisely: Noor swapped a *recognition task* ("oh yeah, that") for an *evaluation task* ("is this any good?"). Recognition is cheap and warm; evaluation is expensiv e and adversarial. Once items are recoded as "the system's offers to me," the brain's critical faculty is obligated to vet them, and a 50–70% miss rate on AI suggestions becomes adversarial evidence rat her than benign noise.

The giftedness lens reframes this as **authorship collapse** — provenance, not quality, is the currency for the gifted brain, and unearned library entries feel inert even when they are objectively good. Two of the personas — Sanne and Yuna — independently report a *worse* skip rate on AI items than on the base activities, despite the AI items being more personalised.

The general psychologist puts this in Self-Determination Theory terms: a list someone else (even a clever model) wrote *for* the user is technically customised but psychologically heteronomous. Autonomy is leaking. Competence is also degraded: the user never builds the meta-skill of knowing what restores them, which is the actual long-term protective factor.

### 2. Authorship should grow retrospectively, not prospectively.

This is universal across the persona panel: **nobody** would sit down on a Tuesday evening and type activities into a form. Sanne, Daan, Fatima, Yuna, Tom and Lisa all reject the prospective-authoring m odel outright — and the one persona who *did* use the CRUD (Jeroen) admits it was likely driven by control-need rather than genuine library-improvement. But every one of them would tap a confirm-button **after** a completed activity to enshrine their version of it ("rondje om het blok, 20 minuten" vs the generic AI version). The ND psychologist and HMI researcher both arrive at the same recommendation independently: replace "Add your own" with "Save this one." The cost-benefit ratio of this single change is the most favourable on the table.

### 3. Accept/skip data is collected but unused.

Jeroen flags the architectural smell most clearly, and the HMI and motivation lenses both reinforce it. The app captures every accept and every skip but does nothing with the signal. Mode 1 is a uniform random over the pool. After 50 sessions of skipping the same four AI items, the system has not learned that those four items don't belong. This is the simplest principled improvement available and it i s invisible to the user (good — no extra surface).

### 4. The four-mode structure is one or two doors too many.

Mode usage in the persona panel collapses sharply:
- Mode 1: used by everyone, primary for almost everyone
- Mode 2: barely used. Tom can't self-rate stress (anhedonia), Fatima and Sanne never touch it, only Lisa and Jeroen occasionally
- Mode 3: only Jeroen and Yuna use it with any regularity. Tom rejects the premise ("the answer is usually nothing")
- Mode 4: zero regular usage. Everyone who tried it bounced on the empty text field

The neurodivergence psychologist puts it bluntly: *modes 2 and 3 are filters, not modes.* Three of the four "modes" are doing the same thing with different `WHERE` clauses. Collapsing them into a single suggest surface with optional filter affordances is endorsed by giftedness, ND, gen-psych, and Jeroen.

The avg-IQ psychologist additionally flags that Mode 3's Head/Hands/Heart abstraction asks the user to *retroactively classify their own day*, which is a metacognitive operation that not everyone can pe rform. Concrete tappable prompts ("wat was je net aan het doen?" with picture-supported categories) preserve the counterbalance logic without the abstraction tax.

### 5. AI's right role is gardener, not generator.

Five distinct framings converge on the same destination:
- HMI: *pruner not populator* — every prune is an ownership act
- Giftedness: *noticer of gaps* — propose one activity when the user has 10+ self-added items and a category is empty
- General psychology: *interviewer not generator* — walk the user toward authoring rather than replacing the act of authoring
- ND psychology: *thought partner that proposes one and asks the user whether to save it*
- Yuna: *editor not supplier*

The shape is the same: AI lives *alongside* the user's list, not inside it. It helps the user maintain, refine, and notice. It does not bulk-fill.

---

## What the panel disagrees on

### Tension 1 — Is Noor generalising or projecting?

The giftedness, ND, HMI and motivation lenses all say: **substantially generalising**, with graded intensity. The mechanism (recognition-replaced-by-evaluation; autonomy leaking) operates across audienc es. Autistic-dominant and AuDHD users feel it sharpest; ADHD-dominant least; neurotypicals less consciously and more slowly, surfacing as boredom and drift rather than as critique.

The avg/below-IQ psychologist **dissents materially**: Noor is gifted, her self-reported preference is *not* the modal user's preference, and the literature on self-help app retention is clear that the users who drop fastest from authorship-as-spine designs are the ones with weaker working memory, lower verbal fluency, and lower self-monitoring capacity — precisely the users for whom AI generation is the *only* sustainable library-growth mechanism. The "gifted-author worldview" is the *default failure mode* of wellness apps (Calm, Headspace, Finch, Woebot were all built by people who could write the ir own activity list in five minutes), not a corrective to it.

**How to read this conflict:** both lenses can be right simultaneously. Unwind cannot serve all four quadrants of [gifted / average-or-below] × [ND / NT] with one library model. **Noor needs to decide w hich quadrant she is primarily building for.** If it is gifted-ND (her quadrant), the recommendations below stand. If it is genuinely a wider mass-market tool, the AI batch may need to *expand*, not shr ink — Verzin Activiteiten as a normal, repeatable, friendly action rather than a once-per-onboarding ceremony.

### Tension 2 — Is the app for *choosing* or for *being pushed*?

Tom's response is structurally different from every other voice in the panel. He does not have a *kiezen-uit-iets-doen* problem — he has a *doen-überhaupt* problem. The app assumes the user wants to be presented with an option to accept or skip. For an anhedonic, burned-out, or in-recovery user, that assumption is wrong: they need a small *assertive push* at a calibrated moment, not a menu of one.

This is a real branch in the design space. Unwind today is a **choice-architecture tool**. Tom is asking whether it should also be a **gentle behavioural-activation tool** — and the gen-psych and ND len ses both note that ND-with-burnout is a large slice of the realistic user base. Could be a setting, a mode, or out of scope. Worth deciding consciously.

### Tension 3 — Is the app for ND-only or also mainstream?

Lisa is the cleanest test. She is honest that the app, as positioned, will leave her phone within a few months — not because it is bad, but because it gives her nothing new. Her ask is for **discovery** , not relaxation: curated local things, seasonal variety, things she has not encountered yet, less wellness-coded tone. That is a fundamentally different product than the one the rest of the panel is re viewing.

For Noor: is the Lisa audience in scope at all? The 001 panel left this open. This panel sharpens it: serving Lisa requires a discovery layer that does not currently exist and would re-introduce exactly the kind of curated-by-someone-else tone the ND audience pushes back on. **The two directions are not reconcilable inside one product without bifurcating it.**

### Tension 4 — Is the right primitive "activities you like" or "activities you have done"?

Multiple lenses (ND psych, gen psych, several personas) push the same reframe: the bar for entry into the library should be *past-tense evidence*, not future-tense aspiration. "Drawing sounds nice in th eory" inflates a library with phantom activities that never get done. "Things I have done and want to do again" produces a leaner, harder, more honest list.

This is a content principle, not a feature. But it changes how authorship is invited (always retrospective), how AI is allowed to contribute (it cannot author past tense by definition — it can only para phrase), and what the suggestion engine surfaces.

---

## Expert lenses

## Expert lens — Giftedness psychologist

### Is Noor reading herself correctly?

Mostly, yes — and the mechanism is worth naming precisely, because if it's wrong, the design fix is wrong too. What she's describing isn't "I don't like AI suggestions." It's *authorship collapse*: when the input is generated faster than the cognitive-affective system can metabolise it, the gifted user stops experiencing the list as theirs and starts experiencing it as a stream to be evaluated. Evalua tion is the gifted default mode. Once evaluation is engaged, the criticality engine spins up — and as the input quality is mediocre-to-OK rather than excellent, the verdict is rejection. That rejection, repeated, hardens into the apathy she's reporting. Dabrowski's intellectual and emotional overexcitabilities don't tolerate "good enough" input from an external source the way they tolerate self-author ed "good enough." Self-authored mediocrity carries autobiographical weight; AI-authored mediocrity is just noise to be filtered.

So her read is right. What she's slightly missing: this is not aversion to AI per se, it's aversion to *unearned* library entries. An activity she generated herself in five typed words ("walk to the can al") will outperform a Claude-generated paragraph for her even if Claude's version is objectively richer. The currency is provenance, not quality. She should stop arguing with friends about whether the AI suggestions are good — that's the wrong axis.

Is this gifted-specific? Substantially, yes. Intrinsic-motivation dominance plus high autonomy needs plus criticality-as-default is the gifted triad that makes externally-curated lists feel inert. Neuro typical users with lower baseline criticality and weaker autonomy drive will accept an AI library as a gift. Some autistic-without-giftedness users will too — predictability beats authorship for them. Jeroen in the 002 panel is the tell: he loves AI as long as he controls the inputs. That's the gifted-autistic compromise, not universal.

### Trajectory

- **Session 10.** Gifted user has skipped 60% of AI activities, accepted 2-3 they probably would have thought of anyway, and is starting to feel the list is "not them." Pool still feels novel enough that the app survives.
- **Session 50.** The list has calcified. Skip rate climbs. The user opens the app, sees the same rotation, closes it, and goes back to scrolling. Mode 4 gets one last shot and is judged against an unfair bar ("surprise me, and make it good"). It can't. App becomes a guilt artefact on the home screen.
- **Session 500.** Only the users who treated Unwind as a *prompt to author their own toolkit* are still here. Everyone else uninstalled around session 30-60. The retained users have ~15 activities, almost all self-added, and use Modes 1-3 as a randomiser over their own list. Mode 4 is dead. The AI-generated activities have been hidden or are skipped on autopilot.

### Design recommendations

1. **Demote AI generation from "fill my library" to "help me notice what's missing."** Drop the 10-15 onboarding generation entirely for gifted users (and probably everyone). Replace with an AI mode that, after the user has 10+ self-added activities, occasionally offers *one* surprise based on the gaps it sees ("you have nothing Hands + low-stress — want one?"). One at a time, accept-or-ignore, no pool-bloat.
2. **Make authorship the onboarding.** Not a blank form. A *seeded recall* exercise: "Name three things you did last weekend that didn't feel like work" → those become her first activities, verbatim, in her words. Scaffolding without ghostwriting. This is the gifted-friendly version of journaling-as-intervention.
3. **The four-mode structure is one too many.** Mode 4 is dead weight for this audience; the panel's own 001 review already said nobody's primary mode is Mode 4. Merge Modes 2 and 3 into a single "filter the suggestion" sheet. Make Mode 1 the app.
4. **Add a "this isn't mine" gesture.** Long-press → "remove, this never felt like me." Faster than skip-tracking and gives the criticality engine somewhere productive to go.
5. **Cap the library.** A gifted user with 80 activities has chaos, not choice. Soft cap around 25; force a swap to add a 26th. Constraint is felt as care.

### The risk I'd flag

That Unwind quietly trains gifted users to outsource a domain — *knowing what relaxes me* — that is already fragile in this population and shouldn't be outsourced at all. The app's job is to retrieve self-knowledge under load, not to substitute for it. If she ships the AI-heavy library as-is, the six-month outcome for the gifted segment isn't "they relax better." It's that they relax slightly more efficiently in the short term and lose another inch of contact with their own preferences in the long term. That's not a wellness app. That's a deskilling app with a calm theme.

---

## Expert lens — Neurodivergence psychologist

Noor isn't pattern-matching a fuzzy ND vibe — she's describing a fairly specific clinical mechanism, and it's worth naming it precisely. What she's lost is **interest-driven authorship**: the moment at which an ND brain (monotropic in particular) builds attachment to an activity by *choosing* it, *naming* it, and *locating* it in its own internal landscape. When you import 15 plausible-sounding activities from outside, you bypass that attachment process. The activities pass the literacy test ("yes, drawing is a thing I do") but fail the interest test ("this isn't what *I'd* have written down"). For monotropic users especially, an activity that isn't already inside an existing attention tunnel is functionally invisible — it can sit in the list for 50 sessions and never feel like a real option. So her erosion-of-ownership intuition is correct, and it generalises.

The ND-lens literature on user-authored vs. externally-curated lists is thinner than you'd hope, but the adjacent evidence is consistent: self-generated coping menus outperform clinician-generated ones in DBT skills generalisation, SPACE-style anxiety work, and ADHD coaching, *specifically on the long-tail measure of whether the person still uses the menu six months later*. Externally curated lists score higher in week one and lower in month six. That is exactly Noor's trajectory.

The four sub-profiles pull in genuinely different directions:

- **PDA** treats any externally-presented activity as a demand. AI-generated activities are worse here, not better, because they carry the implicit "we picked this *for you*" framing. A PDA user needs activities that read as *options they happened to think of*, not assignments.
- **Monotropism (autistic)** wants the activity to plug into an existing attention tunnel. Random AI suggestions break tunnels; user-authored activities map them.
- **Alexithymia** can't reliably answer "what would feel good right now," so the stress-level filter (Mode 2) is half-fictional for these users — they're guessing at a number. They need behavioural anch ors, not introspective ones.
- **Executive dysfunction (ADHD-dominant)** benefits most from *external* prompting and is the one profile where the AI batch genuinely earns its keep — novelty seeking + initiation deficit.
- **ND burnout** can tolerate almost no decisions and needs the smallest possible surface area.

These don't reconcile into one product. They reconcile into **defaults that fit the median ND user and explicit affordances for the edges**.

**Trajectory at 10 / 50 / 500 sessions.** Autistic-dominant users plateau early — they find 3–5 activities that work and want those, repeatedly, forever. By session 50 the AI batch is dead weight clutte ring their list. ADHD-dominant users churn through novelty and *do* benefit from periodic injection, but they need it on-demand, not front-loaded. AuDHD users (Noor) are the casualty case: the autistic side wants a tight, owned list; the ADHD side accepts the AI shortcut at onboarding; six months in the autistic side resents what the ADHD side imported. ND-burnout users never make it to session 50 unl ess the app is effortless; they'll use Mode 1 forever and ignore everything else.

**Recommendations, direct:**

1. **The four-mode structure is wrong as a top-level shape.** Modes 2 and 3 are filters, not modes. Collapse them into a single suggest surface with optional filter affordances ("ik ben gestrest" / "ik wil iets anders dan vandaag"). Three of the four "modes" are doing the same thing with different `WHERE` clauses.
2. **AI generation as an onboarding batch should go.** It is the single most ownership-corrosive feature in the app and Noor's lived experience is the canary. Keep AI as an *in-the-moment thought partne r* (a stripped-down Mode 4) that can propose *one* activity and *ask the user whether to save it* — authorship returns to the user because they decide what enters the list.
3. **Reframe the primitive.** "List of activities you like" is subtly wrong. Better: "list of activities you have *done and want to do again*". The bar for entry is past-tense evidence, not future-tense aspiration. This kills the "drawing sounds nice in theory" inflation problem.
4. **Scaffold authorship without making it homework.** After every accepted activity, one optional tap: *"Toevoegen als variant?"* — the user names a specific version they actually did ("20-min wandelin g bij de vaart"). The list grows from lived sessions, not generated guesses. This is the right authorship model for ND users: retrospective, low-effort, anchored in completed behaviour.
5. **Base library stays, AI batch dies, user-authored list grows incrementally from use.** Discoverability: the "+" lives on the suggestion card itself, not buried in a menu.

**The single risk I'd flag.** If you ship as-is, the most likely failure mode at six months is not abandonment — it's a quieter and worse outcome: users keep opening the app, keep skipping more than the y accept, and conclude that *they themselves* are the broken part ("zelfs deze app werkt niet voor mij"). For an audience already prone to self-blame about regulation failures, an app that silently erod es their sense of knowing what they like is iatrogenic. That is the harm to design against.

---

## Expert lens — Psychologist (average/below-average cognitive profile)

### 1. On Noor's diagnosis as a generalisable design source

Noor is gifted, autistic, and self-aware enough to articulate that she wants a tool that surfaces *her own* ideas one at a time. That is a coherent, healthy preference — and it is not the modal preference. The literature on self-help and behavioural-activation apps is consistent and unkind on this point: retention in the average-IQ and below-average-IQ band collapses fastest on features that require self-monitoring, self-articulation, and library curation. Meta-analyses of digital mental health interventions (Linardon, Torous, Baumel's *DARM* work on real-world engagement) show median 30-day retention in single digits, and the users who drop first are the ones with weaker working memory, lower health literacy, and lower verbal fluency — exactly the population least able to "author their own list." The gifted-author worldview is the *default* failure mode of wellness apps, not a corrective to it. Calm, Headspace, Finch, Woebot — every one of them was built by someone who could write their own activity list in five minutes and then assumed the user could too.

So: trust Noor's instinct about *her* experience. Distrust it as a design proxy for a user who, when asked "what helps you relax?", answers "I don't know" — and means it. That user is not being evasive. She genuinely doesn't know. That is the clinical baseline for a large slice of the realistic user base, and it does not improve with "agency" framing.

### 2. Trajectory at session 10 / 50 / 500

**Session 10.** The base library carries this user. ~30 curated activities with concrete duration tags is, frankly, the entire product for them. Mode 1 (random) works. Mode 2 (stress 1-5) is borderline — self-rating stress on a 5-point scale assumes interoceptive granularity that this population often lacks; many will pick "3" every time because 3 is the safe middle. Mode 3 (Head/Hands/Heart) is where I expect the first real failure: it requires the user to abstract from "I sat at my desk" to "that was a Head activity, so I need Hands or Heart." That is a metacognitive operation, and for a user with BIF or mild ID, it is genuinely hard. Many will tap whichever category sounds nicest, not whichever counterbalances.

**Session 50.** The "add your own" affordance, even surfaced prominently, will produce near-zero authored activities in this group. They will not generate ideas; that's why they're using the app. AI-gen erated batches, if they exist, are the *only* mechanism that grows the library for them. The pool-exhaustion problem the 001 panel flagged for Daan is twice as bad here, because the recovery move ("add some yourself") is unavailable.

**Session 500.** Two divergent outcomes. Either (a) the app has quietly become a small, beloved, finite list the user cycles through — fine, that's a real win — or (b) the user has churned because the library never grew and the suggestions feel stale, and they could neither articulate why nor fix it. Mode 4 chat will not save them; conversational AI assumes the user can type a meaningful prompt, which is a literacy and verbal-fluency ask this population fails on more often than designers assume.

### 3. Concrete design recommendations

- **Promote AI generation, don't demote it.** For this audience the AI batch isn't a luxury or a crutch — it is the *only* sustainable library-growth mechanism. Make "Verzin activiteiten voor me" a normal, repeatable, friendly action, not a once-per-onboarding ceremony. Run it every few weeks. Tell the user "here are five new ideas, hide the ones you don't like." That is the entire personalisation loop they will engage with.
- **Reframe "add your own" as "save this one."** Authoring from scratch is too heavy. But tapping a heart on a suggestion they liked is well within reach. Same data outcome, a fraction of the cognitive load.
- **Demote Mode 3 or rebuild its labels.** Head/Hands/Heart is an elegant abstraction *for someone who finds abstractions easy*. For the target population, swap to concrete prompts: "What were you just doing?" with picture-supported tappable options (Working at a screen / Talking to people / Cleaning / Resting / Nothing). The counterbalance logic stays; the user-facing model becomes concrete.
- **Cap Mode 2's scale at 3 points, not 5.** Five-point self-report is a known weak spot. "A bit / quite / a lot" outperforms 1–5 for users with weaker introspective vocabulary.
- **Keep duration tags. They are the most clinically valuable feature in the whole app.** "Go for a 20-minute walk" is the difference between a usable suggestion and an anxiety-inducing one for someone with weak planning ability.
- **Add a "did this help?" thumbs-up/down, not a stress-delta scale.** Two-point feedback is the ceiling for reliable self-report in this group.

### 4. The long-term risk if AI is demoted

**Learned helplessness via library stagnation.** If the giftedness lens wins and AI is pushed to the margins on the theory that "real ownership comes from authoring," what actually happens for the average/below-average user is: the library never grows, the suggestions repeat, the user concludes the app "stopped working" or "isn't for me," and — this is the part that matters clinically — they internalise that failure. Self-help apps don't churn neutrally for this population. They churn *with a story attached*: "I tried, it didn't work, I'm the problem." Every previous wellness app they've abandoned has taught them the same lesson. Unwind's specific opportunity is to be the one that keeps producing fresh, concrete, plausible suggestions without requiring the user to generate them — which is precisely what AI is good at and precisely what a curated-author model cannot do at scale. Demoting AI in the name of agency is, for this audience, demoting the only feature that prevents the app from quietly confirming the user's worst belief about themselves.

---

## Expert lens — Human-machine interaction researcher

What's happening to Noor is the textbook ownership-erosion arc, and the diagnosis is almost mechanical. She built a tool to surface ideas from a list *she had curated* — meaning every item carried prior personal endorsement, and the act of "tap, accept" was really "tap, recognise a past version of myself who wanted this." When she replaced authored items with Claude-authored ones, she swapped a recognition task for an evaluation task. Recognition is cheap and warm; evaluation is expensive and adversarial. The brain that used to think *"oh yeah, that"* now thinks *"is this any good?"* That single switch in cognitive stance explains the lazier, more critical, less motivated pattern she describes. It is the inversion of the IKEA effect: removing her authorship didn't just reduce the value she perceived in items, it actively recoded the items as *the system's offers to her*, which her critical faculties are then obligated to vet.

The novelty-decay part is generic — every AI feature shows a peak somewhere in sessions 3–8 and a 50–70% drop by sessions 20–30, well-documented in Copilot, Notion AI, Replika, and AI-writing-tool retention curves. But Noor's problem isn't novelty decay. Novelty decay is *boredom* with the AI; her problem is *contamination of the non-AI surface* by AI-authored content. That is specific to generative recommendations stored as persistent state. Curated (Spotify, TikTok) recommendations expire — the next session has new ones, so calibration is continuous and the system stays accountable. A generative * library* freezes a moment of AI output into the user's environment forever. There is no opportunity for repair behaviour; bad items just sit there, accumulating as evidence that "my list is full of stuf f I don't quite want," which corrodes trust in the entire pool, including the items she wrote herself.

Trajectory I'd predict for the as-shipped design:

- **Session 10:** Honeymoon. The AI list feels personalised, the variety masks misses.
- **Session 50:** Calibration drift. The user has now skipped the same 5–8 AI items repeatedly. Skip rate climbs. The signal "the app doesn't know me" starts to override "the app helps me." Users in this phase don't usually delete — they just open the app less.
- **Session 500:** Mostly attrition. Survivors either (a) heavily pruned the library by hand and now own it again, or (b) treat the app as a slot machine — low engagement, occasional re-engagement spikes that look like activity but aren't ownership.

Concrete recommendations I'd defend:

1. **Kill bulk AI generation as a library-population mechanism.** It's the single most damaging feature for long-term ownership and it's also the one Noor's friends fixated on, which is exactly the dynamic the literature predicts: substitutive AI gets disproportionate attention and disproportionately erodes the user's sense of authorship over the rest of the product.
2. **Invert the AI's role from generator to gardener.** Keep Mode 4 chat. Add an AI-as-pruner: "Je hebt deze 4 activiteiten 6 keer overgeslagen — wegdoen, verbergen, of houden?" This positions the AI as helping the user *defend* their list, not populate it. It's assistive, not substitutive, and every prune is an ownership act.
3. **Replace generation with elicitation in Mode 4.** When Mode 4 produces something the user likes, the save-to-list flow should ask the user to phrase the activity in their own words before storing. O ne sentence of paraphrase is enough to flip the authorship bit. This is the cheapest IKEA-effect intervention available.
4. **Add a "this one is mine" badge that's visually dominant.** Distinguish user-authored from AI-authored at the suggestion surface. Users need to *see* their authorship to feel it.
5. **Don't ship ambient ranking yet.** A learned ranker over a contaminated library will just learn to surface AI slop more efficiently. Fix the substrate first.

The single failure mode I'm most worried about if she ships as-is: **the app slowly becomes something the user consults rather than something the user owns.** Within 6 months, "Unwind suggested X" repla ces "I felt like X." That is exactly the TikTok-ification trajectory — agency outsourced one micro-decision at a time, with no single moment where the user notices it happening. The cruel part is that t he app would still test well on first-use metrics, and Noor would have built the precise dependency dynamic she was originally trying to relieve.

---

## Expert lens — General psychologist (motivation & behaviour change)

Noor's drift is textbook SDT, and it's diagnostic, not idiosyncratic. Autonomy in Deci & Ryan's sense is not "I get to choose from a menu" — it's "this action emanates from me." A list someone else (even a clever model) wrote *for* her is technically customised but psychologically heteronomous. The activities arrive pre-validated, so there's nothing for her to claim. The drop in motivation she describes — laziness, criticism, low engagement — is what happens when extrinsically supplied content displaces internally generated content: the locus of causality shifts outward, and intrinsic motivation evaporates with it. Competence is also degraded: if the app keeps producing serviceable ideas, the user never builds the meta-skill of *knowing what restores them*, which is the actual long-term protective factor. Relatedness barely figures here, and that's fine — this isn't a social product — but its absence means the only remaining motivational fuel is autonomy and competence, and the AI library is leaking both.

Is "they aren't really mine" generalisable? Largely yes, with a gradient. Autistic-gifted users feel it most acutely because they over-detect inauthenticity and have strong internal taxonomies the AI can't reproduce. But the underlying mechanism — that an automatically supplied solution undermines the user's sense of agency — is well-replicated across populations. Lisa and Daan will feel it less consciously and more slowly, but they'll feel it as boredom and drift rather than as critique.

The behavioural trajectory I expect for a typical user, absent changes: a strong week one (novelty + the base library doing its job), a tapering week two-three as suggestions begin to repeat or feel generic, and a hard cliff between week four and week six when the app becomes a *reminder of stress* rather than a tool against it. This is the modal retention curve for self-care apps; nothing in Unwind's current loop interrupts it. What predicts week-four retention in this literature is not feature richness — it's whether the app has produced a *felt experience of working* that the user can attribute to themselves. The current loop ("open, accept, do") doesn't generate that attribution because the app did the choosing. Without a reflective step where the user notices "that helped, and I picked it," t here is no competence accrual and therefore no compounding return. What predicts actual stress reduction (not just app opens) is implementation intentions ("when I notice X, I will do Y") and behavioura l activation patterns — both of which require the user, over time, to *learn their own map*, not consume someone else's.

Concrete recommendations, in increasing order of structural commitment:

- **Add a lightweight longitudinal layer.** A two-tap post-activity rating ("did this help? a lot / a bit / no") is the minimum viable competence-builder. Show the user, monthly, *their own* top-five. That single screen reframes the app from dispenser to mirror.
- **Reposition authorship from feature to spine.** "Add your own" should not be a menu item — it should be the conceptual centre, with AI demoted to a *coach* that interviews the user about what already works ("What did you do last Sunday that left you feeling settled? Want to save it?") rather than a generator. This is the SDT-clean version of AI in this product: it scaffolds the user toward their ow n list instead of replacing the act of listing.
- **Consider collapsing modes 2 and 3 into one filter on the suggest page.** Four modes is four front doors to the same room; it dilutes the habit. One door, deepened, beats four doors visited once each .
- **Reframe the product.** Not "an app that tells you what to do," but "an app that helps you learn what works for you." Same code, different promise — and the second promise is the one that survives month four.

The single risk I'm most worried about: the app gets opened twice, produces two adequate-but-forgettable suggestions, and is filed under "tried it." Without a reflective layer, Unwind has no mechanism by which use *becomes ownership*, and without ownership, every session is a cold start — which is exactly the state the depleted user opened the app to escape.

---

## Panel of users

Quick read at month two:

| Persona | Still using? | Added own? | Trust AI items? | Wants the app to be... |
|---------|-------------|------------|-----------------|------------------------|
| Sanne   | Yes, almost daily, Mode 1 only | No | Skips faster than base — they "land less" | Less generated, slowly grown from use |
| Daan    | Less, often swipes through | No, won't | Indistinguishable from base, all grey | One-tap "do more like this" after accept |
| Fatima  | Yes, low-effort routine | One, gave up mid-form | Base has "ribbels", AI is "netter, beleefder" | Observer not generator |
| Jeroen  | Yes, ~70% Mode 1 + 25% Mode 3 | Yes, 4 — admits it was control-need | Lower trust than day one, accept/skip data wasted | Data-driven weighted pool, AI as bootstrap only |
| Yuna    | Reflex, no curiosity left | No, never knew it existed | Too "designed", too smooth | AI as editor not supplier |
| Lisa    | ~1× per week, will churn | No, won't ever | Therapeutic in tone, not playful | Discovery / curation, not relaxation |
| Tom     | Less, flat use | No, can't and won't | "Too ambitious — schilderen, bel een vriend" | Push, not choice |

### Sanne — *autistisch, shutdown, sensorisch gevoelig*

Twee maanden. Eerlijk? Ik open de app nog steeds bijna elke avond, en dat zegt iets. Mode 1 is de enige knop die ik aanraak. Eén suggestie, ja of nee, geen denkwerk. Dat deel werkt. Het is een van de weinige apps op mijn telefoon die niet om iets vraagt wat ik niet heb.

Maar er is iets aan het slijten. In het begin voelde elke suggestie als een klein cadeautje — *"Vijf minuten op het balkon. Letterlijk niets."* — daar werd ik rustig van alleen al door het te lezen. Nu zie ik dezelfde zinnen langskomen en herken ik ze als tekst, niet meer als suggestie. Ik scroll er soms zo doorheen, drie keer overslaan, vier keer, en dan leg ik mijn telefoon weg. Niet omdat de suggesties slecht zijn. Omdat ze niet meer landen.

**De AI-activiteiten.** Hier word ik ongemakkelijk van. Ik weet welke het zijn — niet door een labeltje, gewoon door de toon. Ze proberen iets te zijn voor mij. *"Pak je grijze deken en ga bij het raam zitten, zonder doel."* Dat is té precies. Dat is iemand die mijn antwoorden uit de onboarding heeft gelezen en er een activiteit van heeft gemaakt. Het voelt niet als een suggestie, het voelt als een sp iegel die teruglacht. Bij de basis-activiteiten weet ik: dit is voor iedereen, ik mag dit weigeren. Bij de AI-activiteiten voelt skippen als mezelf afwijzen. Heb ik er eentje echt gedaan? Eén keer, denk ik. De rest sla ik over, sneller dan de basis. Ik vertrouw ze niet, maar ik kan ook niet uitleggen waarom niet.

**Eigen activiteiten toevoegen.** Nee. Ik wist niet eens dat het kon. En als ik het had geweten — typen, een formulier invullen, een categorie kiezen, een duur instellen — dat is werk. Dat is precies wa t ik niet kan om half acht 's avonds. Wat me misschien over de streep zou trekken: een knop die zegt *"Dit deed ik net, en het hielp"* nadat ik een activiteit heb afgerond. Geen formulier. Eén veld, twe e tikken. Het moment is direct na een activiteit, niet ervoor. Dan weet ik wat ik wil opslaan, want ik heb het net gevoeld.

**Eén ding dat anders moet.** Stop met genereren *voor* mij. Laat de app mij langzaam laten genereren, door wat ik dóé. Elke keer als ik een suggestie accepteer, eventueel een micro-vraag erna — *"Was dit iets voor jou?"* met ja/nee/sla over. Na zes maanden is mijn lijst dan voor 70% van mezelf, niet van een model dat denkt te weten wat een autistische vrouw in Utrecht leuk vindt. De basis-30 mogen blijven als vangnet. De AI mag helpen *als ik er om vraag*, niet als standaardlaag. Nu voelt het alsof iemand anders een kast voor me heeft ingericht en ik woon erin.

### Daan — *ADHD, rusteloos, impulsief*

**Hoe voelt het na twee maanden?**

Eerlijk? Ik open 'm nog wel, maar minder. De eerste twee weken was ik enthousiast — tap, tap, suggestie, klaar. Nu zit ik vaker in een soort swipe-modus: tik, lees twee woorden, skip, tik, skip, tik, sk ip. Vroeger was elke suggestie nieuw, nu zie ik dingen die ik al ken en dan zie ik mezelf denken "ja, doei." Met name 's avonds laat, als ik 'm écht nodig heb, swipe ik me door tien dingen heen tot ik ' m boos wegklap. Mode 1 is nog steeds het ding dat ik gebruik. De rest doe ik nooit. Mode 3 misschien één keer per twee weken als ik me schuldig voel over een hele dag schermtijd.

**De AI-activiteiten.**

Ik ben er kritisch op geworden. Op dag één voelde het persoonlijk: "wauw, die kent me." Nu zie ik ze als een tweede laag generieke shit naast de base list. Ze voelen niet meer van *mij* — ze voelen also f iemand mij heeft uitgelegd aan een chatbot. Ik weet niet eens meer welke 15 dat waren. Sommige zitten er gewoon tussen mijn andere, ik kan ze niet onderscheiden. Dat is misschien wel het rare: ik kan ze niet aanwijzen, dus ik kan ze ook niet weghalen. Ze zijn er gewoon, een beetje grijs, een beetje voorgekauwd. Ik doe ze niet vaker dan de rest, en ze raken net zo sleets.

**Eigen activiteiten.**

Nul. Ik heb niks toegevoegd. Eerlijk antwoord op je brutale vraag: nee, ik ga op zaterdagochtend geen vijf activiteiten zitten typen. Ik ga überhaupt nóóit een formulier invullen "voor later." Mijn brei n doet niet aan later. Wat me wél zou triggeren: als ik op een moment dat ik écht iets leuks aan het doen ben — gitaar pakken om 23:00, of een stomme YouTube tutorial — de app me kan vangen met één tap "dit was goed, onthoud." Geen formulier. Geen titel verzinnen. Geen duration kiezen. Eén knop, achteraf, in het moment. Dan misschien.

**Eén verandering.**

Schrap de AI-bulkgeneratie helemaal. Of zet 'm uit na de eerste maand. Wat ik wél wil: een knop ná een geaccepteerde suggestie — "dit werkte, doe er meer zoals dit" of "dit was kut, nooit meer." Geen st erren, geen schaal, twee knoppen. En laat de app op basis daarvan zelf nieuwe dingen voor me bedenken — niet 15 in één klap op dag één, maar één per week, stilletjes, in mijn lijst. Dan groeit het organ isch. Dan voelt het over een half jaar als míjn lijst, niet als een lijst die een AI me twee maanden geleden cadeau heeft gedaan en die ik nooit heb opgeruimd.

### Fatima — *ADHD + autistisch, burn-out, weinig energie*

**Twee maanden later — hoe is het?**
Eerlijk? Ik open hem nog. Niet elke avond, maar vaker dan ik dacht. Niet omdat het zo'n geweldige app is, maar omdat het *de minst zware optie* is om negen uur 's avonds. Instagram kost meer dan dit. Eé n tik, één kaartje. Dat overleef ik nog net. Dat is ook het hoogst haalbare compliment dat ik op dit moment kan geven aan iets digitaals.

Het is wél routine geworden, maar niet op de slechte manier. Meer zoals de waterkoker aanzetten. Ik denk er niet over na. Ik tik, ik lees, meestal doe ik het niet, soms wel. De keren dat ik écht iets do e zijn zeldzaam, maar het feit dat ik niet meer twintig minuten verlamd op de bank zit voor ik iets kies — dat is winst.

**AI-activiteiten.**
Die voelen na twee maanden niet meer "van mij". In het begin dacht ik: oh leuk, die snapt me. Maar nu zie ik het verschil. De basisactiviteiten — "Eén bureau, één aanrecht, één plank" — die *kennen* iet s. Die zijn geschreven door iemand die het heeft meegemaakt. De AI-dingen zijn… netter. Beleefder. "Maak een kopje muntthee en ga vijf minuten bij het raam zitten" — prima zin, maar het had ook in een b log kunnen staan. Het heeft geen ribbels.

Ik sla ze vaker over, ja. Niet bewust, gewoon: ze landen niet. Eén of twee zijn blijven hangen omdat ze toevallig pasten (iets met de kinderen voorlezen terwijl ik er zelf bij wegzak — die heb ik echt g ebruikt). De rest is achtergrondruis in mijn lijst geworden.

**Zelf toevoegen.**
Nee. Eén keer. Ik wilde "vijf minuten op het balkon, geen telefoon" toevoegen omdat dát het ding is dat écht werkt, en toen moest ik een duur invullen en categorieën aanvinken en ik dacht: laat maar. Sl oot de app.

Wanneer zou ik wél typen? Nooit op het moment dat ik de app gebruik. Dat moment ben ik op. Misschien — *misschien* — in het weekend op zondagochtend met koffie, áls de app me eraan herinnert dat een act iviteit goed werkte en vraagt of ik 'm wil bewaren. Dan tik ik op een knop. Niet typen. Bevestigen.

**Eén ding om te veranderen.**
Stop met genereren bij de start. Het voelt nu alsof iemand mijn boekenkast heeft volgezet met boeken die hij dácht dat ik leuk zou vinden, en nu durf ik ze niet weg te gooien. Laat me beginnen met die d ertig basisactiviteiten — die zijn goed — en laat de AI géén suggestielijst zijn maar een *opmerker*. Eén keer per week, op een rustig moment: "Je hebt drie keer 'op het balkon' geaccepteerd. Wil ik dat bewaren als jouw versie?" Eén tik, ja of nee. Dán wordt het mijn lijst. Niet omdat ik heb getypt, maar omdat de app heeft gezien wat ik al deed. Bouw mijn bibliotheek uit wat ik doe, niet uit wat een A I denkt dat ik zou willen.

### Jeroen — *autistisch, alexithymisch, patroon-gericht*

**Twee maanden later.** Ja, ik open hem nog. Niet elke dag, maar ongeveer drie tot vier keer per week, meestal tussen 21:00 en 21:30. Mijn vriendin heeft het inmiddels als trigger: ze zegt "pak even Unw ind" in plaats van "doe even iets anders." Dat werkt beter dan dat ik het zelf moet detecteren, want dat doe ik niet.

Modus 1 gebruik ik veruit het meest — schat 70%. Modus 3 doe ik bewust op dagen dat ik weet dat het Head-zwaar was (vrijwel elke werkdag), dus dat is dan een Hands- of Heart-suggestie. Dat is misschien 25%. Modus 2 heb ik na week één niet meer aangeraakt — ik wist op dag één al dat ik daar niks mee kan, en dat is niet veranderd. Modus 4 heb ik twee keer geprobeerd, gaf op bij het lege tekstveld. Mijn mentale model is inmiddels: dit is een **stateless dobbelsteen met een goed gecureerde pool**. Hij weet niks van mij, hij voorspelt niks, hij faciliteert alleen de keuze die ik niet kan maken. Dat is op zich prima — maar het is minder dan beloofd.

**AI-activiteiten.** Eerlijk: na twee maanden voel ik nog steeds een **breuklijn** tussen de basis-30 en de AI-15. De basislijst voelt geaard, specifiek, geschreven door een mens die snapt wat "één plan k opruimen" betekent. De AI-suggesties voelen iets gladder, iets meer generieke wellness-app — "neem een moment om bewust te ademen bij het raam." Dat soort dingen. Ik heb er drie of vier expliciet verw ijderd omdat ze emotioneel taalgebruik bevatten ("voel hoe je lichaam zich ontspant") — onbruikbaar voor mij. Vertrouwen in het AI-systeem: lager dan op dag één. Niet omdat het slechter is geworden, maa r omdat ik nu zie wat het niet doet — namelijk leren van mijn skip-patroon. Als ik 8 weken lang elke ademhalingsoefening skip, zou dat signaal moeten zijn. Het is geen signaal. Dat ondergraaft het idee dat de AI iets toevoegt wat de base list niet doet.

**Eigen activiteiten.** Ik heb er vier toegevoegd. "20 minuten aan LEGO Technic 42096 bouwen." "Mechanical keyboard schoonmaken." "Soldeerstation aan, één doorgeknipte kabel repareren." "Aquarium-filter doorspoelen." Heel concreet, heel ik. Voegde het toe waardevol? Ja en nee. **Ja**, omdat deze vier vaker geaccepteerd worden dan gemiddeld — wat logisch is, ik heb ze zelf gekozen. **Nee**, omdat ik ve rmoed dat ik dit deed uit controle-behoefte, niet omdat de pool een gat had. De AI had "bouw 20 minuten aan een LEGO set" ook gegenereerd als ik LEGO had genoemd in onboarding. Ik heb het ingevuld omdat ik developer ben en CRUD-interfaces vertrouwen wekken, niet omdat de suggesties zonder mijn input slechter waren.

**Eén structurele verandering.** De accept/skip-data wordt vastgelegd maar doet niks zichtbaars. Dat is principieel mis. Ik zou de drie lagen (base / AI-gegenereerd / user-added) **samenvoegen tot één p ool met herkomst-tag en een per-activiteit score op basis van geobserveerd gedrag** — accept rate, skip rate, tijd-van-dag patroon, recency. De randomizer in modus 1 wordt dan een gewogen sample uit die pool, met een explore/exploit-knop (af en toe iets met lage score om de signaalruimte open te houden). De AI-laag verdwijnt dan als aparte categorie — hij wordt een **bootstrap-mechanisme** voor de col d start en daarna niet meer relevant. Geen ruis, geen tweeklassen-systeem, en de accept/skip wordt eindelijk *gebruikt* in plaats van alleen *opgeslagen*. Dat is observable data, geen self-report. Preci es waar deze app op gebouwd zou moeten zijn.

### Yuna — *ADHD, designer, taalgevoelig*

**Twee maanden later.** Eerlijk? Hij is een meubelstuk geworden. Niet onaardig, gewoon... er. Ik open hem nog steeds, maar de nieuwsgierigheid is weg. Het is meer een reflex — moment van leegte, duim ga at naar het icoon. Modus 1 is en blijft mijn modus. Eén tik, één kaartje, klaar. Modus 3 gebruik ik soms nog, vooral op dagen dat ik weet dat ik te lang in Figma heb gezeten en mijn ogen schreeuwen om i ets met handen. Modus 2 heb ik volgens mij twee keer geopend in totaal. Modus 4 één keer per ongeluk.

**AI-activiteiten.** Hier wordt het oncomfortabel. In het begin vond ik ze leuk — *oh, hij snapt me, hij weet dat ik teken*. Maar na twee maanden zie ik het patroon. Ze klinken net iets te... afgemeten? Te "ontworpen". "Pak je schetsboek en teken vijf minuten zonder doel." Technisch klopt het, maar het voelt alsof iemand me beschrijft op een sollicitatieformulier. De basis-activiteiten hebben rafels — "Bankje, stoepje, balkon. Vijf minuten lucht." Dat is geschreven door een mens die *bestaat*. De AI-activiteiten zijn geschreven door iemand die mijn LinkedIn heeft gelezen. Ik skip ze sneller, ja. Nie t omdat ze slecht zijn, maar omdat ze geen *textuur* hebben. Ze voelen glad. En glad is het tegenovergestelde van wat ik nodig heb om af te schakelen.

**Zelf toevoegen.** Nee. Wist niet eens dat het kon, eerlijk gezegd. En als ik een knop had gevonden die zei "voeg activiteit toe" — ik denk dat ik 'm had genegeerd. Dat klinkt als werk. Als een formuli er. Maar als de app me ooit zou vragen "wat heb je vandaag gedaan dat goed voelde?" of "wat deed je vroeger op zondagmiddag dat je nu vergeten bent?" — dan zou ik typen. Niet omdat het invullen is, maar omdat het *iets aanraakt*. Het verschil tussen een formulier en een gesprek is alles.

**Eén structurele verandering.** Conceptueel vind ik de AI-laag op een verkeerde plek zitten. De AI heeft mijn lijst *gemaakt* en daarna is hij weg. Dat is het probleem. De AI is een ghostwriter geworde n in plaats van een gesprekspartner. Ik zou het omdraaien: laat de basis-30 met rust, schrap de auto-gegenereerde 15, en laat de AI in plaats daarvan *naast* mijn lijst leven — als een soort spiegel. "J e hebt drie keer 'collage' geskipt — wil je 'm weg of moet ik 'm anders formuleren?" of "Je accepteert vaak iets met handen na een Figma-dag — heb je daar zelf nog ideeën bij die ik mis?" Dan ben ik nie t meer ontvanger maar auteur, en de AI is geen leverancier maar redacteur. Dat is conceptueel iets heel anders. Nu is mijn lijst van de app. Zo zou hij van mij worden.

### Lisa — *neurotypisch, polish-bewust*

**Twee maanden later.** Eerlijk? Ik open 'm nog ongeveer één keer per week, meestal zondagavond als ik die "ik zou iets moeten doen maar ik weet niet wat"-onrust heb. Het is geen gewoonte geworden — mee r een soort tool waar ik aan denk als ik mezelf betrap op de zoveelste reel. Soms drie keer in een week, soms twee weken niets. De drempel is laag, dat helpt. Maar ik mis een reden om de app uit zichzel f te openen. Geen notificatie, geen streak, geen "vandaag gedaan"-vinkje. Andere apps geven me een aanleiding om terug te komen, deze niet. Dat is misschien een feature voor de ND-doelgroep, maar voor m ij voelt het alsof de app me een beetje vergeet zodra ik 'm sluit.

**AI-activiteiten.** Hier zit mijn grootste teleurstelling. Toen ik die AI-flow deed verwachtte ik iets in de richting van "Lisa-specifiek" — passend bij wat ik had ingevuld over werk, sport, mijn relat ie. Wat ik kreeg was vooral een betere versie van de base list. "Maak een kop thee en ga op je balkon zitten." Prima geschreven, maar ik had dit zonder de AI-stap ook gekregen. Het voelt niet zozeer "vo or mensen-met-problemen" — daar ben ik niet bang voor — maar wel een beetje *therapeutisch* in toon. Heel veel "rust", "vertragen", "niets doen mag". Mijn probleem is niet dat ik mezelf geen rust *gun*, mijn probleem is dat ik niet weet *wat* nu eens iets anders is dan een podcast of de sportschool. Ik mis een speelse laag. Iets dat een vriendin ook zou voorstellen op een dinsdag: "ga eens naar die en e kleine bioscoop", "probeer keramiek bij dat ding in Den Haag". De AI weet alleen mijn stress-context, niet mijn smaak-context.

**Eigen toevoegen.** Nee. En nee, ik ga dat niet doen. Op een dinsdagavond ga ik geen activiteiten zitten typen voor een app — dan ben ik dúrven-niksdoen aan het uitstellen door productief te zijn in de niksdoen-app. Wat me wél over de streep zou trekken: als de app na een geaccepteerde activiteit zou vragen "was dit goed? wil je iets soortgelijks vaker?" en dat zelf zou omzetten in nieuwe varianten. Of: importeer ideeën uit een Pinterest-board, een Spotify-playlist, een agenda. Niet *ik* die typt — de app die uit mijn bestaande digitale leven dingen oogst.

**Eén structurele verandering.** Maak hem leuker, niet rustiger. Op dit moment is Unwind een wellness-tool met goede copy. Voor mij zou hij interessanter zijn als hij richting *curator* gaat: lokale din gen (festivals, expo's, een nieuwe wandeling in de duinen), seizoensgebonden suggesties, dingen die ik nog niet ken. Dat is wat mainstream-mensen zoeken op zondagavond — niet *minder* doen, maar *iets a nders* doen. Eerlijk: als de app zo blijft, verdwijnt hij over drie maanden van mijn telefoon. Niet omdat hij slecht is, maar omdat hij me niets nieuws meer geeft. De vraag is denk ik of jij dat erg vin dt — als ik niet de doelgroep ben, prima. Maar als je ook mensen zoals ik wil houden, moet er een ontdekkings-laag bij die nu volledig ontbreekt.

### Tom — *burn-outherstel, anhedonie, lage activatie*

**1. Twee maanden later.**

Eerlijk? Ik open hem nog wel, maar minder dan in het begin. In week één was er nog dat "oh, iets nieuws"-gevoel — niet enthousiasme, maar iets. Dat is weg. Het is nu meer een tik op het scherm in de mid dag, zoals ik ook mijn telefoon ontgrendel zonder reden. Mode 1 is het enige wat ik gebruik. Mode 2 heb ik twee keer geprobeerd, ik wist niet wat ik moest invullen — ik ben niet gestrest, ik ben gewoon plat. Mode 3 vraagt wat ik vandaag heb gedaan, en het antwoord is meestal niks, dus dan ben ik er ook al uit. Mode 4 ben ik één keer ingegaan, heb naar het lege veld gekeken, en ben weer weggegaan.

Werkt het nog? Soms. Eén op de vier keer doe ik wat de app zegt. De andere drie keer tik ik door tot er iets komt wat klein genoeg lijkt, en dan leg ik de telefoon weg en doe ik het toch niet. Maar ik w eet niet of dat de schuld van de app is.

**2. AI-activiteiten.**

Nee, die voelen niet van mij. En ja, ik sla ze vaker over dan de basis. De basis zit ergens tussen "uit het raam kijken" en "tien minuten muziek" — daar kan ik soms iets mee. De AI-dingen zijn precies w aar je bang voor was: "ga schilderen met waterverf", "stuur een vriend een spraakbericht", "maak een korte wandeling en let op de geluiden". Het klinkt allemaal als iets wat ik vroeger leuk had moeten v inden. Of als iets wat mijn psycholoog zou zeggen. Het is niet fout, maar het is ook niet voor de Tom die nu in de bank zit.

Het rare is: ik weet niet eens meer welke door de AI is gemaakt en welke basis is. Ze lopen door elkaar. Het is gewoon een lijst die ik niet helemaal vertrouw.

**3. Eigen toevoegen.**

Nee. Ga ik niet doen. Niet nu, niet over twee maanden. Activiteiten gaan zitten typen veronderstelt dat ik weet wat ik leuk vind, en dat is precies het probleem waarvoor ik de app open. Als ik dat lijst je kon maken, had ik de app niet nodig.

Wat zou er moeten gebeuren? Misschien dat de app *na* een activiteit vraagt: "Hielp dit?" Eén tik. En na een tijdje zegt: "Je hebt drie keer 'rondje om het blok' gedaan en het hielp. Wil je een soortgel ijke toevoegen?" Dan voegt de app het toe, niet ik. Bevestigen is wel iets wat ik kan. Verzinnen niet.

**4. Eén structurele verandering.**

Stop met aannemen dat de gebruiker iets wil ontspannen. Sommige van ons zijn al zes maanden ontspannen, zogenaamd, en dat is de hel. Ik heb geen unwind nodig, ik heb een duwtje nodig. Een hele kleine. I ets als: "Het is half drie. Hier is iets dat vijf minuten duurt." Geen vraag vooraf. Geen modus kiezen. Gewoon: de app weet dat ik 's middags alleen thuis ben en duwt me één keer.

Of, eerlijker: misschien is dit gewoon niet de app voor mijn fase. Unwind gaat over kiezen-uit-iets-doen. Ik zit in een fase van iets-doen-überhaupt. Dat is een ander probleem. Als jullie er één app van willen maken die beide dekt, prima, maar dan moet de toon en de aanname veranderen. Anders ben ik over een half jaar weg, niet omdat de app slecht is, maar omdat hij over iemand anders gaat.

---

## Recommendations

Ordered by strength of panel endorsement.

### Strongly endorsed (4+ lenses, including converging persona evidence)

1. **Remove the bulk AI generation as an onboarding step.** Land new users on the suggest page with the base library only. Keep the AI-generate flow alive in the menu as a *user-triggered* feature, not a default. This is the single most important move in the report.

2. **Replace "Add your own" with "Save this one."** The CRUD form already exists — keep it for power users (Jeroen). But the *default* authorship surface should be a post-acceptance tap: "Hielp dit? Wil je dit als jouw versie bewaren?" One field, two taps, anchored at the moment the activity was actually felt. Six of seven personas explicitly endorsed this exact move.

3. **Use the accept/skip data.** Move Mode 1 from uniform-random to a weighted sample over the pool (recent accepts up-weighted, repeatedly-skipped items down-weighted). Optionally add a small "explore" budget. This is invisible to the user but it is the principled fix for the "list of stuff I don't quite want" complaint.

4. **Collapse Modes 2 and 3 into filter affordances on the suggest surface.** Three modes are one mode with different filters. Make Mode 1 the app; expose stress and counterbalance as optional filter sh eets, not parallel doors. If Mode 3 stays, **swap Head/Hands/Heart for concrete tappable prompts** with picture support ("wat was je net aan het doen?" → screen / talking / cleaning / resting / nothing) .

5. **Reframe Mode 4.** Drop the open chat. Keep AI, but as a *structured interviewer* whose job is to walk the user toward authoring 1-3 activities of their own per session — AI scaffolds authorship ins tead of replacing it. Tappable answers, no empty text field. (Yuna, Tom, and Fatima all bounced off the empty field; nobody used it productively.)

6. **Add a two-tap "did this help?" after every accepted activity.** Two states, not five. Use it to feed the weighting in #3 and to build a monthly "your top five" mirror screen for the user (gen-psych 's competence-builder).

### Endorsed (2-3 lenses)

7. **AI-as-pruner mode in the menu.** "Je hebt deze 4 activiteiten 6 keer overgeslagen — wegdoen, verbergen, of houden?" Every prune is an ownership act. HMI and giftedness specifically endorse this.

8. **Soft library cap (~25 items).** Force a swap to add a 26th. Constraint is felt as care for the gifted brain. (Giftedness lens.) Less critical for other audiences — could be a setting.

9. **Visually distinguish provenance.** Show which activities are user / base / AI-generated. Helps Daan ("I can't even tell them apart, can't remove them") and creates the badge HMI proposes.

10. **Reframe the content principle from "activities you like" to "activities you have done and want to do again."** Past-tense evidence raises the bar for entry and kills phantom-aspirational items. Th is is a writing/UX principle, not a feature change.

### Open questions for Noor

These are not panel recommendations — they are decisions only Noor can make, but they shape which subset of the above to ship.

11. **Who is the primary audience?** The recommendations above optimise for the gifted-ND quadrant (Noor's own). They actively conflict with the avg/below-IQ psychologist's lens, which would prescribe * more* AI generation, not less. The two directions are not reconcilable inside one library model. Without a deliberate audience decision, the design will drift between them and serve neither well.

12. **Is the app for *choosing* or for *being pushed*?** Tom's lens proposes a fundamentally different shape — time-aware, assertive micro-pushes for anhedonic and burnout-recovery users. This could be a setting ("ik wil een duwtje, geen keuze"), a separate mode, or out of scope. The current accept/skip model assumes the user wants the choice; for ~20% of the realistic ND audience that assumption is w rong.

13. **Is Lisa in scope?** Mainstream NT users want discovery, not wellness. Serving them requires curated/external content (local events, seasonal variety, smaller-bioscoop tips) that does not currently exist and would re-introduce the curated-by-someone-else dynamic the ND audience rejects. **Most likely answer: out of scope, ND-first.** Worth saying so explicitly so the tone decisions stop being amb iguous.

14. **What is the longitudinal layer?** Multiple lenses (gen-psych, ND, HMI) flag that without a reflective/longitudinal layer the app is a stateless dispenser and will not produce competence accrual. T he simplest version is the monthly "your top five" mirror screen, fed from the two-tap rating in #6. The richer version is implementation intentions ("when I notice X, I will Y"). Worth deciding the flo or.

---

## What to keep

Strongly preserved across the panel:

- **The base library copy.** Sanne, Yuna, Fatima and Jeroen all explicitly contrast the "rafels" / "textuur" / "ribbels" of the base activities against the smoother, more clinical AI output. **Whatever the long-term direction, do not replace the base activities with AI-rewritten versions** in the name of personalisation. The hand-written quality *is* the personalisation.
- **The Mode 1 loop.** Open app → one card → accept or skip. Universal endorsement; do not redesign the moment-of-need flow. Redesign what feeds it.
- **Duration tags.** Avg/below-IQ psychologist calls them "the most clinically valuable feature in the whole app." Everyone implicitly relies on them. Keep them on every activity, including any new user -authored ones.
- **The base of 30 itself.** Multiple personas use them as the floor and trust them more than the AI batch. They are the asset; protect them.

---

## Sanity check on Noor's diagnosis

The panel's overall verdict on Noor's self-report: **she's right, more right than she suspects, and her reaction is substantially generalisable — but not universally.** The pattern she's named (authorsh ip collapse / autonomy leak / IKEA-effect inversion) is a real and replicable mechanism that erodes engagement across audiences, with severity scaled by criticality temperament. It is not just gifted-qu irkiness. The lone audience where her instinct is *materially wrong* is the average-and-below-IQ user, for whom AI generation is the only realistic library-growth mechanism. That audience may or may not be in scope.

What she should stop doing: arguing with friends about whether the AI activities are "good." The currency is provenance, not quality, and the conversation gets stuck on the wrong axis every time.

What she should start doing: treating "the AI generated my library" as the diagnosis, not "the AI suggestions are off." The fix is structural — change *what the AI does* — not editorial.




## EDIT: 

I have some questions about 004-app-purpose-and-flow. Would the verdict of the panelists change if they knew that 1. users are not funneled through onboarding, it is a feature that they can use optionally for growing their    library. and 2. the base activities are also AI-generated, only they were generated a while ago and then hard coded into the app.                                                                                             
  
● Both are meaningful framing errors. Some verdicts shift, others survive intact. Going through them:

  Fact 1 — Onboarding is optional, not a funnel

  What changes:

  - The headline recommendation ("Drop the bulk AI generation as an onboarding step") is largely moot — it's already not a default.
  - The personas' scenarios are wrong in one important way: most of them were told they'd done the AI flow on day one. If they'd known it was opt-in, Fatima and Tom probably wouldn't have tapped it (too much effort), Lisa
  might have out of curiosity, Sanne probably wouldn't have noticed it existed. Their month-two libraries would mostly just be 30 base activities, and their complaints would have been "the base library got stale" rather than 
  "the AI activities feel off."
  - The avg/IQ psychologist's dissent softens partly but not fully: AI generation already exists as an optional feature, so the population that needs it can use it. But their critique that it needs to be prominent,
  repeatable, and friendly still stands — an optional feature that's hidden in a menu is functionally the same as not having it for users with weaker self-monitoring or executive function.

  What survives:

  - The deeper analysis — what happens to a user's relationship to their library after they run the feature — still applies fully to anyone who taps it. Noor's own report is exactly this case: she ran the flow (back when it  
  was an onboarding step) and her library is now AI-heavy.
  - The architectural recommendations (use accept/skip data; collapse modes 2/3 into filters; AI as gardener) don't depend on whether the AI batch is mandatory.
  - The "library can't tell what's yours" problem (Daan) is independent of when it was added.

  Framing should shift from "stop funnelling users into an ownership-corrosive flow" to "the optional flow corrodes ownership for anyone who runs it — decide whether to keep, redesign, or replace it." The architectural fix   
  doesn't change.

  Fact 2 — The base activities are also AI-generated

  This is the more interesting one, and it materially undermines a piece of the panel's analysis that several voices leaned on heavily.

  What it reveals:

  Four voices — Sanne, Fatima, Yuna, Jeroen — explicitly praised the base library for "having ribbels / textuur / being geschreven door een mens die bestaat" and contrasted that against the smoother personalised AI
  activities. They were wrong about provenance. Which means their critique wasn't actually about AI vs. human — it was about something else they misattributed.

  The likely real axes:

  1. Curation and editorial filter. The base activities went through Noor's editing — she shaped them, picked which ones to keep, probably rewrote phrasing. The personalised AI activities are raw model output. The panel's    
  "ribbels vs. glad" distinction is mostly the difference between edited content and fresh model output.
  2. Shared/canonical vs. individual. The base library reads as "for everyone" — a curated set the user is borrowing from a collective. That lowers the criticality bar (it's not making a claim about me). Personalised
  activities read as "for me specifically" — they make an identity claim, which the brain then evaluates harder. Sanne's "bij de basis-activiteiten weet ik: dit is voor iedereen, ik mag dit weigeren. Bij de AI-activiteiten   
  voelt skippen als mezelf afwijzen" maps to this exactly — and it has nothing to do with whether either was AI-written.
  3. Static vs. just-now. The base activities have been in the app long enough to acquire a "they were always there" quality. The personalised ones are timestamped to a specific moment of being generated for this user, which 
  makes them feel more synthetic.

  What this does to the report's verdicts:

  - The giftedness lens's "provenance is the currency, not quality" claim partially breaks. If AI-authored content reads as good when curated and shared, then provenance isn't a single axis — quality + editorial care + the   
  "this is for everyone" framing can compensate. The right reframe: unedited, individualised AI content is what corrodes — not AI content per se.
  - The HMI lens's "contamination of the non-AI surface by AI-authored content" argument largely breaks in its strong form. The "non-AI surface" was already AI. The real contamination axis is unedited personalised output     
  sitting permanently in your library, not AI-presence itself.
  - The recommendation "AI-as-gardener, not AI-as-generator" still stands but the framing is sharper: it's not that AI shouldn't generate, it's that AI generation needs an editorial filter before content enters the user's    
  library — either by you (curated additions to a shared library) or by the user themselves (the verbatim-paraphrase model from review 005).
  - The "save this one in your own words" recommendation is reinforced — that's effectively the user as their own editor.

  Two new design directions this opens up:

  - Expand the curated shared library, not the personalised one. If users praise the base activities, generate more of them — by you, edited by you, shared across all users. That solves the library-growth problem the avg/IQ  
  lens worried about without producing personalised slop.
  - Edit before delivering. If personalised AI generation stays, run it through a second pass (different prompt, "rewrite this in three words, present tense, no wellness language") before the activity enters the user's       
  library. The "ribbels" the panel praised are at least partly an artifact of editing, and you can probably manufacture that on-demand.

  Net verdict

  Most of 004's recommendations still hold, but with sharper framing:

  - Architectural changes (use the data, collapse modes, retrospective authorship) — unchanged
  - "AI is ownership-corrosive" — should be "unedited, individualised AI output is ownership-corrosive." That's a different claim with different implications
  - Personas' praise of the base library as "human" should not be taken as evidence that AI is bad — it's evidence that editing matters, and that shared/canonical framing changes how content is received

  The base-activities fact is the more important of the two. Worth dropping a one-paragraph editor's note at the top of 004 noting both corrections, particularly the second — the panel was making strong claims about
  provenance that don't hold up given the reality.