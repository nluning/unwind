import { readonly, ref } from 'vue'

// Two sources, because neither is reliable alone: the browser's online/offline
// events (`navigator.onLine` is true on captive portals and dead WiFi), and what
// happened to our requests (`setOnline`, from the api client), which is stronger evidence.
const online = ref(navigator.onLine)

window.addEventListener('online', () => {
  online.value = true
})
window.addEventListener('offline', () => {
  online.value = false
})

export function setOnline(value: boolean) {
  online.value = value
}

export function useOnline() {
  return { isOnline: readonly(online) }
}
