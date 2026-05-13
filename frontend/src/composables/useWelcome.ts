import { ref } from 'vue'

const WELCOMED_KEY = 'unwind-welcomed'

// Module-level ref so App.vue (hiding chrome) and SuggestPage (rendering the
// landing) share one reactive source of truth without prop drilling.
const isWelcomed = ref(!!localStorage.getItem(WELCOMED_KEY))

// In-memory only: flips true when the user dismisses the WelcomeCard within
// this session, drives the menu-hint tooltip, doesn't survive reload.
const showMenuHint = ref(false)

export function useWelcome() {
    function dismiss() {
        localStorage.setItem(WELCOMED_KEY, '1')
        isWelcomed.value = true
        showMenuHint.value = true
    }
    function dismissMenuHint() {
        showMenuHint.value = false
    }
    return { isWelcomed, dismiss, showMenuHint, dismissMenuHint }
}
