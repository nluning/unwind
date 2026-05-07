import 'virtual:uno.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import router from './router/index.js'
import nl from './locales/nl.json'

const i18n = createI18n({
    locale: 'nl',
    fallbackLocale: 'nl',
    legacy: false,
    messages: {
        nl,
    },
})

const app = createApp(App)

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
    })
}

app.use(i18n)
app.use(router)
app.mount('#app')