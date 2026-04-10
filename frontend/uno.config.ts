import { defineConfig, presetUno, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600',
      },
    }),
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: 'var(--c-primary)',
        light: 'var(--c-primary-light)',
      },
      surface: 'var(--c-surface)',
      card: 'var(--c-card)',
      dim: 'var(--c-text-dim)',
      muted: 'var(--c-text-muted)',
      chip: 'var(--c-chip-bg)',
      outline: 'var(--c-border)',
      error: 'var(--c-error)',
      accepted: 'var(--c-accepted)',
    },
  },
})
