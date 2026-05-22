import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoreRow from '@/components/chores/ChoreRow.vue'

const baseChore = {
  id: 'c1',
  title: 'Morning walk',
  cadence: { type: 'daily', daysOfWeek: [], interval: null, dayOfMonth: null },
  streak: 7,
  bestStreak: 14,
  lastCompletedOn: null,
  active: true,
  order: 0
}

describe('ChoreRow', () => {
  describe('rendering', () => {
    it('renders the chore title', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.text()).toContain('Morning walk')
    })

    it('renders the streak with "d" suffix', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.text()).toContain('7d')
    })

    it('renders daily cadence as "Daily" (WEB-T07-017: no raw enum)', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.text()).toContain('Daily')
      expect(wrapper.text()).not.toContain('daily')
    })

    it('renders weekly cadence as "Weekly"', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'weekly', daysOfWeek: [], interval: null, dayOfMonth: null }
      }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.text()).toContain('Weekly')
    })

    it('renders monthly cadence as "Monthly"', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'monthly', daysOfWeek: [], interval: null, dayOfMonth: null }
      }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.text()).toContain('Monthly')
    })

    it('falls back to raw value for unknown cadence type', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'custom', daysOfWeek: [], interval: null, dayOfMonth: null }
      }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.text()).toContain('custom')
    })
  })

  describe('completion state', () => {
    it('shows title as active when not completed today', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.find('.chore-row__title--active').exists()).toBe(true)
      expect(wrapper.find('.chore-row__title--muted').exists()).toBe(false)
    })

    it('shows title as muted when completed today (local date)', () => {
      // Uses toLocaleDateString('en-CA') — produce same format for the fixture
      const today = new Date().toLocaleDateString('en-CA')
      const chore = { ...baseChore, lastCompletedOn: today }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.find('.chore-row__title--muted').exists()).toBe(true)
    })

    it('shows title as active when lastCompletedOn is yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const chore = { ...baseChore, lastCompletedOn: yesterday.toLocaleDateString('en-CA') }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.find('.chore-row__title--active').exists()).toBe(true)
    })

    it('shows title as active when lastCompletedOn is null', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.find('.chore-row__title--active').exists()).toBe(true)
    })

    it('isCompletedToday returns false for null (via checkbox not checked)', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      // Checkbox receives false model-value: renders with unchecked class
      expect(wrapper.find('.checkbox--unchecked').exists()).toBe(true)
    })

    it('checkbox is checked when completed today', () => {
      const today = new Date().toLocaleDateString('en-CA')
      const chore = { ...baseChore, lastCompletedOn: today }
      const wrapper = mount(ChoreRow, { props: { chore } })
      expect(wrapper.find('.checkbox--checked').exists()).toBe(true)
    })
  })

  describe('emits', () => {
    it('emits complete with chore id when checkbox is clicked', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('complete')[0]).toEqual(['c1'])
    })

    it('emits complete with the correct id for a different chore', async () => {
      const chore = { ...baseChore, id: 'c99' }
      const wrapper = mount(ChoreRow, { props: { chore } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('complete')[0]).toEqual(['c99'])
    })
  })

  describe('structure', () => {
    it('has a chore-row__body flex container', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.find('.chore-row__body').exists()).toBe(true)
    })

    it('has a chore-row__streak element', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
      expect(wrapper.find('.chore-row__streak').exists()).toBe(true)
    })
  })
})
