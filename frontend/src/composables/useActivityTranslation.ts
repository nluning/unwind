import { useI18n } from 'vue-i18n'
import type { Activity } from '../types/activity.js'
import { slugify } from '../utils/slugify.js'

/**
 * Returns translated title/description for an activity. Only base activities
 * (seeded from `seed.sql`) have entries in `nl.json`; user- and AI-generated
 * activities are stored in their original language and rendered as-is.
 *
 * Skipping the i18n lookup for non-base activities prevents vue-i18n from
 * emitting "translation not found" warnings for content we never intended to
 * translate, so a remaining warning means a base activity is genuinely
 * missing from `nl.json`. See ADR-010.
 */
export function useActivityTranslation() {
  const { t } = useI18n()

  function titleFor(activity: Activity): string {
    if (activity.source !== 'base') return activity.title
    return t(`activities.${slugify(activity.title)}.title`, activity.title)
  }

  function descriptionFor(activity: Activity): string | null {
    if (!activity.description) return null
    if (activity.source !== 'base') return activity.description
    return t(`activities.${slugify(activity.title)}.description`, activity.description)
  }

  return { titleFor, descriptionFor }
}
