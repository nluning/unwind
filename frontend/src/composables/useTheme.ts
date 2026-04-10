import { ref, watchEffect } from 'vue'

export type ColorScheme = 'calm' | 'warm' | 'playful'
export type Mode = 'light' | 'dark'

const COLOR_SCHEMES: ColorScheme[] = ['calm', 'warm', 'playful']
const MODES: Mode[] = ['light', 'dark']

const SCHEME_KEY = 'unwind-color-scheme'
const MODE_KEY = 'unwind-mode'

function getStoredScheme(): ColorScheme {
  const stored = localStorage.getItem(SCHEME_KEY)
  return COLOR_SCHEMES.includes(stored as ColorScheme) ? (stored as ColorScheme) : 'calm'
}

function getStoredMode(): Mode {
  const stored = localStorage.getItem(MODE_KEY)
  return MODES.includes(stored as Mode) ? (stored as Mode) : 'dark'
}

const colorScheme = ref<ColorScheme>(getStoredScheme())
const mode = ref<Mode>(getStoredMode())

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', colorScheme.value)
  document.documentElement.setAttribute('data-mode', mode.value)
  localStorage.setItem(SCHEME_KEY, colorScheme.value)
  localStorage.setItem(MODE_KEY, mode.value)
})

export function useTheme() {
  function setColorScheme(scheme: ColorScheme) {
    colorScheme.value = scheme
  }

  function toggleMode() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { colorScheme, mode, setColorScheme, toggleMode }
}
