# Review 001 — General Concept

**Date:** 2026-04-16
**Scope:** General app concept, all four modes, navigation, activity content
**Reviewed by:** All 7 personas (Sanne, Daan, Fatima, Jeroen, Yuna, Lisa, Tom)

---

## Verdict Spread

| Persona | Would use regularly? | Primary mode | Biggest blocker |
|---------|---------------------|--------------|-----------------|
| Sanne   | Yes (Mode 1 only)   | Mode 1       | Mode selection requires decisions she can't make |
| Daan    | Yes (if pool grows) | Mode 1       | 26 activities runs out in days |
| Fatima  | Yes (Mode 1 only)   | Mode 1       | Navigation itself is keuzestress |
| Jeroen  | Yes                 | Mode 1 + 3   | Mode 2 is unusable (alexithymia) |
| Yuna    | Maybe               | Mode 1       | Too many tabs, "Stress" label is confronterend |
| Lisa    | No (not yet)        | Mode 3       | No onboarding, visually flat, feels unfinished |
| Tom     | Probably not        | Mode 1       | App assumes overstimulation, not depletion |

**Summary:** 4/7 would use it regularly, all via Mode 1. 1 would use it conditionally
(Yuna). 2 would not currently (Lisa, Tom). Nobody's primary mode is Mode 2 or Mode 4.

---

## Cross-Persona Issues (flagged by 3+ personas)

### 1. Four-tab navigation is itself a decision — flagged by 6/7

Sanne, Daan (implicitly), Fatima, Yuna, Lisa, Tom all noted that presenting four modes
as equal tabs forces a choice on users who opened the app *because they can't choose*.
Mode 1 is the obvious default — every persona gravitates to it — but the navigation
treats all four modes as equally important entry points.

**Recommendation:** Make Mode 1 the default landing. Consider hiding Modes 2-4 behind
a secondary interaction (swipe, settings, or a "meer opties" path) rather than giving
them equal nav weight.

### 2. Activity pool is too small (26 activities) — flagged by 3/7

