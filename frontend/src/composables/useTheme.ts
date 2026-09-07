import { ref, watchEffect } from 'vue'

export type ColorScheme = 'calm' | 'warm' | 'playful'

const COLOR_SCHEMES: ColorScheme[] = ['calm', 'warm', 'playful']

const SCHEME_KEY = 'unwind-color-scheme'

function getStoredScheme(): ColorScheme {
  const stored = localStorage.getItem(SCHEME_KEY)
  return COLOR_SCHEMES.includes(stored as ColorScheme) ? (stored as ColorScheme) : 'calm'
}

const colorScheme = ref<ColorScheme>(getStoredScheme())

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', colorScheme.value)
  localStorage.setItem(SCHEME_KEY, colorScheme.value)
})

export function useTheme() {
  function setColorScheme(scheme: ColorScheme) {
    colorScheme.value = scheme
  }

  return { colorScheme, setColorScheme }
}
