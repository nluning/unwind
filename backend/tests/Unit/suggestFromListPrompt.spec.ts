import { describe, it, expect } from 'vitest'
import { buildSuggestFromListUserMessage } from '../../src/routes/suggestFromListPrompt.js'

describe('buildSuggestFromListUserMessage', () => {
  it('anchors to the seed activity when one is given', () => {
    const message = buildSuggestFromListUserMessage({
      addedActivities: ['Wandelen'],
      frequentlyAccepted: [],
      memories: [],
      seed: { title: 'Lees een boek', description: 'Een half uur fictie' },
    })

    expect(message).toContain('Lees een boek')
    expect(message).toContain('Een half uur fictie')
    expect(message).toContain('dicht bij')
  })

  it('omits the seed description gracefully when null', () => {
    const message = buildSuggestFromListUserMessage({
      addedActivities: [],
      frequentlyAccepted: [],
      memories: [],
      seed: { title: 'Maak een kruiswoordpuzzel', description: null },
    })

    expect(message).toContain('Maak een kruiswoordpuzzel')
    // No stray em-dash separator when there's no description.
    expect(message).not.toContain("'Maak een kruiswoordpuzzel' —")
  })

  it('tells the model not to re-suggest what the user already did today', () => {
    const message = buildSuggestFromListUserMessage({
      addedActivities: [],
      frequentlyAccepted: [],
      memories: [],
      doneToday: ['Wandelen', 'Thee zetten'],
    })

    expect(message).toContain('vandaag al gedaan')
    expect(message).toContain('Wandelen')
  })

  it('produces a generic message with no anchoring line when no seed is given', () => {
    const message = buildSuggestFromListUserMessage({
      addedActivities: ['Wandelen', 'Tekenen'],
      frequentlyAccepted: ['Wandelen'],
      memories: ['Houdt van buiten zijn'],
    })

    expect(message).not.toContain('in de geest van')
    expect(message).toContain('Wandelen')
  })

  it('falls back to the cold-start prompt for a brand-new user without a seed', () => {
    const message = buildSuggestFromListUserMessage({
      addedActivities: [],
      frequentlyAccepted: [],
      memories: [],
    })

    expect(message).toContain('nieuw')
  })
})
