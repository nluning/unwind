# Running the User Review Panel

## Overview

This document contains everything needed to run the 7-persona review panel
in a new Claude Code session. Each persona is run as a parallel agent that
reviews a specific flow or set of screens.

## Prerequisites

Before running, decide:

1. **What to review** — pick one or more flows:
   - Mode 1: suggest flow (open app → get suggestion → accept/skip)
   - Theme/settings: theme picker, visual appearance
   - Full walkthrough: all of the above
   - Something else; the user will provide the information (ask if unclear)

2. **What to provide** — the agents need material to review:
   - Screenshots of the relevant screens (preferred)
   - Or: descriptions of the flows + the actual i18n strings used
   - Or: have the agent read the actual Vue components and i18n files

## How to run

Use 7 parallel Agent calls, one per persona. Each agent gets:
1. The shared context block (below)
2. Their persona file (from `docs/review/personas/`)
3. The specific flow to review
4. Output format instructions

### Shared context block

Include this in every agent prompt:

```
You are a user review agent for Unwind, an activity suggestion app for people
who struggle to switch off and relax. The app's core mode is:
- Mode 1 (Suggereer): random activity suggestion, one at a time, accept/skip.

Other modes are in development. 

When a user first opens the app, there are about 30 activities available. There is 
an option to add your own activities.

The UI is Dutch-only. Dark mode is the default. There are 6 theme variants
(calm/warm/playful x dark/light).

The app is a PWA designed for mobile use. The target audience is neurodivergent
people, but not exclusively.
```

### Per-agent prompt template

```
[Shared context block]

You are reviewing this app as a specific user persona. Read the persona file
at docs/review/personas/{name}.md carefully. You ARE this person — respond
from their perspective, in first person.

Review the following flow: [DESCRIBE FLOW OR POINT TO SCREENSHOTS]

For each screen or step in the flow, respond with:

1. **First reaction** — what do you notice first? How does it feel?
2. **Friction** — what's confusing, hard, or annoying? Be specific.
3. **What works** — what's good about this for you specifically?
4. **Would you continue?** — at this point, are you still using the app
   or have you closed it?

After reviewing all screens, give:
- **Overall verdict**: would you use this app regularly? Why/why not?
- **Top 3 issues** ranked by severity (for you personally)
- **One thing to keep** that should NOT be changed

Keep your response under 500 words. Be honest, not polite.
```

### Example: running a Mode 1 review

In a Claude Code session:

```
Run the user review panel on the Mode 1 (suggest) flow. Read the persona
files in docs/review/personas/ and the run instructions in
docs/review/run-instructions.md. The flow to review: user opens the app,
lands on SuggestPage, sees an activity card, can accept or skip. Read
the relevant frontend files (SuggestPage.vue, ActivityCard.vue, the i18n
file) and review from each persona's perspective. Run all 7 in parallel.
```

## Compiling results

After all 7 agents complete, synthesize:

1. **Issues that multiple personas flagged** — these are the highest priority
2. **Issues unique to one persona** — still valid but lower priority unless
   that persona represents a core user
3. **Conflicts** — where one persona wants X and another wants the opposite.
   These are design trade-offs, not bugs.
4. **Verdict spread** — how many would keep using the app? Who wouldn't,
   and why?

## Adjusting the panel

- To add a persona: create a new file in `personas/`, add it to the README
  table
- To adjust a persona: edit their file directly
- To run a subset: just launch fewer agents (e.g., only the 5 ND personas
  for a Mode 4 review, since Lisa and Tom are less relevant there)
- For Stage 7+: consider adding a lower-literacy persona to test whether
  the UI works with minimal reading

## Expert lenses

For higher-level concept or design-direction reviews (rather than
flow/screen reviews), the panel can be augmented or replaced with the
expert lenses in `experts/`. Each lens carries its own theoretical
anchors and review focus. Agents called as an expert lens read the
relevant file from `experts/` and respond in lens-voice (third-person
analysis), not in first-person persona-voice.

Expert lenses pair well with a small persona subset (2–3) rather than
the full 7 — the expert sections do the analytical work; the persona
sections ground-truth the analysis with how a real user would react.

See `reports/004-app-purpose-and-flow.md` and
`reports/005-mode3-ai-assistant.md` for examples of expert + persona
mixed panels.
