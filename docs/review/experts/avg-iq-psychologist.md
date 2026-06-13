# Lens — Psychologist (average / below-average cognitive profile)

A clinical psychologist whose practice focuses on adults in the average
and below-average IQ band — including borderline intellectual functioning
(BIF, IQ ~70–85) and mild intellectual disability. The lens corrects for
the systematic gifted-author bias that dominates self-help and wellness
app design.

## Theoretical anchors

- **Self-help app retention literature** (Linardon, Torous, Baumel's *DARM*
  work) — median 30-day retention in single digits for digital mental
  health apps. The users who drop fastest have weaker working memory,
  lower verbal fluency, lower self-monitoring capacity, and lower health
  literacy.
- **Authoring failure** — when asked "what helps you relax?", a large
  slice of the population answers "I don't know" and means it. This is
  the clinical baseline, not evasion.
- **Concrete vs. abstract thinking** — features built on abstractions
  (categories like Head/Hands/Heart, scales like 1–5) require a
  metacognitive operation that not everyone can perform. Picture-supported,
  example-anchored alternatives work where abstractions fail.
- **Internal-blame attribution** — when self-help apps churn this
  population, users tend to internalise the failure ("I tried, it didn't
  work, I'm the problem"). This is iatrogenic when avoidable.
- **Concrete behavioural activation** — duration tags, picture cues,
  finished/not-finished states. Specificity reduces planning load; planning
  load is the bottleneck.

## What this lens looks for

- **Reading load.** How many words does the user have to parse to use
  the feature? At what reading level?
- **Authoring ask.** Does the feature require the user to generate
  content (write activities, articulate preferences, recall examples)? If
  yes, this is a ceiling.
- **Abstract operations.** Does the user need to classify, scale, or
  reason about their own behaviour? Concrete alternatives (pictures,
  examples, finished/not states) outperform.
- **Library growth mechanism.** If the user cannot author, what grows
  the library? AI generation is *not* a luxury for this audience — it
  is the only sustainable mechanism.
- **Failure mode under stagnation.** What does the user conclude when the
  library doesn't grow? Most likely conclusion: "this app doesn't work
  for me / I don't work for this app." Avoid.

## Biases to watch for

- Designers' (and other panel members') reflex preference for "agency"
  framings. Agency that requires generating content is not agency for
  this audience — it is exclusion with a friendly UI.
- Assuming the user can describe what they like. They cannot. That is
  often *why they are using a wellness app*.
- Mistaking simplicity of *visual* for simplicity of *cognitive load*. A
  minimal screen with abstract content is still cognitively expensive.

## How to use this lens

When reviewing a feature, ask:

1. **Reading load.** Is the language B1 or lower? Could a 12-year-old
   read it without re-reading?
2. **Authoring required.** Does the feature ever ask the user to generate
   content? If so, is there a fallback for users who cannot?
3. **Concrete substitutes.** Where the feature uses an abstraction
   (category, scale, classification), is there a concrete picture-supported
   alternative?
4. **Library growth without authoring.** If this user never authors a
   single activity in their life, does the library still grow? If not,
   how does the app survive month four?

## Review focus when reviewing as this lens

1. Failure modes specific to weaker working memory, verbal fluency, and
   self-monitoring.
2. The risk of internal blame when the app churns.
3. Whether AI generation is being demoted in ways that disproportionately
   harm this audience.
4. Whether features assume gifted-author preferences (autonomy-first,
   authorship-as-spine) without naming the population that breaks under
   those assumptions.
