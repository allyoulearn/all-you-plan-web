import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import ChoresEmpty from '@/components/chores/ChoresEmpty.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('ChoresEmpty', () => {
  it('renders headline, sub, and primary CTA', () => {
    const wrapper = mount(ChoresEmpty, { global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain('Build your first habit')
    expect(wrapper.text()).toContain('Start small and daily')
    expect(wrapper.find('button').text()).toContain('New chore')
  })

  it('emits "create" when the CTA is clicked', async () => {
    const wrapper = mount(ChoresEmpty, { global: { plugins: [i18n] } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })
})
