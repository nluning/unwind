import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'

const needRefresh = ref(false)
const updateServiceWorker = vi.fn()

vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW: () => ({ needRefresh, offlineReady: ref(false), updateServiceWorker }),
}))

import UpdateToast from '../../src/components/UpdateToast.vue'

describe('UpdateToast', () => {
  beforeEach(() => {
    needRefresh.value = false
    updateServiceWorker.mockClear()
  })

  it('renders nothing while no update is waiting', () => {
    const wrapper = mount(UpdateToast)
    expect(wrapper.find('[data-test="update-toast"]').exists()).toBe(false)
  })

  it('activates the waiting service worker when the user taps reload', async () => {
    needRefresh.value = true
    const wrapper = mount(UpdateToast)
    await wrapper.find('[data-test="update-now"]').trigger('click')
    expect(updateServiceWorker).toHaveBeenCalledOnce()
  })

  it('hides the toast on "later" without activating the update', async () => {
    needRefresh.value = true
    const wrapper = mount(UpdateToast)
    await wrapper.find('[data-test="update-later"]').trigger('click')
    expect(wrapper.find('[data-test="update-toast"]').exists()).toBe(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
  })
})
