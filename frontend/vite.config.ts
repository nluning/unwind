import { fileURLToPath, URL } from 'node:url'

import { defineConfig, coverageConfigDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Upload source maps to Sentry only when an auth token is present — i.e. in CI
// (see deploy.yml). Local and token-less builds skip the plugin entirely, so
// they never attempt a network upload or need credentials.
const sentryPlugins = process.env.SENTRY_AUTH_TOKEN
  ? [
      sentryVitePlugin({
        org: 'script-fs',
        project: 'unwind-frontend',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        // Must match the `release` passed to Sentry.init in main.ts so events
        // and uploaded maps line up. Both come from the git SHA via CI.
        release: { name: process.env.VITE_SENTRY_RELEASE },
        sourcemaps: {
          // Delete .map files after upload so nginx doesn't serve them.
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    ]
  : []

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    UnoCSS(),
    vue(),
    vueDevTools(),
    ...sentryPlugins,
  ],
  build: {
    // Emit source maps so the Sentry plugin has something to upload. Harmless
    // locally (the .map files land in the gitignored dist/ and stay there).
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/__mocks__/**',
        // Trivial presentational SVGs with no logic — shallowMount stubs them so
        // they read 0%; testing them is no value (see issue #91, test skill).
        'src/components/icons/**',
        'src/pages/ChatPage.vue',
        'src/pages/OnboardingPage.vue',
        'src/composables/useChat.ts',
      ],
    },
  },
})
