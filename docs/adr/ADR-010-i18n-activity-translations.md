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

**Refinement (2026-04-30):** the lookup is gated on `activity.source === 'base'`.
User- and AI-generated activities skip the i18n call entirely and render their
stored title/description directly. The `source` column already exists in the DB
schema (`base | user | ai`) and is exposed on the API and the frontend
`Activity` type, so no schema or API changes were needed. Rationale below
under "Update".

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

### 3. Silent failures (resolved 2026-04-30 by source-gating)

vue-i18n *does* log a warning when it falls back ("translation not found").
Originally that warning fired for every user/AI activity, drowning the signal
we actually wanted (a base activity missing from `nl.json`). With the
source-gated lookup, only base activities trigger a translation attempt, so
the warning now means what it should mean: a base activity exists in
`seed.sql` but not in `nl.json`. This converts the warning from console noise
into a useful developer signal — partially closing CI validation gap B until
that script is built.

### 4. Slug edge cases

The slugify regex (`/[^a-z0-9]+/g`) converts apostrophes to dashes:
`haven't` becomes `haven-t`, `you're` becomes `you-re`. This is correct and
consistent, but non-obvious. The nl.json keys must match this exact output.

## Update 2026-04-30: source-gated lookup

When the AI-generated and user-created activity flows landed (Stage 5), the
fallback path started firing on every render of those activities. vue-i18n
emits a "translation not found" warning on fallback, which polluted the
console and made it impossible to spot a genuine missing base translation.

The original ADR treated the fallback as a feature ("missing translation =
English text, not a crash"), conflating runtime safety with developer signal.
Two fixes were considered:

- **Silence the warnings globally** via `missingWarn: false` / `fallbackWarn:
  false` in the vue-i18n config. One line, but it discards the signal we
  *want* — a base activity drifting out of sync with `nl.json`.
- **Gate the lookup on `source === 'base'`** (chosen). User/AI activities
  skip the i18n call entirely and render their stored content directly. Base
  activities still go through `t(key, fallback)`, so the warning still fires
  for genuinely missing base translations.

The second option encodes the intent in the rendering code rather than in
config: a future reader of `ActivityCard.vue` can see *why* user/AI activities
bypass i18n. It also keeps the ADR's stated goal (no DB or API changes) — the
`source` field was already in the schema and on the API response from day one,
so the fix was scoped to the two components that render activity content
(`ActivityCard.vue` and `ActivitiesListPage.vue`).

## Improvement plan (not scheduled — pick up when relevant)

These are ordered by priority. Each one is independent.

### A. Extract slug function to a shared utility — done 2026-04-30

`frontend/src/utils/slugify.ts` exports `slugify(title)`. The translation
logic (slug + i18n + source-gating) lives in
`frontend/src/composables/useActivityTranslation.ts` as a composable
exposing `titleFor(activity)` / `descriptionFor(activity)`. Both
`ActivityCard.vue` and `ActivitiesListPage.vue` consume the composable.

A unit test covering the apostrophe edge cases (`haven't` → `haven-t`,
`you're` → `you-re`) is still outstanding — frontend has no `*.spec.ts`
files yet, so adding the first test sets up Vitest patterns and was
deferred to keep this change focused.

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
- User-created and AI-generated activities display in their original language
  (typically Dutch — onboarding generates Dutch content via Sonnet, and users
  type in whatever language they prefer). The i18n lookup is skipped for these.
- Adding a new base activity requires a manual update to `nl.json`. A missing
  base translation now produces a single, meaningful "translation not found"
  warning in the console instead of being lost in the noise.
- The slug function is the implicit contract between `seed.sql` and `nl.json`.
  Changes to either file must respect this contract. Slug derivation lives in
  `frontend/src/utils/slugify.ts` and the source-gated translation lookup in
  `frontend/src/composables/useActivityTranslation.ts`.
- Future improvements (B, C, D) can be adopted incrementally without breaking
  the current setup.
