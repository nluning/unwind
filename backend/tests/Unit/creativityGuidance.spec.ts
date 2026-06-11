import { describe, it, expect } from 'vitest'
import { CREATIVITY_GUIDANCE } from '../../src/routes/creativityGuidance.js'
import { buildSystemPrompt } from '../../src/routes/buildSystemPrompt.js'
import { ONBOARDING_SYSTEM_PROMPT } from '../../src/routes/onboardingPrompt.js'

const emptyContext = {
  memories: [],
  frequentlyAccepted: [],
  frequentlySkipped: [],
  doneToday: [],
}

describe('CREATIVITY_GUIDANCE', () => {
  it('anchors to the user register and steers away from divergence by default', () => {
    expect(CREATIVITY_GUIDANCE).toContain('Anchor every suggestion')
    expect(CREATIVITY_GUIDANCE).toContain('Lean familiar and adjacent')
    // Cold-start guard: never gate suggestions on the user adding more first.
    expect(CREATIVITY_GUIDANCE).toContain('Never withhold a suggestion')
  })
})

describe('chat system prompt (buildSystemPrompt)', () => {
  it('includes the shared creativity guidance', () => {
    const prompt = buildSystemPrompt({ messageCount: 1, userContext: emptyContext })
    expect(prompt).toContain(CREATIVITY_GUIDANCE)
  })

  it('no longer instructs the model to be creative / think outside the box', () => {
    const prompt = buildSystemPrompt({ messageCount: 1, userContext: emptyContext })
    expect(prompt).not.toContain('think outside the box')
    expect(prompt).not.toContain('Be creative and think')
  })
})

describe('onboarding system prompt', () => {
  it('includes the shared creativity guidance', () => {
    expect(ONBOARDING_SYSTEM_PROMPT).toContain(CREATIVITY_GUIDANCE)
  })

  it('drops the old "fresh, surprising" / "be creative" directives', () => {
    expect(ONBOARDING_SYSTEM_PROMPT).not.toContain('fresh, surprising')
    expect(ONBOARDING_SYSTEM_PROMPT).not.toContain('Be creative and specific')
  })

  it('keeps the batch tilt toward familiar/easy-to-start', () => {
    expect(ONBOARDING_SYSTEM_PROMPT).toContain('familiar and easy to start')
  })
})
