---
name: feedback_git_commits
description: Noor authors git commits herself; Claude must not add the Co-Authored-By trailer
metadata:
  type: feedback
---

Noor does her own git commits going forward. Claude should not run commits
unless explicitly asked.

If Claude ever does create a commit, it must **omit** the
`Co-Authored-By: Claude ...` trailer entirely.

**Why:** The trailer made GitHub attribute "Claude" as a contributor on the
public repo, which Noor did not want. On 2026-06-19 the trailer was stripped
from 8 commits on `development` via `git filter-branch` (backup branch
`backup/pre-trailer-strip`).

**How to apply:** Default to letting Noor commit. When a commit message is
genuinely needed, write the message body only — no co-author / "Generated with
Claude Code" trailers.
