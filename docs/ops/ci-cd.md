# CI/CD pipeline runbook

Reference for everything that happens between `git push` and unwind.nu being
updated. Set up 2026-05-08 alongside the rest of Stage 6 Phase 6.

## Architecture at a glance

```
git push to main
       │
       ▼
┌─────────────────┐    ┌────────────┐    ┌────────────┐
│ ci.yml          │    │ deploy.yml │    │ deploy.yml │
│ (test workflow) │    │ build job  │    │ deploy job │
│                 │    │            │    │            │
│ • backend       │    │ • build    │    │ • SSH to   │
│ • frontend      │    │   backend  │    │   server   │
│ • secret-scan   │    │ • build    │    │ • git pull │
│                 │    │   frontend │    │ • compose  │
│ blocks merge if │    │ • push to  │    │   pull     │
│ red             │    │   GHCR     │    │ • migrate  │
└─────────────────┘    └────────────┘    │ • up -d    │
                                          └────────────┘
                                                │
                                                ▼
                                          unwind.nu live
```

Three workflows in `.github/workflows/`:

- **`ci.yml`** — runs on every push and PR to `main` or `development`.
  Three parallel jobs: `backend` (tsc + vitest, against a Postgres service
  container), `frontend` (lint + vue-tsc + vitest + vite build), and
  `secret-scan` (gitleaks). All three are merge-blocking on PRs to `main`.

- **`enforce-merge-source.yml`** — runs on PRs targeting `main` only.
  One job (`check-source`) that fails unless the PR's source branch is
  `development`. Merge-blocking. See `docs/ops/branching.md` for the
  policy rationale.

- **`deploy.yml`** — runs on push to `main` or via the manual
  "Run workflow" button. Two jobs:
  - `build-and-push` — builds backend + frontend Docker images, tags them
    `:sha-<commit>` and `:latest`, pushes to ghcr.io.
  - `deploy` — gated on `if: github.ref == 'refs/heads/main'`. SSHes into
    the server, pulls new compose file + images, runs migrations, restarts
    containers.

## Required GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**. Without all of these,
`deploy.yml` fails.

| Secret | What it is | Source |
|---|---|---|
| `SSH_PRIVATE_KEY` | Private half of the deploy keypair (passphrase-less ed25519). The matching public key lives in `~/.ssh/authorized_keys` on the server, identified by the `github-actions-deploy` comment. | Generated locally with `ssh-keygen -t ed25519 -C github-actions-deploy -f ~/.ssh/unwind_deploy -N ""`, then `cat ~/.ssh/unwind_deploy` |
| `SSH_HOST` | Hostname for SSH. Currently `unwind.nu`. | Domain |
| `SSH_USER` | Linux username on the server. | Same as your manual SSH login |
| `SSH_KNOWN_HOSTS` | Pinned host key fingerprints — pre-empts TOFU on the fresh runner. | `ssh-keyscan -t ed25519,rsa,ecdsa unwind.nu` |
| `VITE_SENTRY_DSN` | Sentry DSN baked into the frontend bundle at build time. | Sentry project settings, or current server `.env` |

`GITHUB_TOKEN` is *not* in this list — it's auto-injected by Actions and
scoped to a single run. We use it to push to GHCR; you don't manage it.

## Normal deploy (the happy path)

1. Land work on `development` via PR (CI must be green).
2. Open PR `development` → `main`. CI runs again on the merge target.
3. Merge. The merge fires `deploy.yml` automatically.
4. Watch the run in **Actions → deploy → \<latest run\>**. Each step has
   readable `==> ...` headers in the log so you can see which stage is
   running.
5. When the workflow finishes green, unwind.nu is on the new code. Total
   time end-to-end is usually 3-5 minutes; cold builds can hit 6-8.

## Manual deploy (workflow_dispatch)

Use when you want to redeploy `main`'s current head without making a code
change — e.g., re-running after a transient SSH failure, or after manually
intervening on the server.

**Actions → deploy → Run workflow** (top right) → branch `main` → **Run
workflow**. Builds and deploys identically to a push.

The button only appears for workflows that exist on the **default branch**
(`main`). If it's missing, the workflow file isn't on `main` yet.

## Rollback

The deploy workflow tags every image with both `:latest` and `:sha-<commit>`.
The `:sha-<commit>` tags are immutable, so any previous deploy can be
re-run by pointing the compose `IMAGE_TAG` at it.

### Steps

1. **Find the SHA you want to roll back to.** Either:
   - **Actions → deploy** — each successful run shows the commit it
     deployed.
   - `git log --oneline main` — the commit before the broken one is
     usually the target.
   - GHCR package page — shows all available tags.

2. **SSH to the server.**

   ```bash
   ssh unwind
   cd ~/unwind
   ```

3. **Pull and run with the previous tag.** Substitute the SHA:

   ```bash
   IMAGE_TAG=sha-abc1234 docker compose -f docker-compose.production.yml pull
   IMAGE_TAG=sha-abc1234 docker compose -f docker-compose.production.yml up -d --remove-orphans
   ```

   That's the rollback. Site is back on the previous build.

