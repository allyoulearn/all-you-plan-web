import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import TodayView from './TodayView.vue'
import { useTodayStore } from '@/stores/today.store'

// Stub heavy child components to keep tests focused on TodayView logic
const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Button: true,
  KpiRow: true,
  TaskRow: true,
  RouterLink: true,
}

function buildView(tasks = []) {
  return {
    date: '2026-05-21',
    sunrise: '6:01 AM',
    sunset: '8:17 PM',
    kpis: { streak: 5, todayDone: 2, todayTotal: 5, activeProjects: 3, focusMinutes: 120 },
    tasks,
  }
}

describe('TodayView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  it('shows the loading indicator while loading', () => {
    const store = useTodayStore()
    store.loading = true
    store.error = ''
    store.view = null

    const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows the error message when there is an error', () => {
    const store = useTodayStore()
    store.loading = false
    store.error = 'Something went wrong'
    store.view = null

    const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('shows the empty-state message when view has no tasks', () => {
    const store = useTodayStore()
    store.loading = false
    store.error = ''
    store.view = buildView([])

    const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
    expect(wrapper.text()).toContain('Nothing scheduled for today')
  })

  it('calls store.load() on mount', () => {
    const store = useTodayStore()
    mount(TodayView, { global: { stubs: globalStubs } })
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  describe('groups computed', () => {
    it('groups a morning task (hour < 12) into Morning', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 't1', title: 'Run', done: false, scheduledTime: '07:00' },
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      // SectionHeader is stubbed — Vue Test Utils uses kebab-case with -stub suffix
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some((el) => el.attributes('label') === 'Morning')).toBe(true)
    })

    it('groups an afternoon task (12 <= hour < 17) into Afternoon', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 't2', title: 'Lunch call', done: false, scheduledTime: '13:00' },
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some((el) => el.attributes('label') === 'Afternoon')).toBe(true)
    })

    it('groups an evening task (hour >= 17) into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 't3', title: 'Reading', done: false, scheduledTime: '19:30' },
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some((el) => el.attributes('label') === 'Evening')).toBe(true)
    })

    it('places a task with no scheduledTime into Afternoon (hourOf defaults to 12)', () => {
      // hourOf returns 12 when scheduledTime is falsy → 12 >= 12 && 12 < 17 → Afternoon
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 't4', title: 'No time', done: false, scheduledTime: null },
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some((el) => el.attributes('label') === 'Afternoon')).toBe(true)
    })

    it('spreads tasks across all three groups correctly', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 'a', title: 'Morning', done: false, scheduledTime: '08:00' },
        { id: 'b', title: 'Lunch', done: false, scheduledTime: '12:30' },
        { id: 'c', title: 'Dinner', done: false, scheduledTime: '18:00' },
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      const labels = sectionHeaders.map((el) => el.attributes('label'))
      expect(labels).toContain('Morning')
      expect(labels).toContain('Afternoon')
      expect(labels).toContain('Evening')
    })
  })
})
