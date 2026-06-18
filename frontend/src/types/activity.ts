export interface Activity {
  id: string
  title: string
  description: string | null
  suggested_duration: number
  min_stress_level: number
  max_stress_level: number
  source: 'base' | 'user' | 'ai'
  times_accepted: number
  times_skipped: number
  categories: string[]
}

export interface CreateActivityPayload {
  title: string
  description: string | null
  suggested_duration: number
  min_stress_level: number
  max_stress_level: number
  category_ids: number[]
  // Omitted for self-add (backend defaults to 'user'); the AI routes set 'ai'
  // so generated-then-saved activities stay distinguishable from hand-added ones.
  source?: 'user' | 'ai'
}

// PUT /activities/:id uses COALESCE($n, col) server-side: `undefined` fields
// are stripped by JSON.stringify and `null` is treated as "don't change."
// An empty string explicitly clears a nullable column (e.g., description).
export type UpdateActivityPayload = Partial<CreateActivityPayload>

// Hardcoded to match seed.sql SERIAL IDs. If categories become user-configurable,
// replace with a GET /categories endpoint. Lives here (not in useActivities) so
// pure consumers like parseActivity can use it without dragging in the composable
// graph (api client, suggestionWeighting, module-scope refs).
export const CATEGORY_ID_MAP: Record<string, number> = {
  Head: 1,
  Hands: 2,
  Heart: 3,
}