4. **Make `main` reflect reality.** Otherwise the next deploy re-ships
   the broken commit. Easiest path:

   ```bash
   # on your laptop
   git checkout main
   git pull
   git revert <broken-commit-sha>
   git push origin main
   ```

   The revert PR-merges through the normal pipeline and re-deploys the
   reverted code. After that, the manual `IMAGE_TAG=...` from step 3 is
   no longer needed (the new `:latest` matches the rollback).

### The migration caveat

Rollback restores **code**, not **schema**. If the broken deploy ran a
migration:

- **Additive migrations** (new column, new table, new index) are usually
  safe to leave in place — the older code ignores fields it doesn't know
  about. This is the common case.
- **Destructive migrations** (dropping a column the old code reads, type
  changes, NOT NULL on existing data) leave the database incompatible
  with the rolled-back code. You'd need to write a down-migration or
  forward-fix instead.

Designing migrations to be backwards-compatible (additive, nullable
defaults, two-step renames) means rollback stays clean. When in doubt,
forward-fix and deploy a corrected version rather than rolling back.

## Rotating the deploy SSH key

Do this if the GitHub secret has been exposed, if you want a key with a
known maximum age, or roughly every 6 months as hygiene.

Order matters — keep the old key working until you've confirmed the new
one does, so you don't lock yourself out.

1. **Generate a new keypair locally** (Git Bash):

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/unwind_deploy_new -N ""
   ```

2. **Add the new public key to the server**, *alongside* the old one:

   ```bash
   ssh unwind
   nano ~/.ssh/authorized_keys
   ```

   Paste the new key on a new line. Save. Now both keys work.

3. **Replace the GitHub secret.** Repo → Settings → Secrets → Actions →
   `SSH_PRIVATE_KEY` → **Update**. Paste the contents of
   `~/.ssh/unwind_deploy_new`.

4. **Trigger a deploy** to verify (workflow_dispatch on `main`). If it
   succeeds, the new key works.

5. **Remove the old key from the server.** SSH in, edit
   `~/.ssh/authorized_keys`, delete the old `github-actions-deploy` line
   (you can identify it by its comment).

6. **Delete the local files** for both keypairs (or keep only the new
   one as a backup). The private key now lives only in the GitHub secret.

## Local production-like testing

The compose file no longer has `build:` blocks — image references are
authoritative. Two consequences:

- **`docker compose -f docker-compose.production.yml up --build` won't
  work** — there's nothing to build.
- **Pulling from GHCR locally works for public images** —
  `docker compose -f docker-compose.production.yml pull` will download
  whatever `:latest` (or whatever `IMAGE_TAG` you set) currently points
  at.

If you want to test a *local* build of the production compose (e.g.,
rehearsing a change before pushing), tag your local build to match what
compose expects:

```bash
docker build -t ghcr.io/nluning/unwind-backend:latest ./backend
docker build \
  --build-arg VITE_API_URL=http://localhost \
  --build-arg VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
  -t ghcr.io/nluning/unwind-frontend:latest ./frontend
docker compose -f docker-compose.production.yml up -d
```

Day-to-day local development still uses the regular dev setup
(`npm run dev` in each subdir), not the production compose.

## Common failure modes

| Symptom in the deploy log | Likely cause |
|---|---|
| `Permission denied (publickey)` on the SSH step | `SSH_PRIVATE_KEY` secret doesn't match what's in `authorized_keys` on the server. Confirm the public key for the same keypair is on the server. |
| `Host key verification failed` | `SSH_KNOWN_HOSTS` is stale — the server's host key changed (rebuild? new instance?). Re-run `ssh-keyscan` and update the secret. |
| `Error response from daemon: pull access denied` on `docker compose pull` | GHCR package is private. Make it public (Profile → Packages → settings → Change visibility), or set up auth on the server side. |
| `manifest unknown` on `docker compose pull` | The `:latest` tag doesn't exist yet, or the image namespace is wrong. Check `ghcr.io/nluning/unwind-{backend,frontend}` in the Packages tab. |
| `npm run lint:check` fails on the CI side but passes locally | Local was running `npm run lint` (with `--fix`); CI doesn't auto-fix. Run `npm run lint:check` locally to reproduce, then commit the fix. |
| Frontend CI test step exits 1 with "no test files found" | Missing `--passWithNoTests`. Check `vitest run` invocation in `ci.yml`. |
| Backend `npm test` fails with `Invalid CORS origin option` in CI | `FRONTEND_URL` not set in the job env. CORS plugin rejects undefined. |
| Migration step times out | DB container slow to come up under load, or a migration script is hung. SSH to server, look at `docker compose logs db backend`. |
| Workflow runs but `deploy` job is "skipped" | Working as intended on non-`main` branches. The `if:` gate keeps dev pushes from deploying. |
| `Run workflow` button missing in the Actions UI | Workflow file doesn't exist on the default branch. `workflow_dispatch` only surfaces from `main`. |

## Cleanup tasks (not yet automated)

- **Old SHA tags accumulate on GHCR over time.** No retention policy
  yet. Manually clean via the GHCR UI (Packages → unwind-backend →
  Manage versions → Delete) every few months.
- **Old container images on the server** are pruned with `docker image
  prune -f` at the end of every deploy (only dangling images). For a
  deeper sweep: `docker system prune -af` (run manually, sparingly —
  this also removes unused volumes if `--volumes` is added).
