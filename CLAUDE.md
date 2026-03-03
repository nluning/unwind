# Unwind

Activity suggestion app for neurodivergent brains that struggle to switch off.
Suggests relaxation activities tailored to the user. See `/PLAN/` for detailed
documentation.

## Project status

**Current stage: Planning complete, ready to start Stage 0.**

## Plan files (read these for full context)

- `PLAN/01-app-concept.md` — what the app does, the four modes, design principles
- `PLAN/02-technical-stack.md` — every technology choice with rationale
- `PLAN/03-learning-plan.md` — staged build plan with learning goals per stage

## Key decisions made

- **Stack**: Vue 3 + Fastify (TypeScript) + PostgreSQL + Claude API
- **Frontend**: PWA (not native), offline-first for modes 1-3
- **Auth**: Lucia library for production, throwaway manual JWT as learning exercise
- **Backend framework**: Fastify (not Express — Express is stagnating)
- **Database access**: raw SQL via `pg` (no ORM, no query builder)
- **AI**: Claude Haiku for Mode 4 chat, Sonnet for onboarding
- **Deployment**: Docker on a VPS, deployed incrementally from Stage 0
- **Testing**: Vitest integrated from Stage 1 onward (Noor has Vitest experience)
- **Token storage**: httpOnly cookies for refresh tokens (not localStorage)

## About Noor

- Junior developer, ~1 year experience
- Knows: JavaScript/TypeScript, Vue, PHP, Laravel, MySQL, Git, CSS/HTML, Vitest
- Top-down learner: needs the big picture before diving into details
- This is a learning project + portfolio piece + potential traineeship pickup
- Traineeship company uses Vue + Laravel
- Based in the Netherlands
- Values privacy, considers the app's data sensitive (stress levels, behavioral
  patterns)
- Prefers honest, nuanced advice over cheerful hand-waving

## Working preferences

- Explain architecture and *why* before *how*
- Don't over-engineer — this is ~100 users, not enterprise scale
- Flag when a choice has career/learning implications
- When in doubt about scope, ask
- Dutch-only UI for now, but i18n-ready (vue-i18n from the start)

## Review process

The plan was reviewed by four perspectives (agent team, March 2026):
- Learning specialist (top-down fit)
- Devil's advocate (assumptions & risks)
- Stack critic (technology choices)
- Career advisor (Dutch market relevance)

Key revisions from that review are already incorporated into the plan files.
