---
name: fix-bug
description: |
  Structured bug-fix workflow: reproduce the defect, confirm it isn't already
  fixed on development, capture the investigation in docs/bugs/<slug>/BUG.md,
  propose the fix and wait for approval, implement it, and gate on the
  bug-fix-verifier agent before PR. Use whenever fixing a bug, "fix bug",
  "debug this", "/fix-bug", or picking up a bug-labeled issue. Prefer this
  over `/feature` for bugs — bugs don't have a plan or acceptance criteria,
  they have "does the defect still reproduce?".
---

# Fix Bug

End-to-end bug-fix workflow. Lighter than `/feature`: no ticket-drafting
ceremony, no plan-mode approval, no board-tracked acceptance criteria — just
a confirmed reproduction, a root cause, an approved fix, and proof the fix
held.

If a bug turns out to need real design work (e.g. a race condition that
reveals a missing synchronisation primitive), stop and switch to `/feature`
instead — the extra structure is worth it there.

Repo: `nluning/unwind`. Base branch: **`development`**.

## Phase 0: Identify the bug

The developer may pass a GitHub issue number/URL, describe the bug inline,
or say "there's a bug where...". A repro'd bug doesn't need a filed issue —
if one doesn't exist yet, that's fine, proceed without it (offer `/ticket`
afterward if it's worth tracking).

If a number/URL is given, `gh issue view <n>` and keep title + body. If
scope is unclear either way, ask 1-3 short questions before going further.

## Phase 1: Branch

```bash
git fetch origin
git switch -c fix/<slug> origin/development
```

Short kebab-case `<slug>` describing the defect (not a copy of the title).
If already on a branch that's clearly for this bug, skip and proceed there.
If on `main`/`development` with unrelated uncommitted work, ask before
switching.

## Phase 2: Capture a verifiable repro

Read the code paths the bug touches — route → handler → composable/store,
whatever the affected layer is — before picking a repro path. You can't
demonstrate a defect in code you haven't read.

Every fix needs **something executable or describable that demonstrates the
defect** — Phase 6's verifier checks against it. Three valid paths:

| Situation | Path |
|---|---|
| Stack trace / error log / clearly-broken line + mechanical fix | **2b** |
| "It's broken somewhere around X" — need to pin down behaviour | **2a** |
| Visual glitch, timing issue, browser-specific | **2c** |
| Report says "it's broken" with no specifics | Ask for more context — don't guess |

### 2a. Failing test first (default)

Write a test that fails on HEAD for the exact reason reported, then passes
after the fix. Load `/test` first for frontend Vitest patterns; backend
tests follow the same `describe`/`it('should ...')` + AAA-comment shape
(see `backend/tests/Unit/` or `tests/Integration/` for the nearest analogue
— unit tests are pure-function, integration tests hit the real Postgres
service via `app.inject()`).

This same test becomes the regression gate in Phase 6.

### 2b. Test alongside fix (clear diagnosis)

When the diagnosis is already done for you — a stack trace pointing at a
line, a visible typo, a null deref staring at you in a recent diff — a
failing-test dance is ceremony. Ship the regression test in the same commit
as the fix instead of writing it first.

**Use only if all of these hold:** you have a stack trace / error log /
concrete file:line, or the defect is a self-evident typo/off-by-one/missing
null-check; the fix is mechanical (no design judgment).

Record it in BUG.md as:

> **Diagnosis evidence:** `TypeError` at `useChat.ts:114` — thrown when the
> stream reader returns `undefined` on abort. No reproduction ceremony; fix
> + regression test ship together.

### 2c. Manual reproduction (visual / timing)

Describe the steps in BUG.md and confirm with the developer before fixing:

> **Repro:** open the chat page, send a message, refresh mid-stream.
> **Expected:** partial message persists. **Actual:** message vanishes.
> Confirm?

Don't automate a browser to chase this — that's for verifying finished UI,
not reproducing defects.

**If you cannot reproduce or diagnose at all** — stop and ask for more
context (steps, browser, data state). Don't proceed on "probably this".

## Phase 3: Check if already fixed on development

Verify the bug still exists on `development` — you may have branched from a
stale point.

- **Failing test (2a):** stash the test, `git fetch origin development`,
  check out the touched file(s) from `origin/development`
  (`git checkout origin/development -- <path>`), un-stash, run. Reset after.
- **Diagnosis (2b) or manual (2c):** `git log origin/development -- <path>`
  for recent fix-language commits; read the diff if line numbers differ.

If it doesn't reproduce on `development`, stop — tell the developer which
commit likely fixed it and suggest merging `development` in instead of
duplicating the fix.

## Phase 4: Create docs/bugs/<slug>/BUG.md

```markdown
# <short bug title>

**Date:** <YYYY-MM-DD>
**Issue:** [#N](link) — or "None, found during development"
**Status:** Investigating | Diagnosed | Fixing | Verified | Abandoned

## Problem
<2-4 sentences on the user-visible defect, in your own words.>

## Reproduction Steps
<Use exactly one heading, matching the path taken.>

**Failing test (2a):** `path/to/test.spec.ts::<test name>`
Run with: `<exact command>`

**— or —**

**Diagnosis evidence (2b):**
- Stack trace / error log / file:line: `<pasted trace>`
- Regression test that ships with the fix: `<path::name>`

**— or —**

**Manual steps (2c):**
1. <step>
2. <step>
3. <expected vs. actual>

## Root Cause
<Filled in Phase 5. 2-4 sentences citing file:line. Mechanism, not symptom.>

## Chosen Approach
<Filled at the end of Phase 5 — one line naming the picked fix.>

## Fix
<Filled in Phase 6. What changed and why it addresses the root cause —
not a diff dump.>

## Verification
<Filled by bug-fix-verifier in Phase 7. Empty until then.>

## Notes / Follow-ups
<Adjacent issues or refactors worth doing later. Empty is fine.>
```

Write Problem and Reproduction now; leave the rest for later phases. Status:
`Investigating`.

## Phase 5: Diagnose & propose

Explain the bug and get explicit approval before touching source files.

### Pin down the root cause

Read the code again with the repro evidence in hand. Write 2-4 sentences
into BUG.md's **Root Cause**, citing `file:line`. If you can't write a
coherent root cause, go back to Phase 2 — you don't understand the bug yet.

Update Status to `Diagnosed`.

### Explain and propose

Post a short chat message:

> **Bug:** <one-sentence symptom>
> **Root cause:** <2-3 sentences, file:line>
> **Why now:** <if relevant>

Then lay out fix candidates:

- **Single candidate** when there's really only one good answer (typo,
  off-by-one, missing check) — don't invent strawman alternatives to look
  thorough.