Daan (explicitly: "na drie avonden op"), Sanne (implicitly: "Geen nieuwe suggesties
meer" feels like failure), Jeroen (without learning, it stays a randomizer). For
skip-heavy users like Daan, 26 activities means the app is exhausted within days.

**Recommendation:** Priority for Chunk 9-10 (onboarding/AI-generated activities) and
the memory layer. The pool needs to grow per-user over time.

### 3. Mode 2 stress scale doesn't map to real experience — flagged by 5/7

Sanne (can't quantify in shutdown), Daan (would pick randomly), Fatima (baseline is
always stressed), Jeroen (alexithymia — literally cannot self-assess), Tom (his problem
is emptiness, not stress). The 1-5 scale assumes users can accurately rate their stress,
which is exactly what most of the target audience struggles with.

**Recommendation:** Consider alternative inputs: physical signals ("Zit je schouders
hoog?"), binary choice ("Te veel in mijn hoofd" vs "Kan niks voelen"), or skip the
self-assessment entirely and infer from behavior.

### 4. Chat (Mode 4) requires typing — dealbreaker for depleted users — flagged by 5/7

Daan (won't type when restless), Fatima (types slowly, one-handed), Jeroen (blank
field is a wall), Lisa (no prompt suggestions), Tom (brain fog makes forming sentences
hard). The open text input is the highest-friction interaction in the app.

**Recommendation:** Add quick-reply buttons, conversation starters, or pre-set opening
prompts. Reduce typing to a last resort, not the only option.

### 5. "Veel plezier!" tone after accepting — flagged by 3/7

Fatima (triggers guilt if she doesn't follow through), Yuna (feels like "mijn moeder"),
Tom (hasn't had fun in six months — tone-deaf for anhedonia). The phrase assumes a
positive outcome and energy that depleted users don't have.

**Recommendation:** Something that acknowledges the step without assuming the outcome.
"Goed bezig" or just the activity title with a checkmark. Less cheerful, more neutral.

### 6. No onboarding — flagged by 2/7 explicitly, affects all

Lisa (no idea what the app does or who it's for), Tom (won't discover modes on his
own). The app drops users into Mode 1 with no context about what the four modes are
or when to use them.

**Recommendation:** Brief onboarding or a first-time tooltip flow. Doesn't need to be
long (Daan and Fatima would abandon anything over 60 seconds), but needs to exist.

### 7. Activity descriptions are excellent — praised by 7/7

Every single persona called out the activity descriptions as the app's strongest
asset. "Eén bureau, één aanrecht, één plank. Dat is de hele taak." and "Letterlijk
niets. Bankje, stoepje, balkon. Vijf minuten lucht." were highlighted repeatedly.
The tone is warm, specific, bounded, non-judgmental.

**This is the voice of the app. Do not change it.**

---

## Unique Issues (flagged by 1-2 personas, still worth noting)

| Issue | Persona | Severity |
|-------|---------|----------|
| Category chips on ActivityCard are visual clutter | Sanne | Medium — noise for sensory-sensitive users |
| "Stress" as a nav label is confronterend | Yuna, Lisa | Medium — consider "Energie" or softer framing |
| Mode 3 doesn't work if you did nothing today | Tom | High for burnout users — no "none" option |
| Mode 3 categories are ambiguous (is Figma work Head or Hands?) | Yuna, Jeroen | Low — could add examples/tooltips |
| "Geen nieuwe suggesties meer" feels like failure/judgment | Sanne, Daan, Lisa | Medium — dead end with no recovery path |
| No icons on nav tabs | Lisa | Low — polish issue |
| No animations/transitions between cards | Lisa | Low — polish, but contributes to "unfinished" feel |
| "Opslaan in mijn lijst" — what list? Where? | Yuna | Low — feature discoverability gap |
| Chat needs conversation starters, not blank input | Jeroen, Lisa, Tom | High — 3 personas can't get past the empty field |

---

## Design Conflicts

### Self-assessment vs. zero-effort entry
- **Modes 2 and 3** add value through personalization (stress filtering,
  counterbalance) but require self-knowledge that most ND personas lack in the
  evening.
- **Resolution:** Keep the modes but don't make them equal entry points. Mode 1
  (zero-assessment) should be the clear default. Modes 2-3 are power-user features.

### Activation vs. relaxation framing
- **Tom** needs the app to help him *start* doing something (activation). The rest
  need help *stopping* (relaxation/unwinding).
- **Resolution:** The app name is "Unwind" (relaxation-coded), but the activity pool
  already includes activation activities (walking, dancing, tidying). The framing
  and copy lean relaxation-heavy. Consider whether the system prompt and mode labels
  can be more neutral.

### Jeroen loves Mode 3, Tom/Fatima can't use it
- Mode 3's fact-based input (what you *did*) is perfect for alexithymic users but
  excludes people who did nothing or everything.
- **Resolution:** Add a "Weet ik niet" or "Niks eigenlijk" option that falls back
  to Mode 1 behavior.

---

## Priority Actions

Ranked by how many personas are affected and severity:

1. **Make Mode 1 the default, reduce nav prominence of other modes** (6/7 affected)
2. **Add quick-reply / conversation starters to Chat** (5/7 affected)
3. **Rethink stress scale — less granular, alternative inputs** (5/7 affected)
4. **Grow activity pool via AI generation / onboarding** (3/7 affected, existential
   for retention)
5. **Soften "Veel plezier!" copy** (3/7 affected)
6. **Add minimal onboarding** (2/7 explicit, all affected implicitly)
7. **Rename "Stress" tab label** (2/7 affected)

---

## Individual Reviews

Full reviews from each persona are included below for reference.

---

### Sanne (autistic, sensory-sensitive, shutdown)

**Would use:** Yes, Mode 1 only.

Four tabs at the bottom — four decisions before I've started. When I'm in shutdown,
I don't know *which mode I need*. The app asks me to categorize my own state before
it helps me.

**Mode 1:** This is the one I'd use 90% of the time. One card, two buttons —
manageable. The category chips are extra visual noise I didn't ask for.

**Mode 2:** Five numbered buttons to quantify stress I can barely perceive. Adds a
decision *before* the suggestion. I'd skip this mode entirely.

**Mode 3:** "Wat heb je vandaag veel gedaan?" requires executive function I don't have
at 19:30. Clever concept, wrong timing.

**Mode 4:** A text input field. I have to *think of what to type*. If I could
articulate what I need, I wouldn't need this app.

**Top 3:** (1) Mode selection requires decisions she can't make — default to Mode 1.
(2) Stress 1-5 too granular for shutdown. (3) Category chips are visual clutter.

**Keep:** The activity descriptions — warm, low-pressure, specific.

---

### Daan (ADHD, restless, speed-oriented)

**Would use:** Yes, if the pool grows.

Vier tabs, geen onboarding, meteen iets doen. Goed. Mode 1 is basically Tinder
voor activiteiten en dat werkt voor mijn brein.

**Mode 1:** 26 activiteiten is na drie avonden op. "Geen nieuwe suggesties meer" =
ik kom niet meer terug. Duration chips are useful — anything over 15 min gets skipped.

**Mode 2:** Extra tap compared to Mode 1. If I'm wired, I don't want a self-assessment
form first.

**Mode 3:** Requires reflection I don't have at 23:00.

**Mode 4:** Typen? Nee. Restless thumbs want to tap, not compose sentences.

**Top 3:** (1) 26 activities is veel te weinig — pool exhaustion kills retention.
(2) Chat requires typing — dealbreaker. (3) Mode 3 requires too much self-reflection.

**Keep:** Mode 1's one-card-two-buttons interface. Exactly how his brain works when
tired.

---

### Fatima (ADHD + autistic, burnout, constraints)

**Would use:** Yes, Mode 1 only.

Vier knoppen is al een keuze te veel om negen uur 's avonds. "Doen" klinkt als
commitment — triggers guilt if she doesn't follow through. "Geen nieuwe suggesties
meer" voelt als falen.

**Mode 1:** Closest to what she needs. One card, no list.

**Mode 2:** Baseline is always stressed. Always picks 3. Scale is meaningless.

**Mode 3:** "Wat heb je vandaag veel gedaan?" — everything. Can't pick one category.

**Mode 4:** Types slowly, one-handed. Chat is for people with energy.

**Top 3:** (1) Navigation itself is keuzestress — Mode 1 should be default. (2) Mode 3
requires self-analysis she can't do at 21:00. (3) Mode 4 unusable without voice/buttons.

**Keep:** Activity descriptions. "Eén bureau, één aanrecht, één plank. Dat is de hele
taak." — the only app text that ever truly understood her.

---

### Jeroen (autistic, alexithymic, pattern-oriented)

**Would use:** Yes, Modes 1 and 3.

Logisch opgezet. Four doors to the same goal — respectful to how his brain works.
Sometimes knows what he did (Mode 3), sometimes knows nothing (Mode 1).

**Mode 1:** Would use 80% of the time. Binary choice, no self-assessment. But without
learning from his accept/skip patterns, it stays a randomizer.

**Mode 2:** "Hoe gestrest ben je?" — literally cannot answer. Alexithymia means this
question has no answer. Biggest blocker in the app.

**Mode 3:** This is smart. "What you did" is a fact, not a feeling. Observable data
instead of self-report. Best design decision in the app.

**Mode 4:** If the AI asks "hoe voel je je," he's gone. If it asks about behavior, it
could work.

**Top 3:** (1) Mode 2 is unusable for alexithymic users — needs alternative inputs.
(2) No learning curve — app should remember accept/skip patterns. (3) Chat needs
prompts, not a blank field.

**Keep:** Mode 3. Fact-based input without emotional language.

---

### Yuna (ADHD, design-sensitive, language-aware)

**Would use:** Maybe, if it evolves.

"Unwind" is chill, not a "MindBalance Pro" vibe. Activity descriptions are warm
and spot-on. But four tabs is too much choice for a choice-reducing app. "Stress"
as a tab label is confronterend.

**Mode 1:** Simple, what she needs. "Veel plezier!" feels like her mother.

**Mode 2:** "Relaxed" as lowest option — if she were relaxed, she wouldn't be here.

**Mode 3:** Hoofd/Handen/Hart is intuitive but ambiguous without examples. Is Figma
work Head or Hands? Triggers perfectionism.

**Mode 4:** "Aan het nadenken..." is cute once, irritant the tenth time. "Opslaan in
mijn lijst" — which list? Where?

**Top 3:** (1) Four tabs is too much choice. (2) "Stress" as label is confronterend.
(3) No explanation for Head/Hands/Heart categories.

**Keep:** Activity descriptions. "Geen doel, geen vaardigheid nodig" — the voice of
someone who gets it.

---

### Lisa (neurotypical, polish expectations)

**Would use:** Not yet — needs more polish.

No onboarding. No idea what the app does or who it's for. Feels like a developer
prototype, not a consumer app. Visually flat — no icons, no transitions, no
micro-interactions.

**Mode 1:** Activity descriptions are genuinely good. But "Veel plezier!" in plain
text after accepting feels anticlimactic. Dead end at exhaustion.

**Mode 2:** Blunt. No explanation of how stress maps to activities.

**Mode 3:** Most interesting mode conceptually. Head/Hands/Heart is clever.

**Mode 4:** Decent chat UI but empty field is intimidating.

**Top 3:** (1) No onboarding. (2) Visually flat and lifeless. (3) "Stress" as tab
label is alienating.

**Keep:** Activity descriptions — the tone is the app's biggest asset.

---

### Tom (burnout recovery, low activation, anhedonia)

**Would use:** Probably not yet.

The app thinks its user is overstimulated and needs to wind down. Tom is
understimulated and needs a reason to move. Half the modes have no entry point for him.

**Mode 1:** "Ga een rondje lopen" — he already knows that. "Veel plezier!" after
accepting — hasn't had fun in six months.

**Mode 2:** "Relaxed" to "Heel gestrest" — he's neither. He's empty. The scale misses
burnout entirely.

**Mode 3:** "Wat heb je vandaag veel gedaan?" — nothing. No option for a day with
nothing in it.

**Mode 4:** Best potential mode for him (AI could ask questions), but blank text field
with brain fog = closed app.

**Top 3:** (1) "Veel plezier!" is tone-deaf for low-energy users. (2) Stress scale
misses depletion/emptiness. (3) Every mode assumes you did something today.

**Keep:** Activity descriptions. "Dat is de hele taak." does more therapeutic work
than most wellness apps' entire onboarding.
