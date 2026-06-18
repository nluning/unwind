---
name: Code style preferences
description: No single-letter variables, template-first in Vue SFCs, minimal comments. Applies to all code written or reviewed.
type: feedback
---

No single-letter variable names anywhere in the codebase. Use descriptive names even in callbacks (e.g., `(activity) =>` not `(a) =>`; `index` not `i`; `weight` not `w`).

**Why:** Noor finds single-letter variables harder to read and wants consistency across the project. Existing backend code (routes.ts etc.) also needs refactoring for this — noted as a future task.

**How to apply:** Always use descriptive names in new code. When touching existing files, rename single-letter variables encountered there too.

---

Vue SFC order: `<template>` on top, then `<script>`, then `<style>`.

**Why:** Noor's preferred reading order. Template first shows the structure before the logic.

**How to apply:** All new `.vue` files must use template-first order. Don't reorder existing files unless editing them.

---

Keep comments minimal — remove explanatory comments unless genuinely essential (a non-obvious *why*, or a gotcha that would otherwise get re-broken, e.g. a test's `@vitest-environment` directive). Don't narrate what the code already says.

**Why:** Noor finds explanatory comment noise clutters the code; the codebase trends comment-heavy and she's steering it leaner.

**How to apply:** In new code, only comment non-obvious rationale or hazards. When editing existing files, trim redundant explanatory comments you come across.
