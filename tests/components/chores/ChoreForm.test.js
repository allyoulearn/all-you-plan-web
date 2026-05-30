import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import ChoreForm from '@/components/chores/ChoreForm.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppSegmentedControl: {
    props: ['modelValue', 'options', 'groupLabel'],
    emits: ['update:modelValue'],
    template:
      '<div><button v-for="o in options" :key="o.value" type="button" :data-value="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  }
}

function baseModel(overrides = {}) {
  return {
    title: '',
    cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: 1 },
    active: true,
    ...overrides
  }
}

describe('ChoreForm', () => {
  it('renders title field and cadence segments', () => {
    const wrapper = mount(ChoreForm, {
      props: { modelValue: baseModel() },
      global: { plugins: [i18n], stubs: globalStubs }
    })

    expect(wrapper.find('input[data-label="Title"]').exists()).toBe(true)
    expect(wrapper.find('button[data-value="daily"]').exists()).toBe(true)
    expect(wrapper.find('button[data-value="weekly"]').exists()).toBe(true)
    expect(wrapper.find('button[data-value="monthly"]').exists()).toBe(true)
  })

  it('shows the cadence preview line', () => {
    const wrapper = mount(ChoreForm, {
      props: {
        modelValue: baseModel({
          title: 'X',
          cadence: { type: 'weekly', daysOfWeek: [1, 3, 5], interval: 1, dayOfMonth: null }
        })
      },
      global: { plugins: [i18n], stubs: globalStubs }
    })

    expect(wrapper.text()).toContain('Repeats')
  })

  it('emits update:modelValue when title changes', async () => {
    const wrapper = mount(ChoreForm, {
      props: { modelValue: baseModel() },
      global: { plugins: [i18n], stubs: globalStubs }
    })

    await wrapper.find('input[data-label="Title"]').setValue('Walk')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0].title).toBe('Walk')
  })

  it('emits valid=true once title and cadence are valid', async () => {
    const wrapper = mount(ChoreForm, {
      props: { modelValue: baseModel({ title: 'X' }) },
      global: { plugins: [i18n], stubs: globalStubs }
    })

    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(true)
  })
})
