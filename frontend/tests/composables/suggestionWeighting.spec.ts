import { describe, it, expect } from 'vitest'
import { computeWeight, pickWeighted, MIN_WEIGHT } from '../../src/composables/suggestionWeighting'

describe('suggestionWeighting', () => {
  describe('computeWeight', () => {
    it('should give a fresh base activity a neutral weight for a new user', () => {
      // Arrange & Act
      const weight = computeWeight(
        // @ts-expect-error partial test activity — only the weighting fields matter
        { id: 'base-item', source: 'base', times_accepted: 0, times_skipped: 0 },
        { ownCount: 0, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() },
      )

      // Assert
      expect(weight).toBe(1)
    })

    it('should boost accepted favorites sub-linearly so one cannot dominate', () => {
      // Arrange & Act — 1 + sqrt(9) = 4, not 1 + 9.
      const weight = computeWeight(
        // @ts-expect-error partial test activity
        { id: 'favorite', source: 'base', times_accepted: 9, times_skipped: 0 },
        { ownCount: 0, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() },
      )

      // Assert
      expect(weight).toBe(4)
    })

    it('should decay an activity that keeps being skipped', () => {
      // Arrange & Act — (1 + 0) / (1 + 3).
      const weight = computeWeight(
        // @ts-expect-error partial test activity
        { id: 'skipped-item', source: 'base', times_accepted: 0, times_skipped: 3 },
        { ownCount: 0, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() },
      )

      // Assert
      expect(weight).toBeCloseTo(0.25)
    })

    it('should fade the base library as the user builds their own pool (the inversion)', () => {
      // Arrange
      const context = (ownCount: number) => ({
        ownCount,
        suggestedThisSession: new Set<string>(),
        acceptedThisSession: new Set<string>(),
      })

      // Act
      // @ts-expect-error partial test activity
      const baseItem = { id: 'base-item', source: 'base', times_accepted: 0, times_skipped: 0 }
      const forNewUser = computeWeight(baseItem, context(0))
      const forEngagedUser = computeWeight(baseItem, context(40)) // 10 / (10 + 40)

      // Assert
      expect(forNewUser).toBe(1)
      expect(forEngagedUser).toBeCloseTo(0.2)
      expect(forEngagedUser).toBeLessThan(forNewUser)
    })

    it('should not fade the user’s own activities as the pool grows', () => {
      // Arrange & Act
      const ownItem = {
        // @ts-expect-error partial test activity
        id: 'own-item',
        source: 'user',
        times_accepted: 0,
        times_skipped: 0,
      }
      const context = { ownCount: 40, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() }

      // Assert — unaffected by ownCount.
      expect(computeWeight(ownItem, context)).toBe(1)
    })

    it('should penalize a just-accepted activity harder than a re-suggested one, without stacking', () => {
      // Arrange — 'done' is both suggested and accepted this session; accept wins
      // (÷10), it does not stack with the suggested penalty (which would be ÷30).
      const activity = {
        // @ts-expect-error partial test activity
        id: 'done',
        source: 'user',
        times_accepted: 0,
        times_skipped: 0,
      }

      // Act
      const weight = computeWeight(activity, {
        ownCount: 0,
        suggestedThisSession: new Set<string>(['done']),
        acceptedThisSession: new Set<string>(['done']),
      })

      // Assert
      expect(weight).toBeCloseTo(0.1)
    })

    it('should keep every activity above the floor so none becomes impossible', () => {
      // Arrange & Act — a faded, heavily-skipped base item bottoms out at MIN_WEIGHT.
      const weight = computeWeight(
        // @ts-expect-error partial test activity
        { id: 'buried', source: 'base', times_accepted: 0, times_skipped: 100 },
        { ownCount: 100, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() },
      )

      // Assert
      expect(weight).toBe(MIN_WEIGHT)
    })
  })

  describe('pickWeighted', () => {
    it('should return null when there are no candidates', () => {
      // Arrange & Act & Assert
      expect(
        pickWeighted([], { ownCount: 0, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() }),
      ).toBeNull()
    })

    it('should pick deterministically given an injected random', () => {
      // Arrange — two equal-weight candidates split the [0, total) range in half.
      const candidates = [
        // @ts-expect-error partial test activity
        { id: 'first', source: 'user', times_accepted: 0, times_skipped: 0 },
        // @ts-expect-error partial test activity
        { id: 'second', source: 'user', times_accepted: 0, times_skipped: 0 },
      ]
      const context = { ownCount: 2, suggestedThisSession: new Set<string>(), acceptedThisSession: new Set<string>() }

      // Act & Assert — a roll at the bottom lands on the first band, near the top on the last.
      expect(pickWeighted(candidates, context, () => 0)?.id).toBe('first')
      expect(pickWeighted(candidates, context, () => 0.999)?.id).toBe('second')
    })
  })
})
