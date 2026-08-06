import { describe, it, expect } from 'vitest'
import { slugify } from '../../src/utils/slugify'

// slugify produces the i18n key under `activities.<slug>` in nl.json, so its
// exact output is a contract — the keys are hand-authored to match it (ADR-010).
describe('slugify', () => {
  it('should lowercase a simple title into a dashed key', () => {
    // Arrange
    const title = 'Avondwandeling'

    // Act
    const slug = slugify(title)

    // Assert
    expect(slug).toBe('avondwandeling')
  })

  it('should collapse spaces and apostrophes into single dashes', () => {
    // Arrange — apostrophes are not alphanumeric, so they become dashes too
    const title = "Haven't you walked"

    // Act
    const slug = slugify(title)

    // Assert
    expect(slug).toBe('haven-t-you-walked')
  })

  it('should trim leading and trailing dashes from surrounding punctuation', () => {
    // Arrange
    const title = '  Walk it off!  '

    // Act
    const slug = slugify(title)

    // Assert
    expect(slug).toBe('walk-it-off')
  })
})
