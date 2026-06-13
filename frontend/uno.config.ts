import { defineConfig, presetUno, presetWebFonts } from 'unocss'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Inter:300,400,500,600',
        serif: 'Newsreader:300,400,500,600,700',
      },
      // Self-host: download the woff2 files at build time and serve them from
      // our own domain. No runtime request to Google — user IPs never leak.
      processors: createLocalFontProcessor({
        cacheDir: 'node_modules/.cache/unocss/fonts',
        fontAssetsDir: 'public/assets/fonts',
        fontServeBaseUrl: '/assets/fonts',
      }),
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
