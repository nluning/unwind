// @vitest-environment jsdom
// useActivities transitively imports the router (api/client), which needs a
// DOM. The filter helpers themselves are pure given an explicit `source`.
import { describe, it, expect } from 'vitest'
import type { Activity } from '../types/activity.js'
import { useActivities } from './useActivities.js'

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    title: 'Test',
    description: null,
    suggested_duration: 10,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'base',
    times_accepted: 0,
    times_skipped: 0,
    categories: [],
    ...overrides,
  }
}

const { filterByStress, filterByIncludedCategories } = useActivities()

describe('filterByIncludedCategories', () => {
  const head = makeActivity({ id: 'head', categories: ['Head'] })
  const hands = makeActivity({ id: 'hands', categories: ['Hands'] })
  const headHeart = makeActivity({ id: 'headHeart', categories: ['Head', 'Heart'] })
  const source = [head, hands, headHeart]

  it('keeps only activities in a single selected category', () => {
    const result = filterByIncludedCategories(['Head'], source)
    expect(result.map((activity) => activity.id)).toEqual(['head', 'headHeart'])
  })

  it('keeps activities matching any of several selected categories', () => {
    const result = filterByIncludedCategories(['Hands', 'Heart'], source)
    expect(result.map((activity) => activity.id)).toEqual(['hands', 'headHeart'])
  })

  it('returns nothing when no activity matches', () => {
    expect(filterByIncludedCategories(['Hands'], [head, headHeart])).toEqual([])
  })
})

describe('filterByStress composed with filterByIncludedCategories', () => {
  it('narrows by both stress range and category', () => {
    const calmHead = makeActivity({
      id: 'calmHead',
      categories: ['Head'],
      min_stress_level: 1,
      max_stress_level: 2,
    })
    const tenseHead = makeActivity({
      id: 'tenseHead',
      categories: ['Head'],
      min_stress_level: 4,
      max_stress_level: 5,
    })
    const tenseHands = makeActivity({
      id: 'tenseHands',
      categories: ['Hands'],
      min_stress_level: 4,
      max_stress_level: 5,
    })
    const source = [calmHead, tenseHead, tenseHands]

    const byStress = filterByStress(5, source)
    expect(byStress.map((activity) => activity.id)).toEqual(['tenseHead', 'tenseHands'])

    const byBoth = filterByIncludedCategories(['Head'], byStress)
    expect(byBoth.map((activity) => activity.id)).toEqual(['tenseHead'])
  })
})
