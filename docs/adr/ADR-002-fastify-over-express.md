# ADR-002: Fastify over Express

## Status: Accepted

## Context

Need a Node.js HTTP framework. Express is most popular but stagnating — last
major release in 2014, Express 5 stuck in beta for years.

## Decision

Fastify — built-in JSON schema validation (Ajv), plugin system, structured
logging (Pino), active development.

## Consequences

- Validation and structured logging out of the box, no extra middleware.
- Less Stack Overflow coverage than Express.
- The plugin model transfers well to other frameworks. For a new project in
  2026, an actively maintained framework with modern patterns is a better
  foundation than the industry default running on inertia.
