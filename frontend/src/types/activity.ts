export interface Activity {
  id: string
  title: string
  description: string | null
  suggested_duration: number
  min_stress_level: number
  max_stress_level: number
  source: 'base' | 'user' | 'ai'
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
}

// PUT /activities/:id uses COALESCE($n, col) server-side: `undefined` fields
// are stripped by JSON.stringify and `null` is treated as "don't change."
// An empty string explicitly clears a nullable column (e.g., description).
export type UpdateActivityPayload = Partial<CreateActivityPayload>