- **2-4 candidates** when real design choices exist, with a one-line
  trade-off each and a recommendation.

Use `AskUserQuestion` with one option per candidate (plus "Other /
discuss" for multiple). Don't ask the developer to type a decision out.

If the developer picks "discuss", iterate and re-ask — don't start coding.
Once picked, write a one-liner into **Chosen Approach**.

## Phase 6: Implement the fix

- **Stick to the chosen approach.** New evidence that contradicts the
  diagnosis means stop, update Root Cause, return to Phase 5 with a fresh
  proposal. Don't quietly switch mid-fix.
- **Keep the diff minimal.** A bug fix isn't a cleanup pass — resist
  renaming, deleting comments, or refactoring nearby code. Note spotted
  issues in BUG.md's Notes / Follow-ups instead.
- **Run your repro** — the failing test should now pass, or manual steps
  should now behave correctly.
- **Run the affected suite** (`npx vitest run` in the touched
  `backend/`/`frontend/` dir) plus type-check (`tsc --noEmit` /
  `npm run type-check`) before declaring done.

Update BUG.md as you go: fill in **Fix**, set Status to `Fixing`, then
`Verified` only after Phase 7 passes.

## Phase 7: Spawn bug-fix-verifier

Spawn the `bug-fix-verifier` agent — it has no context from this
conversation and works purely from BUG.md and the diff:

```
Agent({
  subagent_type: "bug-fix-verifier",
  prompt: `Verify the bug fix on this branch.

Bug directory: docs/bugs/<slug>/

Read BUG.md, re-run the repro against HEAD, confirm the bug no longer
reproduces, and glance at touched files for obvious regressions. Write
your verdict into the BUG.md Verification section and report back with
a score (1-10). Threshold: 7.`
})
```

- **Score ≥ 7 / PASS** — proceed to Phase 8. Update Status to `Verified`.
- **Score < 7 / FAIL** — fix what the verifier found, re-run your repro,
  re-spawn. Don't open the PR below 7 — shipping a "fix" that still
  reproduces is worse than shipping none, since it reads as closed.

If the verifier can't run the repro for environmental reasons (missing DB,
missing data), surface it — don't lower the threshold.

## Phase 8: Submit

```bash
git push -u origin fix/<slug>
gh pr create --base development --title "fix: <short defect description>" --body "Closes #N

<short summary pulled from BUG.md's Fix section>"
```

Omit "Closes #N" if there's no linked issue. CI runs on push. Report the PR
URL — don't merge, that's the developer's call.

If a GitHub issue is linked, move it to **In review** on the Unwind (#2)
board:

```bash
item=$(gh project item-list 2 --owner nluning --format json --limit 200 \
  | python -c "import sys,json;print(next(i['id'] for i in json.load(sys.stdin)['items'] if i.get('content',{}).get('number')==$N))")

gh project item-edit --project-id PVT_kwHODIEOyc4BV-IR \
  --id "$item" \
  --field-id PVTSSF_lAHODIEOyc4BV-IRzhRV-P8 \
  --single-select-option-id aba860b9   # Status = In review
```

## Notes

- If a significant architectural decision came up along the way, offer
  `/adr`.
- This skill is the sole gate for bug-fix branches — it replaces, not
  supplements, `/feature`'s review gate. If the diff also warrants a
  broader look (style, duplication), the developer can run `/evaluate`
  explicitly.
