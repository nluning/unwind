# ADR-001: Monorepo structure (frontend + backend in one repo)

## Status: Accepted

## Context

Full-stack app (Vue 3 + Fastify), single developer, deployed to one VPS.

## Decision

Single repo with `frontend/` and `backend/` directories, each with their own
`package.json` and config.

## Consequences

- Related frontend + backend changes land in one commit. Simpler local setup.
- Both apps share a repo even though they deploy independently — fine at this
  scale, worth revisiting if the team grows.
- Keeping everything together makes it easier to trace how the full stack
  connects end-to-end.
