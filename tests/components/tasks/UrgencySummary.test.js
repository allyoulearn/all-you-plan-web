import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import UrgencySummary from '@/components/tasks/UrgencySummary.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const globalConfig = { plugins: [i18n] }

const summary = { total: 6, overdue: 2, dated: 4, critical: 3, high: 1, doneRecently: 5 }

function mountSummary(props = {}) {
  return mount(UrgencySummary, {
    props: { summary, upcoming: 2, ...props },
    global: globalConfig
  })
}

describe('UrgencySummary', () => {
  it('renders four cells', () => {
    const wrapper = mountSummary()
    expect(wrapper.findAll('.urgency-summary__cell')).toHaveLength(4)
  })

  it('shows the critical / high counts from the summary', () => {
    const wrapper = mountSummary()
    const counts = wrapper.findAll('.urgency-summary__count').map(c => c.text())
    expect(counts[0]).toBe('3') // critical
    expect(counts[1]).toBe('1') // high
    expect(counts[2]).toBe('2') // overdue
    expect(counts[3]).toBe('2') // upcoming (from the prop)
  })

  it('labels the cells', () => {
    const wrapper = mountSummary()
    expect(wrapper.text()).toContain('Critical')
    expect(wrapper.text()).toContain('High')
    expect(wrapper.text()).toContain('Overdue')
    expect(wrapper.text()).toContain('Upcoming deadlines')
  })

  it('marks the crit/over cells with their tone classes', () => {
    const wrapper = mountSummary()
    expect(wrapper.find('.urgency-summary__cell--crit').exists()).toBe(true)
    expect(wrapper.find('.urgency-summary__cell--high').exists()).toBe(true)
    expect(wrapper.find('.urgency-summary__cell--over').exists()).toBe(true)
  })

  it('emits select=urgency when Critical or High is clicked', async () => {
    const wrapper = mountSummary()
    const cells = wrapper.findAll('.urgency-summary__cell')
    await cells[0].trigger('click') // Critical
    await cells[1].trigger('click') // High
    expect(wrapper.emitted('select')).toEqual([['urgency'], ['urgency']])
  })

  it('emits select=due when Overdue or Upcoming is clicked', async () => {
    const wrapper = mountSummary()
    const cells = wrapper.findAll('.urgency-summary__cell')
    await cells[2].trigger('click') // Overdue
    await cells[3].trigger('click') // Upcoming
    expect(wrapper.emitted('select')).toEqual([['due'], ['due']])
  })

  it('falls back to zero counts when summary is null', () => {
    const wrapper = mountSummary({ summary: null, upcoming: 0 })
    const counts = wrapper.findAll('.urgency-summary__count').map(c => c.text())
    expect(counts).toEqual(['0', '0', '0', '0'])
  })
})
