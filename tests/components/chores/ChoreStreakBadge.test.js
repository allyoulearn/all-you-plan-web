import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import ChoreStreakBadge from '@/components/chores/ChoreStreakBadge.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('ChoreStreakBadge', () => {
  it('renders the current streak number', () => {
    const wrapper = mount(ChoreStreakBadge, {
      props: { streak: 7, bestStreak: 14 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).toContain('7')
  })

  it('shows "best N" subline when current < best', () => {
    const wrapper = mount(ChoreStreakBadge, {
      props: { streak: 7, bestStreak: 14 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).toContain('best 14')
  })

  it('omits the subline when current >= best', () => {
    const wrapper = mount(ChoreStreakBadge, {
      props: { streak: 14, bestStreak: 14 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).not.toContain('best')
  })

  it('omits the subline when current is 0', () => {
    const wrapper = mount(ChoreStreakBadge, {
      props: { streak: 0, bestStreak: 5 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).not.toContain('best')
  })
})
