import { describe, it, expect } from 'vitest'
import { parseMessage, toCreatePayload } from '../../src/utils/parseActivity'

// parseMessage pulls a structured activity out of free-text assistant replies so
// the UI can offer a save-to-list button; toCreatePayload maps that activity onto
// the POST /activities contract. Both run on live suggest/chat output, so
// malformed or partial JSON must degrade to "no activity" rather than throwing.
describe('parseActivity', () => {
  describe('parseMessage', () => {
    it('should extract a fenced json activity block and strip it from the text', () => {
      // Arrange
      const content =
        'Hier is een idee:\n```json\n{"title":"Wandelen","category":"Hands","duration_minutes":15}\n```\nVeel plezier!'

      // Act
      const result = parseMessage(content)

      // Assert
      expect(result.activity).toEqual({
        title: 'Wandelen',
        category: 'Hands',
        duration_minutes: 15,
      })
      expect(result.textBefore).toBe('Hier is een idee:')
      expect(result.textAfter).toBe('Veel plezier!')
    })

    it('should extract a bare json activity object without a code fence', () => {
      // Arrange
      const content =
        'Misschien dit: {"title":"Thee zetten","category":"Heart","duration_minutes":5}'

      // Act
      const result = parseMessage(content)

      // Assert
      expect(result.activity?.title).toBe('Thee zetten')
      expect(result.textBefore).toBe('Misschien dit:')
    })

    it('should return a null activity when the json is malformed', () => {
      // Arrange — trailing comma makes JSON.parse throw
      const content = '```json\n{"title":"Wandelen","category":"Hands",}\n```'

      // Act
      const result = parseMessage(content)

      // Assert
      expect(result.activity).toBeNull()
      expect(result.textBefore).toBe(content)
    })

    it('should return a null activity when required fields are missing', () => {
      // Arrange — valid JSON but no duration_minutes
      const content = '```json\n{"title":"Wandelen","category":"Hands"}\n```'

      // Act
      const result = parseMessage(content)

      // Assert
      expect(result.activity).toBeNull()
    })

    it('should return the message unchanged when it contains no activity', () => {
      // Arrange — an ordinary chat reply with no JSON block at all
      const content = 'Wat fijn dat je even tijd voor jezelf neemt.'

      // Act
      const result = parseMessage(content)

      // Assert
      expect(result.activity).toBeNull()
      expect(result.textBefore).toBe(content)
      expect(result.textAfter).toBe('')
    })
  })

  describe('toCreatePayload', () => {
    it('should map pipe-separated categories to their ids', () => {
      // Arrange
      const activity = {
        title: 'Wandelen',
        category: 'Head|Hands',
        duration_minutes: 15,
      }

      // Act
      const payload = toCreatePayload(activity)

      // Assert
      expect(payload.category_ids).toEqual([1, 2])
      expect(payload.source).toBe('ai')
    })

    it('should fall back to defaults for missing optional fields', () => {
      // Arrange — no description, no stress bounds, unknown category
      const activity = {
        title: 'Wandelen',
        category: 'Onbekend',
        duration_minutes: 15,
      }

      // Act
      const payload = toCreatePayload(activity)

      // Assert
      expect(payload.description).toBeNull()
      expect(payload.min_stress_level).toBe(1)
      expect(payload.max_stress_level).toBe(5)
      expect(payload.category_ids).toEqual([1])
    })
  })
})
