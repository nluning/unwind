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
        DEFAULT: '#2c6e49',
        light: '#e8f5e9',
      },
      muted: '#888',
      error: '#c0392b',
    },
  },
})
