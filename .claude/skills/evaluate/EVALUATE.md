---
name: evaluate
description: Evaluate code quality against project-specific standards — separation of concerns, i18n, patterns, types, duplication. Run on changed files or a specific area.
---

# Code Evaluation

Evaluate code quality for this project. Run on recently changed files (default)
or a specific file/directory when specified.

## Scope

Determine what to evaluate:

- If the user specifies a file or directory, evaluate that.
- If no target is specified, run `git diff --name-only HEAD~1` to find recently
  changed files. If that's empty, use `git diff --name-only` for uncommitted
  changes.
- Only evaluate project source files (`frontend/src/**`, `backend/src/**`).
  Skip config files, lockfiles, and generated output.

## Checks

For each file in scope, evaluate against these criteria. Only report actual
issues — don't flag things that are fine.

### 1. Separation of concerns

- **Components** should handle template + user interaction, not data fetching
  or business logic. That belongs in composables.
- **Composables** should manage state and logic, not render decisions.
- **Route handlers** should validate input, call logic, send response. SQL
  queries are fine in handlers (no ORM), but complex logic should be extracted.
- **API client** (`api/client.ts`) is the only place that calls `fetch` to the
  backend.

### 2. i18n completeness

- Every user-visible string must go through `t()` / `$t()`.
- Check for hardcoded Dutch (or English) strings in templates and script blocks.
- Aria labels, placeholder text, and error messages count as user-visible.
- i18n keys should be in `frontend/src/locales/nl.json`.

### 3. Pattern consistency

Compare against established patterns in the codebase:

- **Module-level state** for shared composables (`useAuth`, `useActivities`) —
  state declared outside the function, returned inside it.
- **Per-instance state** when the composable shouldn't share (like session
  tracking in `useActivities`).
- **Error handling**: API errors → user-facing message via i18n, not raw error
  strings.
- **Reactivity**: `computed()` for derived values, not plain variables that
  read reactive sources once.
- **Array updates**: spread for new-array-reference when updating refs
  (e.g. `activities.value = [...activities.value, item]`).

### 4. Type safety

- No `any` types (explicit or implicit via missing annotations).
- Interfaces for data shapes that cross boundaries (API responses, props,
  emits, composable return types).
- Proper use of TypeScript utility types where appropriate.

### 5. Duplication

- Repeated code blocks (3+ lines, appearing 2+ times) that could be extracted
  into a shared function or composable.
- Repeated template patterns that could be a component.
- Don't flag intentional duplication (e.g. similar but not identical route
  handlers).

### 6. ADR compliance

- Read `docs/adr/INDEX.md` to identify which ADRs apply to the files in scope.
- Read the full ADR for each match.
- Flag any code that contradicts an existing decision. Examples:
  - Using an ORM or query builder (violates ADR-003)
  - Storing session tokens in localStorage (violates ADR-004)
  - Adding a PG enum for categories (violates ADR-009)
  - Hardcoding Dutch strings instead of using i18n slugs (violates ADR-010)
- If a change intentionally supersedes an ADR, flag it as needing an ADR
  update rather than a code fix.

## Output format

For each issue found:

```
[category] file:line — description
  → suggested fix (one line)
```

End with a summary: total issues by category, and an overall assessment
(clean / minor issues / needs attention).

If no issues are found, say so — don't invent problems.
