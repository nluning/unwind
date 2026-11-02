import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setOnline } from '../../src/composables/useOnline'
import OfflineIndicator from '../../src/components/OfflineIndicator.vue'

describe('OfflineIndicator', () => {
  afterEach(() => setOnline(true))

  it('is hidden while online', () => {
    setOnline(true)
    expect(mount(OfflineIndicator).find('[data-test="offline-indicator"]').exists()).toBe(false)
  })

  it('shows when offline and disappears again on reconnect', async () => {
    setOnline(false)
    const wrapper = mount(OfflineIndicator)
    expect(wrapper.find('[data-test="offline-indicator"]').exists()).toBe(true)
    setOnline(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="offline-indicator"]').exists()).toBe(false)
  })
})
