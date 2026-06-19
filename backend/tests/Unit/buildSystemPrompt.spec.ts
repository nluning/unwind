import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../src/routes/buildSystemPrompt.js'

const emptyContext = {
  memories: [],
  frequentlyAccepted: [],
  doneToday: [],
}

describe('buildSystemPrompt', () => {
  it('includes the activity-context section when an activity is given', () => {
    const prompt = buildSystemPrompt({
      messageCount: 1,
      userContext: emptyContext,
      activityContext: { title: 'Lees een boek', description: 'Een half uur fictie' },
    })

    expect(prompt).toContain('Lees een boek')
    expect(prompt).toContain('Een half uur fictie')
    expect(prompt).toContain('The activity they were shown is')
  })

  it('handles an activity context without a description', () => {
    const prompt = buildSystemPrompt({
      messageCount: 1,
      userContext: emptyContext,
      activityContext: { title: 'Maak een kruiswoordpuzzel' },
    })

    expect(prompt).toContain('Maak een kruiswoordpuzzel')
    expect(prompt).not.toContain("'Maak een kruiswoordpuzzel' —")
  })

  it('omits the activity-context section when none is given', () => {
    const prompt = buildSystemPrompt({
      messageCount: 1,
      userContext: emptyContext,
    })

    expect(prompt).not.toContain('The activity they were shown is')
  })
})
