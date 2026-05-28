import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LeftoverRow from '@/components/review/LeftoverRow.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const AppDatePickerStub = {
  name: 'AppDatePicker',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template:
    '<input type="date" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
}

function mountRow(props = {}) {
  return mount(LeftoverRow, {
    props: {
      task: { id: 't1', title: 'Code review' },
      action: { kind: 'tomorrow' },
      ...props
    },
    global: { plugins: [i18n], stubs: { AppDatePicker: AppDatePickerStub } }
  })
}

describe('LeftoverRow', () => {
  it('renders the task title', () => {
    const wrapper = mountRow()
    expect(wrapper.text()).toContain('Code review')
  })

  it('renders four action chips', () => {
    const wrapper = mountRow()
    expect(wrapper.findAll('.leftover-row__chip')).toHaveLength(4)
  })

  it('marks the matching chip as pressed', () => {
    const wrapper = mountRow({ action: { kind: 'drop' } })
    const pressed = wrapper.findAll('.leftover-row__chip').filter(c => c.attributes('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    expect(pressed[0].text().toLowerCase()).toContain('drop')
  })

  it('emits update:action with kind tomorrow on the Tomorrow chip click', async () => {
    const wrapper = mountRow({ action: { kind: 'keep' } })
    const chips = wrapper.findAll('.leftover-row__chip')
    const tomorrow = chips.find(c => c.text().toLowerCase().includes('tomorrow'))
    await tomorrow.trigger('click')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'tomorrow' })
  })

  it('emits update:action with kind drop on the Drop chip click', async () => {
    const wrapper = mountRow()
    const drop = wrapper.findAll('.leftover-row__chip').find(c => c.text().toLowerCase().includes('drop'))
    await drop.trigger('click')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'drop' })
  })

  it('shows a date input when action kind is pick', () => {
    const wrapper = mountRow({ action: { kind: 'pick', date: '2026-06-01' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('2026-06-01')
  })

  it('emits update:action with kind pick + chosen date on date input change', async () => {
    const wrapper = mountRow({ action: { kind: 'pick', date: '' } })
    const input = wrapper.find('input[type="date"]')
    await input.setValue('2026-06-05')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'pick', date: '2026-06-05' })
  })
})
