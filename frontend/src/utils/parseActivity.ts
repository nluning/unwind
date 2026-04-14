import { CATEGORY_ID_MAP } from '../composables/useActivities.js'
import type { CreateActivityPayload } from '../types/activity.js'

export interface AiActivity {
  title: string
  description?: string
  category: string
  duration_minutes: number
  min_stress?: number
  max_stress?: number
}

export interface ParsedMessage {
  text: string
  activity: AiActivity | null
}

/**
 * Extracts a JSON activity block from an assistant message.
 * Returns the message text with the JSON block stripped, plus
 * the parsed activity (or null if not found / malformed).
 */
export function parseMessage(content: string): ParsedMessage {
  // Strategy 1: fenced ```json ... ``` block
  const fencedPattern = /```json\s*([\s\S]*?)```/
  const fencedMatch = content.match(fencedPattern)

  if (fencedMatch?.[1]) {
    const activity = tryParseActivity(fencedMatch[1])
    if (activity) {
      return { text: content.replace(fencedMatch[0], '').trim(), activity }
    }
  }

  // Strategy 2: bare JSON object with activity-shaped fields (no code fence)
  const barePattern = /\{[^{}]*"title"\s*:[^{}]*"category"\s*:[^{}]*\}/
  const bareMatch = content.match(barePattern)

  if (bareMatch?.[0]) {
    const activity = tryParseActivity(bareMatch[0])
    if (activity) {
      return { text: content.replace(bareMatch[0], '').trim(), activity }
    }
  }

  return { text: content, activity: null }
}

function tryParseActivity(json: string): AiActivity | null {
  try {
    const parsed = JSON.parse(json.trim())
    if (parsed.title && parsed.category && parsed.duration_minutes) {
      return parsed as AiActivity
    }
  } catch {
    // malformed JSON
  }
  return null
}

/**
 * Maps an AI-generated activity to the format expected by POST /activities.
 * Handles pipe-separated categories like "Head|Hands".
 */
export function toCreatePayload(activity: AiActivity): CreateActivityPayload {
  const categoryNames = activity.category.split('|').map((name) => name.trim())
  const categoryIds = categoryNames
    .map((name) => CATEGORY_ID_MAP[name])
    .filter((id): id is number => id !== undefined)

  return {
    title: activity.title,
    description: activity.description ?? null,
    suggested_duration: activity.duration_minutes,
    min_stress_level: activity.min_stress ?? 1,
    max_stress_level: activity.max_stress ?? 5,
    category_ids: categoryIds.length > 0 ? categoryIds : [1],
  }
}
