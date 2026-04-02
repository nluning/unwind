# ADR-003: Raw SQL over ORM/query builder

## Status: Accepted

## Context

The app needs database access for PostgreSQL. The main options are an ORM
(Prisma, TypeORM), a query builder (Knex), or raw SQL via the `pg` package.
At ~100 users, developer understanding of the actual queries matters more than
ORM convenience.

## Decision

Use raw SQL with the `pg` package. No ORM, no query builder.

Parameterized queries (`$1`, `$2`) for all user input to prevent SQL injection.

## Consequences

- Queries are more verbose than ORM equivalents, but every query is visible and
  understood. No magic happening behind the scenes.
- SQL skills transfer directly to any database or language. ORMs teach their own
  API; query builders like Knex still abstract away the actual queries.
- Connection pooling and parameterization must be handled manually.
- Full control over what runs against the database — easier to reason about
  performance and debug issues.
- At ~100 users, the convenience of migrations, model definitions, and
  relationship loading that an ORM provides is not needed.
