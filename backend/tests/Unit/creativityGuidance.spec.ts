import { describe, it, expect } from 'vitest'
import { CREATIVITY_GUIDANCE } from '../../src/routes/creativityGuidance.js'
import { buildSystemPrompt } from '../../src/routes/buildSystemPrompt.js'
import { SUGGEST_FROM_ANSWERS_SYSTEM_PROMPT } from '../../src/routes/suggestFromAnswersPrompt.js'
import { SUGGEST_FROM_LIST_SYSTEM_PROMPT } from '../../src/routes/suggestFromListPrompt.js'

const emptyContext = {
  memories: [],
  frequentlyAccepted: [],
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
  it('folds creativity guidance into the adjustment case rather than embedding the full block', () => {
    const prompt = buildSystemPrompt({ messageCount: 1, userContext: emptyContext })
    expect(prompt).not.toContain(CREATIVITY_GUIDANCE)
    expect(prompt).toContain("don't reach for novel or out-of-the-box ideas")
  })

  it('no longer instructs the model to be creative / think outside the box', () => {
    const prompt = buildSystemPrompt({ messageCount: 1, userContext: emptyContext })
    expect(prompt).not.toContain('think outside the box')
    expect(prompt).not.toContain('Be creative and think')
  })
})

describe.each([
  ['suggest-from-answers', SUGGEST_FROM_ANSWERS_SYSTEM_PROMPT],
  ['suggest-from-list', SUGGEST_FROM_LIST_SYSTEM_PROMPT],
])('%s system prompt', (_name, prompt) => {
  it('includes the shared creativity guidance', () => {
    expect(prompt).toContain(CREATIVITY_GUIDANCE)
  })

  it('does not use the old "fresh, surprising" / "be creative" directives', () => {
    expect(prompt).not.toContain('fresh, surprising')
    expect(prompt).not.toContain('Be creative and specific')
  })
})
