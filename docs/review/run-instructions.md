# Running the User Review Panel

## Overview

This document contains everything needed to run the 7-persona review panel
in a new Claude Code session. Each persona is run as a parallel agent that
reviews a specific flow or set of screens.

## Prerequisites

Before running, decide:

1. **What to review** — pick one or more flows:
   - Mode 1: suggest flow (open app → get suggestion → accept/skip)
   - Mode 2: stress level selection → suggestion
   - Mode 3: counterbalance selection → suggestion
   - Mode 4: AI chat conversation
   - Onboarding: first-time user experience
   - Theme/settings: theme picker, visual appearance
   - Full walkthrough: all of the above

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
who struggle to switch off and relax. The app has four modes:
- Mode 1 (Suggereer): random activity suggestion, one at a time, accept/skip
- Mode 2 (Stress): select stress level 1-5, then get a filtered suggestion
- Mode 3 (Counterbalance): select what category you did today (Head/Hands/Heart),
  get a suggestion from a different category
- Mode 4 (Chat): AI chat that asks simple questions and suggests activities

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
