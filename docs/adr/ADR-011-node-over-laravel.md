# ADR-011: Node.js + Fastify over Laravel for the backend

## Status: Accepted

## Context

The backend needs to serve a REST API with auth, activity CRUD, usage tracking,
and an AI proxy. Laravel (PHP) would be the fastest path — familiar framework
with built-in auth scaffolding, ORM, validation, and migrations. The question
is whether speed-to-ship or depth of understanding matters more at this stage.

## Decision

Node.js with Fastify and TypeScript. No full-stack framework — routing, schema
validation, and logging come from Fastify; everything else (auth, migrations,
database access, API structure) is built by hand.

### Why

Laravel gives a lot for free, but it hides *how* those things work. Building
the API layer without that scaffolding forces direct engagement with:

- HTTP request/response handling
- Auth flow mechanics (not just `php artisan make:auth`)
- Raw SQL instead of Eloquent's abstractions
- Project structure decisions without a framework dictating conventions

Full-stack TypeScript also means one language across frontend and backend,
reducing context switching.

## Consequences

- Slower to build than an equivalent Laravel API. Features that take minutes
  in Laravel take longer here — that's the tradeoff.
- Transferable understanding: knowing how auth works at the HTTP level makes
  any framework's auth (including Laravel Sanctum) easier to debug.
- TypeScript catches type mismatches at compile time across the full stack.
- The line between "build it yourself for understanding" and "use a library
  for a solved problem" must be judged per feature (e.g., crypto primitives
  are always a library).
