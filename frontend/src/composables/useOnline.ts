import { readonly, ref } from 'vue'

// Whether the app can currently reach the server. Two sources, because neither
// is reliable alone:
// - the browser's online/offline events (instant, but `navigator.onLine` only
//   knows if the device has a network *interface*, not whether the internet or
//   our server is reachable: captive portals and dead WiFi report "online"),
// - what actually happened to our requests (`setOnline`, called by the api
//   client): a request that got no response is stronger evidence than the flag,
//   and any response at all proves we're connected.
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
