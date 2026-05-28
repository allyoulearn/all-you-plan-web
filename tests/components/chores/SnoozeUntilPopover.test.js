import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import SnoozeUntilPopover from '@/components/chores/SnoozeUntilPopover.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const AppDatePickerStub = {
  name: 'AppDatePicker',
  template: '<input data-testid="dp" />',
  props: ['modelValue', 'minDate'],
  emits: ['update:modelValue']
}

const mountOpts = {
  global: { plugins: [i18n], stubs: { AppDatePicker: AppDatePickerStub } }
}

describe('SnoozeUntilPopover', () => {
  it('renders the date picker and confirm button', () => {
    const wrapper = mount(SnoozeUntilPopover, mountOpts)
    expect(wrapper.find('[data-testid=dp]').exists()).toBe(true)
    expect(wrapper.find('button.snooze-until-popover__confirm').exists()).toBe(true)
  })

  it('emits "confirm" with the selected ISO date on confirm', async () => {
    const wrapper = mount(SnoozeUntilPopover, mountOpts)
    wrapper.findComponent({ name: 'AppDatePicker' }).vm.$emit('update:modelValue', '2026-06-01')
    await wrapper.vm.$nextTick()
    await wrapper.find('button.snooze-until-popover__confirm').trigger('click')
    const emitted = wrapper.emitted('confirm')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toBe('2026-06-01')
  })

  it('emits "cancel" on cancel button', async () => {
    const wrapper = mount(SnoozeUntilPopover, mountOpts)
    await wrapper.find('button.snooze-until-popover__cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('disables confirm when date is empty', () => {
    const wrapper = mount(SnoozeUntilPopover, mountOpts)
    const btn = wrapper.find('button.snooze-until-popover__confirm')
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
