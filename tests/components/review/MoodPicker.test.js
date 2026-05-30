import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import MoodPicker from '@/components/review/MoodPicker.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const stubs = {
  AppButton: {
    template: '<button :aria-checked="ariaChecked" @click="$emit(\'click\')"><slot /></button>',
    props: ['ariaChecked'],
    emits: ['click']
  }
}

function mountPicker(props = {}) {
  return mount(MoodPicker, {
    props: { modelValue: '', ...props },
    global: { plugins: [i18n], stubs }
  })
}

describe('MoodPicker', () => {
  it('renders five mood pills with the new labels', () => {
    const wrapper = mountPicker()

    for (const label of ['heavy', 'low', 'steady', 'good', 'lit']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('emits update:modelValue with the lowercase label on click', async () => {
    const wrapper = mountPicker()
    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click') // steady
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['steady'])
  })

  it('marks the matching pill as checked when modelValue is set', () => {
    const wrapper = mountPicker({ modelValue: 'good' })
    const buttons = wrapper.findAll('button')
    const checked = buttons.filter(b => b.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0].text()).toContain('good')
  })

  it('accepts legacy mood values without crashing (no selection rendered)', () => {
    const wrapper = mountPicker({ modelValue: 'alight' })
    const checked = wrapper.findAll('button').filter(b => b.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(0)
  })

  it('uses radiogroup role with an aria-label', () => {
    const wrapper = mountPicker()
    const group = wrapper.find('[role="radiogroup"]')
    expect(group.exists()).toBe(true)
    expect(group.attributes('aria-label')).toBeTruthy()
  })
})
