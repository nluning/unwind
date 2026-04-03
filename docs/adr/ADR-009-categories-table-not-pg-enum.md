# ADR-009: Categories as a table, not a PostgreSQL enum

## Status: Accepted

## Context

Head / Hands / Heart are only 3 values, so a PG enum (`CREATE TYPE ... AS ENUM`)
seems tempting. But PG enums are notoriously painful to modify — adding a value
requires `ALTER TYPE`, removing one is nearly impossible without recreating the
type. The app concept already mentions future categories (chores, low-stimuli,
high-stimuli, repetitive activities).

## Decision

Use a `categories` table with `SERIAL PRIMARY KEY`. Reference categories by
integer ID in the database. Use TypeScript enums in the codebase for type safety.

No `CREATE TYPE ... AS ENUM`.

### Why

- **Extensibility without migrations.** Adding a category is an `INSERT`, not a
  schema change. Removing one is a `DELETE` with cascading cleanup. PG enums
  make both operations painful.
- **Proper foreign keys.** The `activity_categories` join table references
  `categories.id` with a real foreign key constraint. PG enums can't
  participate in foreign key relationships.
- **Learning the relational pattern.** Using a lookup table with a join is the
  standard relational approach to categorization. It's the same pattern used
  for tags, roles, permissions — worth understanding directly.

## Consequences

- Adding categories = inserting a row + updating the TS enum. No schema
  migration needed.
- The TS enum must stay in sync with the seed data — no enforcement mechanism
  beyond developer discipline (similar to ADR-010's slug sync issue).
- Slightly more verbose queries (JOIN instead of column comparison), but the
  many-to-many relationship requires a join table regardless.
