# ADR-001: Monorepo structure (frontend + backend in one repo)

## Status: Accepted

## Context

Full-stack app (Vue 3 + Fastify), single developer, deployed to one VPS. The
project has a dual purpose: build a useful app *and* develop transferable
full-stack skills by working without framework scaffolding. The repository
structure should support both goals.

## Decision

Single repo with `frontend/` and `backend/` directories, each with their own
`package.json` and config.

### Why

- **Traceability across the stack.** A frontend change and the API change it
  depends on live in the same commit. When learning how the full stack connects
  end-to-end — request from Vue to Fastify to PostgreSQL and back — having
  everything in one repo makes it possible to trace the full flow without
  switching repositories.
- **Single developer, single deploy target.** There is no team boundary that
  would benefit from separate repos. The overhead of coordinating two repos
  (versioning, cross-repo PRs, independent CI) adds complexity with no payoff
  at this scale.
- **Full-stack TypeScript.** Shared types between frontend and backend are
  possible without publishing packages. Not used yet, but the monorepo makes
  it trivial if needed.

## Consequences

- Related frontend + backend changes land in one commit. Simpler local setup.
- Both apps share a repo even though they deploy independently — fine at this
  scale, worth revisiting if the team grows.
- No workspace tooling (Turborepo, Nx) — not needed for two packages. Each
  directory has its own `npm install`, `npm test`, and `npm run dev`.
