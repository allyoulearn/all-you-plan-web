import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import SnoozeUntilPopover from '@/components/chores/SnoozeUntilPopover.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('SnoozeUntilPopover', () => {
  it('renders a date input and confirm button', () => {
    const wrapper = mount(SnoozeUntilPopover, { global: { plugins: [i18n] } })
    expect(wrapper.find('input[type=date]').exists()).toBe(true)
    expect(wrapper.find('button.snooze-until-popover__confirm').exists()).toBe(true)
  })

  it('emits "confirm" with the selected ISO date on confirm', async () => {
    const wrapper = mount(SnoozeUntilPopover, { global: { plugins: [i18n] } })
    await wrapper.find('input[type=date]').setValue('2026-06-01')
    await wrapper.find('button.snooze-until-popover__confirm').trigger('click')
    const emitted = wrapper.emitted('confirm')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toBe('2026-06-01')
  })

  it('emits "cancel" on cancel button', async () => {
    const wrapper = mount(SnoozeUntilPopover, { global: { plugins: [i18n] } })
    await wrapper.find('button.snooze-until-popover__cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('disables confirm when date is empty', () => {
    const wrapper = mount(SnoozeUntilPopover, { global: { plugins: [i18n] } })
    const btn = wrapper.find('button.snooze-until-popover__confirm')
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
