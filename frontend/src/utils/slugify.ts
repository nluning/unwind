/**
 * Converts an English activity title into the slug used as an i18n key
 * under `activities.<slug>` in `nl.json`. Lowercases, replaces any run of
 * non-alphanumerics with a single dash, and trims leading/trailing dashes.
 *
 * Edge cases worth knowing: apostrophes become dashes
 * (`haven't` → `haven-t`, `you're` → `you-re`). The `nl.json` keys must
 * match this exact output. See ADR-010.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
