import { ref } from 'vue'

const WELCOMED_KEY = 'unwind-welcomed'

// Module-level ref so App.vue (hiding chrome) and SuggestPage (rendering the
// landing) share one reactive source of truth without prop drilling.
const isWelcomed = ref(!!localStorage.getItem(WELCOMED_KEY))

export function useWelcome() {
    function dismiss() {
        localStorage.setItem(WELCOMED_KEY, '1')
        isWelcomed.value = true
    }
    return { isWelcomed, dismiss }
}
