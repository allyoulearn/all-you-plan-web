import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import AllDoneCard from '@/components/chores/AllDoneCard.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('AllDoneCard', () => {
  it('renders the celebration title and subline', () => {
    const wrapper = mount(AllDoneCard, { global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain('All caught up today')
    expect(wrapper.text()).toContain('See you tomorrow')
  })

  it('has role=status for screen readers', () => {
    const wrapper = mount(AllDoneCard, { global: { plugins: [i18n] } })
    expect(wrapper.attributes('role')).toBe('status')
  })
})
