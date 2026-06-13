import { describe, it, expect } from 'vitest'
import type { Activity } from '../types/activity.js'
import {
  computeWeight,
  pickWeighted,
  BASE_FADE_K,
  MIN_WEIGHT,
  SESSION_ACCEPTED_PENALTY,
  SESSION_SUGGESTED_PENALTY,
  type WeightContext,
} from './suggestionWeighting.js'

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

function makeContext(overrides: Partial<WeightContext> = {}): WeightContext {
  return {
    ownCount: 0,
    suggestedThisSession: new Set<string>(),
    acceptedThisSession: new Set<string>(),
    ...overrides,
  }
}

describe('computeWeight', () => {
  it('gives a fresh base activity a neutral weight of 1 for a new user', () => {
    expect(computeWeight(makeActivity(), makeContext())).toBe(1)
  })

  it('boosts accepted favorites, but sub-linearly (sqrt)', () => {
    const weight = computeWeight(makeActivity({ times_accepted: 9 }), makeContext())
    // 1 + sqrt(9) = 4, not 1 + 9 — one favorite can't dominate everything.
    expect(weight).toBe(4)
  })

  it('decays weight with skips', () => {
    const weight = computeWeight(makeActivity({ times_skipped: 3 }), makeContext())
    expect(weight).toBeCloseTo(1 / 4) // (1+0) / (1+3)
  })

  it('fades a base activity as the own pool grows (the inversion)', () => {
    const base = makeActivity({ source: 'base' })
    const fresh = computeWeight(base, makeContext({ ownCount: 0 }))
    const atK = computeWeight(base, makeContext({ ownCount: BASE_FADE_K }))
    const big = computeWeight(base, makeContext({ ownCount: 40 }))

    expect(fresh).toBe(1)
    expect(atK).toBeCloseTo(0.5) // K / (K + K)
    expect(big).toBeCloseTo(10 / 50) // ≈ 0.2
    expect(big).toBeLessThan(atK)
  })

  it('does NOT fade the user\'s own (non-base) activities', () => {
    const own = makeActivity({ source: 'user' })
    expect(computeWeight(own, makeContext({ ownCount: 0 }))).toBe(1)
    expect(computeWeight(own, makeContext({ ownCount: 40 }))).toBe(1) // unaffected by ownCount
  })

  it('lets a faded base item out-weigh heavily-skipped junk in the own list', () => {
    const ctx = makeContext({ ownCount: 40 })
    const fadedBase = computeWeight(makeActivity({ source: 'base' }), ctx)
    const junkOwn = computeWeight(makeActivity({ source: 'user', times_skipped: 5 }), ctx)
    expect(fadedBase).toBeGreaterThan(junkOwn) // base recovers relative to junk
  })

  it('applies the session-suggested penalty', () => {
    const weight = computeWeight(
      makeActivity({ id: 'seen' }),
      makeContext({ suggestedThisSession: new Set(['seen']) })
    )
    expect(weight).toBeCloseTo(1 / SESSION_SUGGESTED_PENALTY)
  })

  it('applies the stronger session-accepted penalty', () => {
    const weight = computeWeight(
      makeActivity({ id: 'done' }),
      makeContext({ acceptedThisSession: new Set(['done']) })
    )
    expect(weight).toBeCloseTo(1 / SESSION_ACCEPTED_PENALTY)
  })

  it('accept penalty takes precedence over suggested (does not stack to ÷30)', () => {
    // An accepted activity is always also "suggested" — it must stay at ÷10.
    const weight = computeWeight(
      makeActivity({ id: 'both' }),
      makeContext({
        suggestedThisSession: new Set(['both']),
        acceptedThisSession: new Set(['both']),
      })
    )
    expect(weight).toBeCloseTo(1 / SESSION_ACCEPTED_PENALTY)
  })

  it('keeps an accepted activity pickable, not excluded (above the floor)', () => {
    const weight = computeWeight(
      makeActivity({ id: 'done', source: 'user' }),
      makeContext({ acceptedThisSession: new Set(['done']) })
    )
    expect(weight).toBeGreaterThan(0) // can still surface later this session
    expect(weight).toBeCloseTo(0.1)
  })

  it('never drops below MIN_WEIGHT', () => {
    const weight = computeWeight(
      makeActivity({ source: 'base', times_skipped: 100 }),
      makeContext({ ownCount: 100 })
    )
    expect(weight).toBe(MIN_WEIGHT)
  })
})

describe('the inversion in aggregate', () => {
  it('a grown, engaged pool out-weighs the base library overall', () => {
    const base = Array.from({ length: 28 }, (_unused, index) =>
      makeActivity({ id: `b${index}`, source: 'base' })
    )
    const own = Array.from({ length: 40 }, (_unused, index) =>
      makeActivity({ id: `o${index}`, source: 'user', times_accepted: 2 })
    )
    const ctx = makeContext({ ownCount: own.length })

    const sumBase = base.reduce((sum, activity) => sum + computeWeight(activity, ctx), 0)
    const sumOwn = own.reduce((sum, activity) => sum + computeWeight(activity, ctx), 0)

    expect(sumOwn).toBeGreaterThan(sumBase * 3)
  })

  it('a fresh user still sees the base library (no own activities)', () => {
    const base = Array.from({ length: 28 }, (_unused, index) =>
      makeActivity({ id: `b${index}`, source: 'base' })
    )
    const ctx = makeContext({ ownCount: 0 })
    const total = base.reduce((sum, activity) => sum + computeWeight(activity, ctx), 0)
    expect(total).toBe(28) // each at full weight 1
  })
})

describe('pickWeighted', () => {
  it('returns null for an empty candidate list', () => {
    expect(pickWeighted([], makeContext())).toBeNull()
  })

  it('is deterministic with an injected random', () => {
    const first = makeActivity({ id: 'first', source: 'user' })
    const second = makeActivity({ id: 'second', source: 'user' })
    const candidates = [first, second]

    // roll = 0 → falls in the first band.
    expect(pickWeighted(candidates, makeContext(), () => 0)?.id).toBe('first')
    // roll ≈ total → falls in the last band.
    expect(pickWeighted(candidates, makeContext(), () => 0.999)?.id).toBe('second')
  })
})
