---
name: feature
description: End-to-end feature workflow for Unwind — ticket, plan, review, implement, review, submit. Use when Noor describes a feature or change to build from scratch.
---

# Feature

Orchestrates a feature from idea to PR. Run the phases in order. **Stop and wait
for Noor at every review gate (▸).** Do not run ahead.

Repo: `nluning/unwind`. Base branch: **`development`**. PRs target `development`.

## Phase 0 — Clarify

If scope, intent, or constraints are unclear, ask 1-3 short questions. If the
feature is obvious, skip. Don't interrogate — this isn't the learning flow.

## Phase 1 — Ticket

Run the **`/ticket`** skill to create the GitHub issue and add it to the
Unwind (#2) board. Keep the issue number (`#N`) and URL for later phases.

## Phase 2 — Branch

```bash
git fetch origin
git switch -c feat/<slug> origin/development
```
Use a short kebab-case `<slug>` from the feature. If Noor is in a worktree
dedicated to other work, ask whether to branch here or spin up a new worktree.

## Phase 3 — Plan ▸

1. Read any ADRs governing the touched area first (`docs/adr/INDEX.md`).
2. Investigate the relevant code so the plan is concrete (real file paths,
   real functions).
3. Use **native plan mode** (`EnterPlanMode` / `ExitPlanMode`) to present the
   plan for approval. Explain *why* before *how* (Noor's preference).
4. **Wait for Noor to approve.** On changes, revise and re-present.
5. Once approved, persist it to `docs/plan/{NN}-{slug}.md` (next sequential
   number — check `docs/plan/`). Header links the issue: `Issue: #N`.

## Phase 4 — Implement

Write code in small, reviewable chunks (one migration / route / composable /
component at a time), not the whole feature in one shot. Follow conventions in
CLAUDE.md and the relevant ADRs. Match surrounding code style (no single-letter
variables; template-first in Vue SFCs).

**Always write tests alongside the code — we test whatever we build or fix.**
For frontend components and composables, follow the **`/test`** skill for the
project's Vitest patterns (and consult it whenever you add or fix a test).
Cover the logic the chunk introduces: new composable behaviour, pure helpers,
edge cases, and the states a component renders. Run the suite before the review
gate. If Noor explicitly decides to skip tests for a given feature, note it and
move on.

## Phase 5 — Code review ▸

Review the diff yourself — correctness, security, conventions (CLAUDE.md +
relevant ADRs), and anything privacy-sensitive. Present findings to Noor.
**Wait** — this is a review gate, not a rubber stamp.

This is a code review, not the `/review` learning flow — don't quiz Noor.

## Phase 6 — Adjust

Apply fixes from review and from Noor's feedback. Loop Phase 5 ↔ 6 until Noor
says it's good.

## Phase 7 — Submit

```bash
git push -u origin feat/<slug>
gh pr create --base development --title "<title>" --body "Closes #N

<short summary>"
```
CI runs on push. Report the PR URL. Don't merge — that's Noor's call.

Once the PR is open, move issue `#N` to the **In review** lane on the Unwind
(#2) board (Status field). The project/field/option IDs are stable; only the
item ID is per-issue:

```bash
# Look up the item id for issue #N
item=$(gh project item-list 2 --owner nluning --format json --limit 200 \
  | python -c "import sys,json;print(next(i['id'] for i in json.load(sys.stdin)['items'] if i.get('content',{}).get('number')==$N))")

gh project item-edit --project-id PVT_kwHODIEOyc4BV-IR \
  --id "$item" \
  --field-id PVTSSF_lAHODIEOyc4BV-IRzhRV-P8 \
  --single-select-option-id aba860b9   # Status = In review
```

## Notes

- If a significant architectural decision gets made along the way, offer to run
  **`/adr`** to record it.
- Privacy-sensitive data (stress levels, behavioral patterns) — handle per
  CLAUDE.md.
- Update `.claude/project_status.md` if the feature shifts the project's state.
