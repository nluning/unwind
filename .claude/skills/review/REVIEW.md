---
name: review
description: Structured code review workflow — write small chunks, verify understanding with targeted questions. Core AI collaboration method for this project.
---

# Structured Review

## Process

Write code in small, reviewable chunks (one migration, route, composable, or component at a time). For each chunk:

1. **Present** the code with a brief explanation of what it does and why.
2. **Verify** with 2-3 questions, chosen from:
   - **Why** — "Why do we do X here?" (conceptual understanding)
   - **What if** — "What happens if you change/remove X?" (consequence awareness)
   - **Trace** — "Walk through what happens when X." (end-to-end reasoning)
3. **Evaluate** — correct: acknowledge, move on. Partial: fill the gap, ask a follow-up. Wrong: explain, then ask a simpler version. Do not proceed until the concept is confirmed.
4. **Retention check** — when a pattern repeats from a previous chunk, ask the reviewer to predict the code before showing it.

If the reviewer says "I'll write this one" — step back and let them. Review is the default, not a constraint.

## Session tracking

Log chunks and observations in `PLAN/08-review-based-learning.md` under the current session heading.
