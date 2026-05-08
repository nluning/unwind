# Branching strategy

Two long-lived branches plus short-lived feature branches. Set up 2026-05-08
alongside Phase 6 (CI/CD) so that `main` only ever receives green code, and
every push to `main` is a deliberate deploy.

## The branches

- **`main`** — production. Every push triggers a deploy to unwind.nu.
  Protected. Only updated via PR.
- **`development`** — integration. Where finished work accumulates before
  being promoted to `main` as a deploy unit. Unprotected.
- **`feat/*`, `fix/*`, `chore/*`** — short-lived feature branches off
  `development`. Deleted after merge.

## Daily flow

### Start new work

```bash
git checkout development
git pull
git checkout -b feat/short-name
```

The branch name is just a convention — `feat/`, `fix/`, `chore/` for the
intent, then a short kebab-case description.

### While working

Commit and push as you would on any branch:

```bash
git push -u origin feat/short-name
```

Pushing a feature branch on its own does **not** trigger CI — only opening
a PR or pushing to `development`/`main` does. This keeps WIP branches from
burning CI minutes.

### Open a PR to `development`

In the GitHub UI: PR `feat/short-name` → `development`. CI runs on the PR.
If green, merge (squash or rebase — see linear history below). Delete the
feature branch from the PR page after merging.

### Promote `development` to production

When the work on `development` is ready to ship:

```bash
# (optional) review what's about to deploy
git log main..development --oneline
```

Then open a PR `development` → `main` in the GitHub UI. CI runs again on
the merge target. If green, merge — this triggers the deploy workflow and
unwind.nu updates within a few minutes.

## Branch protection on `main`

Configured 2026-05-08 in **Settings → Rules → Rulesets**. Free-tier
personal accounts can only enforce rulesets on public repos, which is why
the repo went public the same day (history audit confirmed no committed
secrets first).

Enabled:

- ✅ Require a pull request before merging
- ✅ Required approvals: **0** (solo — you can't approve your own PR; the
  PR itself is the artifact)
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Block force pushes
- ✅ Restrict deletions

Pending until step 2 of the CI/CD setup is done:

- ⏳ **Require status checks to pass** — the `ci` check from
  `.github/workflows/ci.yml` becomes selectable in the dropdown only after
  the workflow has run at least once. Re-enable this and tick `ci` after
  the first run lands.

Bypass list: **empty**. Including yourself defeats the rules — they exist
to protect `main` from your own accidents, not just outsiders.

## Why this shape

- **`development` exists** so that multiple changes can accumulate before
  becoming a single deploy. Without it, every merge to `main` is an
  independent ship event, which makes "I want to land 4 things and deploy
  them together" awkward.
- **`main` is protected** so that the deploy workflow is only ever
  triggered by a deliberate PR merge, never by a stray push.
- **Linear history on `main`** keeps the deploy log readable. Each commit
  on `main` corresponds to one deploy.
- **No `main` direct-push** means the gates (CI passing, PR review
  artifact) cannot be skipped — even by you, even in a hurry.

## Common pitfalls

| Symptom | Cause |
|---|---|
| `git push origin main` rejected | Working as intended. Open a PR from `development` instead. |
| PR can't be merged: "1 status check is required" | `ci` workflow hasn't run on this PR's HEAD commit yet — push a new commit to retrigger, or click "Re-run" on the check. |
| Linear-history rule rejects the merge | A merge commit got created somewhere. Use **squash** or **rebase** in the PR UI; for local merges, prefer `git merge --ff-only` or rebase. |
| Required status check missing in the dropdown | Workflow hasn't run yet. Push something to `development` to trigger one run, then come back to settings. |
| Pushed to a feature branch but no CI ran | Expected — feature-branch pushes don't trigger CI on their own. Open a PR (even a draft) to fire CI. |

## Hotfixes

If `main` is broken in production and `development` has unrelated
in-progress work that isn't safe to ship:

1. `git checkout main && git pull`
2. `git checkout -b fix/short-name`
3. Make the fix, commit, push.
4. PR `fix/short-name` → `main` directly (skipping `development`).
5. After merge, **also** merge `main` back into `development` so the fix
   isn't lost on the next promotion: `git checkout development && git
   merge main && git push`.

This is the only documented path that bypasses `development`. Use it
only when prod is actually broken.
