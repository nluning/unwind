---
name: prompt-test
description: Test a system prompt against multiple user scenarios and produce an evaluation report. Use when developing or refining prompts for Mode 4 chat or onboarding.
---

# Prompt Test

## Process

1. **Load** the system prompt from a provided path, or ask for it. Display for confirmation.
2. **Define scenarios** — use provided scenarios or generate 5 that stress-test the prompt:
   - Happy path (cooperative user, clear preferences)
   - Vague user (short or unclear responses)
   - Edge case (unusual preferences, contradictory input)
   - Boundary (off-topic attempts, personal questions)
   - Stress level extremes (very high → low-effort only; very low → open to anything)
3. **Run each scenario** as a simulated full conversation up to the prompt's exchange limit. Evaluate:
   - Does the model stay within role and constraints?
   - Is structured output (JSON if applicable) correctly formatted?
   - Is the exchange limit respected?
   - Are outputs meaningfully different across scenarios?
4. **Report** — present a summary table and highlight consistent patterns, failures, and suggested prompt edits with reasoning. Save the report to `docs/prompts/<feature>/report-<date>.md`.
5. **Iterate** — if edits are approved, update the prompt and re-run failing scenarios to verify.
