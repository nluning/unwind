import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FeedbackInterstitial from '../../src/components/FeedbackInterstitial.vue'

vi.mock('../../src/composables/useActivityTranslation')

// The "Na {activity}" line uses <i18n-t> (component interpolation), which needs
// the real plugin; everything else renders through the global $t passthrough.
const i18n = createI18n({
  legacy: false,
  locale: 'nl',
  messages: { nl: { feedback: { after: 'Na {activity}' } } },
})

function mountInterstitial() {
  return mount(FeedbackInterstitial, {
    props: { activity: { title: 'Ga een rondje lopen', source: 'user' } },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

describe('FeedbackInterstitial', () => {
  it('should report which answer the user picked', async () => {
    // Arrange
    const wrapper = mountInterstitial()

    // Act
    await wrapper.find('[data-test="answer-worse"]').trigger('click')

    // Assert
    expect(wrapper.emitted('answer')).toEqual([['worse']])
    wrapper.unmount()
  })

  it('should order the answers from slechter on the left to beter on the right, labelled for assistive tech', () => {
    // Arrange & Act
    const wrapper = mountInterstitial()

    // Assert
    const labels = wrapper
      .findAll('[data-test^="answer-"]')
      .map((button) => button.attributes('aria-label'))
    expect(labels).toEqual(['feedback.worse', 'feedback.same', 'feedback.better'])
    wrapper.unmount()
  })

  it('should remind the user which activity the question is about, with the title emphasised', () => {
    // Arrange & Act
    const wrapper = mountInterstitial()

    // Assert
    const reminder = wrapper.find('[data-test="activity-title"]')
    expect(reminder.text()).toBe('Na Ga een rondje lopen')
    expect(reminder.find('em').text()).toBe('Ga een rondje lopen')
    wrapper.unmount()
  })

  it('should let the user skip the question with the close button', async () => {
    // Arrange
    const wrapper = mountInterstitial()

    // Act
    await wrapper.find('[data-test="skip"]').trigger('click')

    // Assert
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('should treat Escape as skipping the question', async () => {
    // Arrange
    const wrapper = mountInterstitial()

    // Act
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    // Assert
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('should treat a tap outside the dialog as skipping the question', async () => {
    // Arrange
    const wrapper = mountInterstitial()

    // Act
    await wrapper.find('[data-test="backdrop"]').trigger('click')

    // Assert
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('should keep keyboard focus in the dialog when the backdrop is pressed', () => {
    // Arrange
    const wrapper = mountInterstitial()
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })

    // Act — the browser moves focus to <body> on mousedown unless it is cancelled
    wrapper.find('[data-test="backdrop"]').element.dispatchEvent(mousedown)

    // Assert
    expect(mousedown.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('should move keyboard focus into the dialog when it opens', () => {
    // Arrange & Act
    const wrapper = mountInterstitial()

    // Assert
    expect(document.activeElement).toBe(wrapper.find('[role="dialog"]').element)
    wrapper.unmount()
  })

  it('should keep Tab inside the dialog by wrapping from the last button to the first', async () => {
    // Arrange
    const wrapper = mountInterstitial()
    const buttons = wrapper.findAll('button')
    ;(buttons[buttons.length - 1]!.element as HTMLElement).focus()

    // Act
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Tab' })

    // Assert
    expect(document.activeElement).toBe(buttons[0]!.element)
    wrapper.unmount()
  })

  it('should give focus back to where the user was when it closes', () => {
    // Arrange
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mountInterstitial()

    // Act
    wrapper.unmount()

    // Assert
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
