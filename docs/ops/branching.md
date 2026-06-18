# Branching strategy

Two long-lived branches plus short-lived feature branches. Set up 2026-05-08
alongside Phase 6 (CI/CD) so that `main` only ever receives green code, and
every push to `main` is a deliberate deploy.

## The branches

- **`main`** — production. Every push triggers a deploy to unwind.nu.
  Protected. Only updated via PR.
- **`development`** — integration. Where finished work accumulates before
  being promoted to `main` as a deploy unit. Lightly protected (no
  deletion, no non-fast-forward pushes) so you can't lose history by
  accident, but otherwise open — direct pushes are fine.
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
If green, merge — see [squash vs rebase](#squash-vs-rebase-into-development)
for which strategy to pick. Delete the feature branch from the PR page
after merging.

### Squash vs rebase into `development`

**Default to squash.** Most feature branches accumulate WIP commits ("fix
typo", "actually handle the null case") that are useful while working but
noise once merged. Squash collapses them into one commit per feature, which
keeps `development`'s log readable when reviewing what's about to ship
(`git log main..development --oneline`) and makes rollback a single
`git revert <sha>`.

**Use rebase when the individual commits tell a story worth keeping.**
For example, a refactor deliberately split into "extract helper", "migrate
caller A", "migrate caller B" — each commit is independently meaningful,
bisectable, and revertable. If you'd lose useful history by squashing,
rebase instead.

Rule of thumb: if you can't summarize each commit's purpose in one line
without saying "WIP" or "more of the same", squash.

### Promote `development` to production

When the work on `development` is ready to ship:

```bash
# (optional) review what's about to deploy
git log main..development --oneline
```

Then open a PR `development` → `main` in the GitHub UI or run 
`gh pr create --base main --head development`. CI runs again on
the merge target. If green, use a **merge commit** (not squash or rebase)
— this triggers the deploy workflow and unwind.nu updates within a few
minutes.

Merge commits are required here because `development` is a long-lived
branch. A squash or rebase merge creates new commit SHAs on `main` that
don't match the originals on `development`, causing the branches to
diverge even though the content is identical. A merge commit ties the
histories together — after the merge, `main` contains all of
`development`'s commits by reference, so no resync is needed.

## Branch protection on `main`

Configured 2026-05-08 in **Settings → Rules → Rulesets**. Free-tier
personal accounts can only enforce rulesets on public repos, which is why
the repo went public the same day (history audit confirmed no committed
secrets first).

Enabled:

- ✅ Require a pull request before merging (only `merge` commits allowed —
  no squash/rebase on `main`)
- ✅ Required approvals: **0** (solo — you can't approve your own PR; the
  PR itself is the artifact)
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass — `backend`, `frontend`, `secret-scan`
  (all three jobs from `.github/workflows/ci.yml`)
- ❌ ~~Require linear history~~ — removed 2026-05-12. Incompatible with
  a long-lived `development` branch: squash/rebase merges create new SHAs
  that diverge from `development`. Merge commits for `development → main`
  avoid this.
- ✅ Block force pushes
- ✅ Restrict deletions

Note: `check-source` (from `enforce-merge-source.yml`) is **not** in the
required-status-checks list. It still blocks accidental merges because the
workflow fails the PR's check run, but a determined "merge anyway" click
would get past it. Add it as a required check if that gap matters.

Bypass list: **empty**. Including yourself defeats the rules — they exist
to protect `main` from your own accidents, not just outsiders.

## Source-branch enforcement

`.github/workflows/enforce-merge-source.yml` runs on every PR targeting
`main` and fails unless the source branch is `development`. This makes the
policy "only `development` merges into `main`" mechanical rather than
self-discipline — you can't accidentally land a feature branch directly on
production, even if branch protection would otherwise allow the PR.

The check is intentionally strict: there's no `fix/*` escape hatch.
Hotfixes route through `development` like everything else (see below).

## Why this shape

- **`development` exists** so that multiple changes can accumulate before
  becoming a single deploy. Without it, every merge to `main` is an
  independent ship event, which makes "I want to land 4 things and deploy
  them together" awkward.
- **`main` is protected** so that the deploy workflow is only ever
  triggered by a deliberate PR merge, never by a stray push.
- **Merge commits on `main`** each represent one promotion from
  `development` — effectively one deploy. The full commit detail lives
  inside each merge.
- **No `main` direct-push** means the gates (CI passing, PR review
  artifact) cannot be skipped — even by you, even in a hurry.

## Common pitfalls

| Symptom | Cause |
|---|---|
| `git push origin main` rejected | Working as intended. Open a PR from `development` instead. |
| PR can't be merged: "Required statuses must pass" | One of `backend` / `frontend` / `secret-scan` hasn't run on this PR's HEAD commit yet — push a new commit to retrigger, or click "Re-run" on the failing check. |
| `development → main` PR merged with squash/rebase and branches diverged | Use a merge commit instead. Squash/rebase create new SHAs that diverge from `development`. |
| Pushed to a feature branch but no CI ran | Expected — feature-branch pushes don't trigger CI on their own. Open a PR (even a draft) to fire CI. |

## Hotfixes

If `main` is broken in production, the fix still routes through
`development` — the `check-source` workflow blocks any other path. The
incident-mode flow:

1. Make sure `development` is clean and in sync with `main`. If
   `development` has unrelated in-progress work that isn't safe to ship,
   stash or branch it off first so the hotfix lands on a `main`-equivalent
   tip.
2. `git checkout development && git pull`
3. `git checkout -b fix/short-name`
4. Make the fix, commit, push.
5. PR `fix/short-name` → `development`. Merge as soon as CI is green.
6. Immediately open PR `development` → `main`. Merge when CI is green —
   this triggers the deploy.

Slower than a direct `fix/* → main` PR by one CI run and one merge click,
but the policy stays uniform: every commit that reaches `main` came
through `development`. Worth the few extra minutes for an incident; the
alternative is a per-incident decision about whether to bypass rules,
which is exactly the kind of thing that goes wrong under pressure.

If `development` was carrying unshippable work at the moment of the
incident, the safe move is to branch the in-progress work off first
(`git branch wip/save-it`), then reset `development` to `main`. The
`development` ruleset blocks non-fast-forward pushes, so a hard reset +
force-push won't work directly — either temporarily disable the
"branch protection on development" ruleset, force-push, then re-enable,
or `git revert` the unshippable commits on `development` so it
fast-forwards back to a `main`-equivalent tip. The revert path is safer
under incident pressure; the ruleset-toggle path is faster if you trust
yourself with the off-switch.
