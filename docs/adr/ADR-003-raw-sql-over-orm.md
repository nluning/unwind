# ADR-003: Raw SQL over ORM/query builder

## Status: Accepted

## Context

The app needs database access for PostgreSQL. The main options are an ORM
(Prisma, TypeORM), a query builder (Knex), or raw SQL via the `pg` package.
This project is deliberately built without framework scaffolding (see ADR-011)
to develop transferable understanding of what frameworks abstract away. The
database layer is the clearest example: an ORM hides the actual queries, a
query builder approximates them, raw SQL *is* them.

## Decision

Use raw SQL with the `pg` package. No ORM, no query builder.

Parameterized queries (`$1`, `$2`) for all user input to prevent SQL injection.

### Why

- **SQL is the transferable skill, not the ORM API.** Prisma's syntax is
  Prisma-specific. Eloquent's syntax is Laravel-specific. SQL works in every
  database, every language, and every debugging session. At ~100 users, the
  learning value of writing real queries outweighs the convenience of
  auto-generated ones.
- **Visibility.** Every query in this codebase is readable as SQL. There is no
  generated query layer to debug through — what you see in the code is what
  runs against the database. This makes performance reasoning straightforward.
- **Migrations are hand-written SQL files.** This forces understanding of schema
  evolution — `ALTER TABLE`, `CREATE INDEX`, data backfills — rather than
  relying on auto-generated migration diffs that may not do what you expect.

## Consequences

- Queries are more verbose than ORM equivalents, but every query is visible and
  understood. No magic happening behind the scenes.
- SQL skills transfer directly to any database or language.
- Connection pooling and parameterization must be handled manually.
- Full control over what runs against the database — easier to reason about
  performance and debug issues.
- No automatic relationship loading, model validation, or type generation from
  schema. At ~100 users with straightforward queries, this cost is low.
