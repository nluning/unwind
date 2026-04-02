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
