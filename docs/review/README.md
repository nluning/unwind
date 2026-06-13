# User Review Panel

## Purpose

A panel of 7 persona-based agents that review the app from different user
perspectives. The goal is to catch UX problems, cognitive load issues, language
barriers, and positioning gaps — not architecture or code quality.

Each persona is a lens. Run the same screens/flows through all 7 and compare
what breaks.

## How to run

1. Decide which flows to review (e.g., "Mode 1 suggestion flow", "onboarding",
   "Mode 4 chat conversation", "theme switching")
2. Give each agent the relevant screenshots, flow descriptions, or i18n strings
3. Each agent responds *in character* — what they see, what confuses them, what
   frustrates them, what works
4. Compile findings across all 7 into a single summary

You can run all 7 in parallel using the Agent tool. See `run-instructions.md`
for the exact prompts.

## The panel

### User personas

| # | Name    | File                  | Key lens                              |
|---|---------|-----------------------|---------------------------------------|
| 1 | Sanne   | `personas/sanne.md`   | Sensory sensitivity, shutdown stress  |
| 2 | Daan    | `personas/daan.md`    | Speed, decision paralysis, boredom    |
| 3 | Fatima  | `personas/fatima.md`  | Exhaustion, constraints, realism      |
| 4 | Jeroen  | `personas/jeroen.md`  | Alexithymia, self-assessment gaps     |
| 5 | Yuna    | `personas/yuna.md`    | Dutch clarity, small-space living     |
| 6 | Lisa    | `personas/lisa.md`    | NT perspective, positioning, polish   |
| 7 | Tom     | `personas/tom.md`     | Burnout/depression, ND-adjacent       |
| 8 | Eline   | `personas/eline.md`   | Gifted-ND, ideation-freeze, AI-as-catalyst |

### Expert lenses

Used for higher-level design or concept reviews where clinical and
HCI framing is more useful than first-person user reactions. Not bound
to a specific user — each lens carries its own theoretical anchors,
biases-to-watch-for, and review focus.

| # | Lens                                      | File                                       | Key concern                                                  |
|---|-------------------------------------------|--------------------------------------------|--------------------------------------------------------------|
| 1 | Giftedness psychologist                   | `experts/giftedness-psychologist.md`       | Authorship gradient, autonomy, deskilling risk               |
| 2 | Neurodivergence psychologist              | `experts/nd-psychologist.md`               | Monotropism, PDA, alexithymia, ND-burnout subgroups          |
| 3 | Avg/below-average IQ psychologist         | `experts/avg-iq-psychologist.md`           | Reading load, authoring ceiling, library-growth without typing |

## When to run reviews

- After completing a new user-facing feature (Stage 5 onboarding, Stage 7 polish)
- After significant UI/UX changes (theme rework, layout changes)
- Before beta testing with real users — catch the obvious issues first
