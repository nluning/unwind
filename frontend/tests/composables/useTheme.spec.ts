import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useTheme } from '../../src/composables/useTheme'

describe('useTheme', () => {
  describe('useTheme', () => {
    it('should apply the selected colour scheme to the document and persist it', async () => {
      // Arrange
      const { colorScheme, setColorScheme } = useTheme()
      colorScheme.value = 'calm'
      await nextTick()

      // Act
      setColorScheme('warm')
      await nextTick()

      // Assert
      expect(document.documentElement.getAttribute('data-theme')).toBe('warm')
      expect(localStorage.getItem('unwind-color-scheme')).toBe('warm')
    })

    it('should toggle between dark and light, mirroring it onto the document', async () => {
      // Arrange
      const { mode, toggleMode } = useTheme()
      mode.value = 'dark'
      await nextTick()

      // Act
      toggleMode()
      await nextTick()

      // Assert
      expect(mode.value).toBe('light')
      expect(document.documentElement.getAttribute('data-mode')).toBe('light')
    })
  })
})
