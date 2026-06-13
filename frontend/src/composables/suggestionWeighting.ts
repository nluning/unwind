import type { Activity } from '../types/activity.js'

// ── Suggestion weighting ──────────────────────────────────────────────
// The inversion (plan 20 §3 / plan 21 Phase 2): the shared starter library
// fades as the user's own pool grows, so "Verras me" gradually serves the
// user's own + most-accepted activities instead of the seed set.
//
// Pure functions, no Vue/api deps, so the algorithm is unit-testable in
// isolation. `useActivities` wires them into the suggestion flow.

// How fast the base library fades. base activities are multiplied by
// K / (K + ownCount): full weight at 0 own activities, half weight at K
// own activities, approaching (but never reaching) zero as the pool grows.
// Tunable — raise to fade slower, lower to fade faster.
export const BASE_FADE_K = 10

// Floor so no activity becomes completely impossible. A faded base item or a
// heavily-skipped own item stays rare, not extinct — preserves variety, and
// lets base recover if the user's own list turns out to be junk.
export const MIN_WEIGHT = 0.01

// Session penalties (divisors). Both are soft, not exclusions: a just-accepted
// or already-seen activity becomes unlikely-this-sitting, never impossible, so
// a small library can't be starved into the "exhausted" state. Accept is the
// stronger signal ("I picked this just now"), so it bites harder than a mere
// re-suggest. The two are mutually exclusive states (accept takes precedence),
// not stacked — see computeWeight.
export const SESSION_ACCEPTED_PENALTY = 10
export const SESSION_SUGGESTED_PENALTY = 3

export interface WeightContext {
  // Number of non-base ('user' / 'ai') activities in the user's pool. Drives
  // the inversion: the larger it is, the more the base library fades.
  ownCount: number
  // Activities already suggested in this session — down-weighted to avoid
  // repeating the same suggestion before the pool is exhausted.
  suggestedThisSession: Set<string>
  // Activities accepted in this session — down-weighted harder, so a just-done
  // activity rarely reappears this sitting but a favorite can still resurface
  // later in a long session (and isn't banned outright for small libraries).
  acceptedThisSession: Set<string>
}

export function computeWeight(activity: Activity, context: WeightContext): number {
  // Accepted activities are the strongest fit-signal — they rise. sqrt keeps a
  // single much-accepted favorite from dominating every suggestion.
  let weight = 1 + Math.sqrt(activity.times_accepted)

  // Skips decay the weight multiplicatively, so it never goes negative.
  weight /= 1 + activity.times_skipped

  // The inversion: the base library fades as the user's own pool grows.
  if (activity.source === 'base') {
    weight *= BASE_FADE_K / (BASE_FADE_K + context.ownCount)
  }

  // Discourage repeating something already done/seen this session. Accept is
  // the stronger penalty and takes precedence — an accepted activity is always
  // also "suggested", so this else-if keeps it at ÷10, not ÷30.
  if (context.acceptedThisSession.has(activity.id)) {
    weight /= SESSION_ACCEPTED_PENALTY
  } else if (context.suggestedThisSession.has(activity.id)) {
    weight /= SESSION_SUGGESTED_PENALTY
  }

  return Math.max(MIN_WEIGHT, weight)
}

// Weighted random pick. `random` is injectable so tests can be deterministic;
// it defaults to Math.random in app use.
export function pickWeighted(
  candidates: Activity[],
  context: WeightContext,
  random: () => number = Math.random
): Activity | null {
  if (candidates.length === 0) return null

  const weights = candidates.map((activity) => computeWeight(activity, context))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  let roll = random() * totalWeight
  for (let index = 0; index < candidates.length; index++) {
    roll -= weights[index]!
    if (roll <= 0) return candidates[index]!
  }
  return candidates[candidates.length - 1]!
}
