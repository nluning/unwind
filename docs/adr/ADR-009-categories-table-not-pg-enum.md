# ADR-009: Categories as a table, not a PostgreSQL enum

## Status: Accepted

## Context

Head / Hands / Heart are only 3 values, so a PG enum seems tempting. But the
app concept already mentions future categories (chores, low-stimuli, etc.).

## Decision

Use a `categories` table with `SERIAL PRIMARY KEY`. Reference categories by
integer ID in the database. Use TypeScript enums in the codebase for type safety.

No `CREATE TYPE ... AS ENUM`.

## Consequences

- Adding categories = inserting a row + updating the TS enum. No schema migration needed.
- The TS enum must stay in sync with the seed data.
- A table allows proper foreign keys in `activity_categories`, which a PG enum can't do.
