import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../src/utils/renderMarkdown'

// renderMarkdown feeds assistant-generated text into v-html, so the DOMPurify
// pass is the security boundary: markdown must render, but injected scripts and
// event handlers must not survive.
describe('renderMarkdown', () => {
  it('should render markdown emphasis to HTML', () => {
    // Arrange
    const text = 'Probeer **diep ademhalen**'

    // Act
    const html = renderMarkdown(text)

    // Assert
    expect(html).toContain('<strong>diep ademhalen</strong>')
  })

  it('should strip injected script tags', () => {
    // Arrange
    const text = 'Hallo <script>alert("xss")</script>'

    // Act
    const html = renderMarkdown(text)

    // Assert
    expect(html).not.toContain('<script>')
  })

  it('should strip inline event-handler attributes', () => {
    // Arrange
    const text = '<img src="x" onerror="alert(1)">'

    // Act
    const html = renderMarkdown(text)

    // Assert
    expect(html).not.toContain('onerror')
  })
})
