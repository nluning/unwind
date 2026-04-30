import { defineConfig, presetUno, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:300,400,500,600',
        serif: 'Fraunces:300,400,500,600,700',
      },
    }),
  ],
  theme: {
    colors: {
      uw: {
        ink: {
          DEFAULT: 'var(--uw-ink)',
          soft: 'var(--uw-ink-soft)',
          mute: 'var(--uw-ink-mute)',
        },
        primary: {
          DEFAULT: 'var(--uw-primary)',
          soft: 'var(--uw-primary-soft)',
          fg: 'var(--uw-primary-fg)',
        },
        border: {
          DEFAULT: 'var(--uw-border)',
          soft: 'var(--uw-border-soft)',
        },
        chip: 'var(--uw-chip-bg)',
        accent: 'var(--uw-accent-soft)',
        menu: 'var(--uw-menu-bg)',
        page: 'var(--uw-page-bg)',
        danger: 'var(--uw-danger)',
      },
    },
  },
})
