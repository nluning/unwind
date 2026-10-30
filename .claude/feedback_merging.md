---
name: feedback_merging
description: Always ask Noor before merging any branch; prefer squash; development accepts local merges without a PR
metadata:
  type: feedback
---

Never merge a branch (locally into `development`, or a PR on GitHub) without
asking Noor first and getting an explicit yes. A yes covers one merge only.

**Why:** Noor wants to control what lands. `development` has no PR requirement
(its ruleset only blocks deletion and force-push), so nothing mechanical stops
a local merge, and CI only runs after the push.

**How to apply:** Prefer squash (`git merge --squash`, then `git commit`).
Procedure is in `docs/ops/branching.md` under "Merge locally into
`development`". Related: [[feedback_git_commits]].
