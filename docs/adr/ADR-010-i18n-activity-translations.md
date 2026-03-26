# ADR-010: Translating activity content via frontend i18n with slug keys

## Status: Accepted (with known limitations and improvement plan)

## Context

The app is Dutch-only for now but uses vue-i18n from the start so adding
languages later doesn't require a rewrite. Activities are stored in English in
the database (`activities.title`, `activities.description`). The question is:
where and how do we translate them for the Dutch UI?

Options considered:

1. **DB-side translations table** — an `activity_translations` table with
   `(activity_id, locale, title, description)`.
2. **Translation key in DB** — store an i18n key like `activity.podcast` in the
   database instead of the English title, resolve it on the frontend.
3. **Locale-specific API responses** — backend returns already-translated
   content based on `Accept-Language` header.
4. **Slug-based frontend lookup** (chosen) — frontend derives a slug from the
   English title and looks it up in `nl.json`.
5. **UUID-based frontend lookup** — use the activity's database UUID as the
   i18n key.

## Decision

Use slug-based frontend lookup. The English title from the API is slugified at
render time (e.g. `"Go for a walk around the block"` becomes
`go-for-a-walk-around-the-block`), and used to look up a translation in
`frontend/src/locales/nl.json` under `activities.<slug>.title` and `.description`.

If no translation is found, vue-i18n falls back to the raw English title. This
handles user-created and AI-generated activities gracefully — they have no
translation key and display as-is.

Category names (`Head`, `Hands`, `Heart`) are translated via direct key lookup
under `categories.<name>` in the same locale file.

### Why this approach

- **Offline-friendly.** Translations ship in the JS bundle. Modes 1-3 work
  without an API call to translate anything.
- **No DB changes.** No migration, no extra table, no backend logic.
- **Simple for current scale.** 27 base activities, 1 language, ~100 users.
- **Fallback is safe.** Missing translation = English text, not a crash.

### Why not the others

- **DB translations (option 1):** best long-term but overkill right now. Adds a
  migration, backend locale handling, and API changes for a single-language app.
- **Translation key in DB (option 2):** user/AI activities have no natural key.
  You'd need auto-generated keys, which defeats the purpose.
- **Locale-specific API (option 3):** breaks offline-first. Language switching
  would require re-fetching all data. Bad fit for a PWA.
- **UUID keys (option 5):** `nl.json` becomes unreadable (UUIDs as keys). Same
  manual sync problem as slugs, but harder to debug.

## Known limitations

### 1. Fragile slug coupling

The slug is derived from the English title at runtime. If someone changes a
title in `seed.sql` (even a typo fix), the slug changes and the `nl.json` key
silently breaks. The fallback masks the problem — users see English instead of
Dutch with no error.

### 2. Manual sync between seed.sql and nl.json

Adding a new base activity requires updating both files. Nothing enforces this.
Forgetting the translation means Dutch users see one random English card among
Dutch ones.

### 3. Silent failures

vue-i18n does not log a warning when it falls back. Missing translations are
invisible to developers unless they manually check every activity in the UI.

### 4. Slug edge cases

The slugify regex (`/[^a-z0-9]+/g`) converts apostrophes to dashes:
`haven't` becomes `haven-t`, `you're` becomes `you-re`. This is correct and
consistent, but non-obvious. The nl.json keys must match this exact output.

## Improvement plan (not scheduled — pick up when relevant)

These are ordered by priority. Each one is independent.

### A. Extract slug function to a shared utility

**When:** next time ActivityCard or slug logic is touched.

Move the inline computed in `ActivityCard.vue` to a reusable function:

```typescript
// frontend/src/utils/slugify.ts
export function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
```

Add a unit test that covers the apostrophe cases.

### B. Add a CI validation script

**When:** CI pipeline is set up (Stage 6), or earlier if adding activities.

A script that extracts all base activity titles from `seed.sql`, slugifies them,
and checks that every slug has a matching key in `nl.json`. Fails the build if
a translation is missing.

### C. Add a `slug` column to the activities table

**When:** if activity titles start changing, or if adding a second language.

Store the slug as an immutable field in the database. The frontend uses
`activity.slug` instead of deriving it. This eliminates the runtime coupling
entirely. Migration:

```sql
ALTER TABLE activities ADD COLUMN slug TEXT UNIQUE;
UPDATE activities SET slug = -- generate from title --;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;
```

### D. Migrate to DB-side translations

**When:** if adding a second language becomes a real requirement.

Create an `activity_translations` table. Seed it with the current `nl.json`
activity content. Update the API to accept a locale parameter and return
translated content. Remove activity translations from `nl.json` (keep UI
strings like buttons and headings there).

Estimated effort: ~half a day.

## Consequences

- All 27 base activities have Dutch translations in `nl.json`, keyed by slug.
- User-created and AI-generated activities display in their original language.
- Adding a new base activity requires a manual update to `nl.json`.
- The slug function is the implicit contract between `seed.sql` and `nl.json`.
  Changes to either file must respect this contract.
- Future improvements (B, C, D) can be adopted incrementally without breaking
  the current setup.
