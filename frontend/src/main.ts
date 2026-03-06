import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
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

app.use(i18n)
app.mount('#app')