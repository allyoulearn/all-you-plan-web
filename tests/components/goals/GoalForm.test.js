import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import GoalForm from '@/components/goals/GoalForm.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :data-placeholder="placeholder" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }
}

function baseModel(overrides = {}) {
  return { title: '', why: '', targetDate: '', ...overrides }
}

function mountForm(props = {}) {
  return mount(GoalForm, {
    props: { modelValue: baseModel(), ...props },
    global: { plugins: [i18n], stubs: globalStubs }
  })
}

describe('GoalForm', () => {
  it('renders title, why, and target-date fields', () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[data-placeholder="A short, vivid name…"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
  })

  it('emits update:modelValue when the title changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted.at(-1)[0].title).toBe('Memoir')
  })

  it('emits update:modelValue when the why changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('because it matters')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted.at(-1)[0].why).toBe('because it matters')
  })

  it('emits update:modelValue when the target date changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[type="date"]').setValue('2026-12-31')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted.at(-1)[0].targetDate).toBe('2026-12-31')
  })

  it('emits valid=false when any required field is empty', () => {
    const wrapper = mountForm({ modelValue: baseModel({ title: 'X', why: 'Y' }) })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(false)
  })

  it('emits valid=true once all three fields are populated', () => {
    const wrapper = mountForm({
      modelValue: baseModel({ title: 'X', why: 'Y', targetDate: '2026-12-31' })
    })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(true)
  })

  it('emits valid=false when target date does not match YYYY-MM-DD', () => {
    const wrapper = mountForm({
      modelValue: baseModel({ title: 'X', why: 'Y', targetDate: 'not-a-date' })
    })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(false)
  })
})
