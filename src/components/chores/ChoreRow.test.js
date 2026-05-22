import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoreRow from './ChoreRow.vue'

const baseChore = {
  id: 'c1',
  title: 'Morning walk',
  cadence: { type: 'daily', daysOfWeek: [], interval: null, dayOfMonth: null },
  streak: 7,
  bestStreak: 14,
  lastCompletedOn: null,
  active: true,
  order: 0,
}

describe('ChoreRow', () => {
  it('renders the chore title and streak', () => {
    const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
    expect(wrapper.text()).toContain('Morning walk')
    expect(wrapper.text()).toContain('7d')
  })

  it('emits complete with chore id when checkbox is clicked', async () => {
    const wrapper = mount(ChoreRow, { props: { chore: baseChore } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('complete')[0]).toEqual(['c1'])
  })

  it('shows title as muted when completed today', () => {
    const today = new Date().toISOString().slice(0, 10)
    const chore = { ...baseChore, lastCompletedOn: today }
    const wrapper = mount(ChoreRow, { props: { chore } })
    expect(wrapper.find('.text-muted').exists()).toBe(true)
  })
})
