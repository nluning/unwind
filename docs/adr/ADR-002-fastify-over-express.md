# ADR-002: Fastify over Express

## Status: Accepted

## Context

Need a Node.js HTTP framework. Express is the most widely used, but its last
major release was in 2014 and Express 5 was stuck in beta for years. Since this
project deliberately avoids a full-stack framework (see ADR-011), the HTTP
framework is the main structural choice for the backend — it should teach
patterns that transfer, not just provide convenience.

## Decision

Fastify — built-in JSON schema validation (Ajv), plugin system, structured
logging (Pino), active development.

### Why

- **Schema validation built in.** Fastify validates request bodies against JSON
  schemas via Ajv before the route handler runs. This teaches request validation
  as a first-class concern rather than a middleware afterthought — a pattern
  that applies regardless of framework.
- **Plugin architecture.** Fastify's encapsulated plugin model (register,
  decorate, hooks) is a structured way to organize backend code. Understanding
  plugin-based composition transfers to other frameworks and systems.
- **Structured logging.** Pino is integrated by default — every request gets
  structured JSON logs. This means cost visibility for the Claude API calls
  (token usage logging) works out of the box without additional setup.
- **Active development.** For a project that will be shown to hiring managers,
  the framework should reflect current best practices, not the 2014 ecosystem.

## Consequences

- Validation and structured logging out of the box, no extra middleware needed.
- Less Stack Overflow coverage than Express — documentation and GitHub issues
  are the primary reference.
- The plugin model transfers well to other frameworks. For a new project in
  2026, an actively maintained framework with modern patterns is a better
  foundation than the industry default running on inertia.
