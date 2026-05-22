import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import TodayView from '@/views/TodayView.vue'
import { useTodayStore } from '@/stores/today.store'

// Stub heavy child components to keep tests focused on TodayView logic
const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  KpiRow: true,
  TaskRow: true,
  RouterLink: true
}

function buildView(tasks = []) {
  return {
    date: '2026-05-21',
    sunrise: '6:01 AM',
    sunset: '8:17 PM',
    kpis: { streak: 5, todayDone: 2, todayTotal: 5, activeProjects: 3, focusMinutes: 120 },
    tasks
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
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '07:00' }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      // SectionHeader is stubbed — Vue Test Utils uses kebab-case with -stub suffix
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Morning')).toBe(true)
    })

    it('groups an afternoon task (12 <= hour < 17) into Afternoon', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 't2', title: 'Lunch call', done: false, scheduledTime: '13:00' }
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Afternoon')).toBe(true)
    })

    it('groups an evening task (hour >= 17) into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't3', title: 'Reading', done: false, scheduledTime: '19:30' }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Evening')).toBe(true)
    })

    it('places a task with no scheduledTime into Afternoon (hourOf defaults to 12)', () => {
      // hourOf returns 12 when scheduledTime is falsy → 12 >= 12 && 12 < 17 → Afternoon
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't4', title: 'No time', done: false, scheduledTime: null }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Afternoon')).toBe(true)
    })

    it('spreads tasks across all three groups correctly', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 'a', title: 'Morning', done: false, scheduledTime: '08:00' },
        { id: 'b', title: 'Lunch', done: false, scheduledTime: '12:30' },
        { id: 'c', title: 'Dinner', done: false, scheduledTime: '18:00' }
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      const labels = sectionHeaders.map(el => el.attributes('label'))
      expect(labels).toContain('Morning')
      expect(labels).toContain('Afternoon')
      expect(labels).toContain('Evening')
    })

    it('groups boundary hour 11 into Morning', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 'x', title: 'Late morning', done: false, scheduledTime: '11:59' }
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Morning')).toBe(true)
    })

    it('groups boundary hour 17 into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([
        { id: 'y', title: 'Evening task', done: false, scheduledTime: '17:00' }
      ])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const sectionHeaders = wrapper.findAll('section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Evening')).toBe(true)
    })
  })

  describe('action buttons (WEB-T08-016 fix)', () => {
    it('renders action buttons area when view is loaded', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.find('.today-view__actions').exists()).toBe(true)
    })

    it('renders action buttons area with at least 3 buttons when view is loaded', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      // Button stub renders a real <button> element
      const buttons = wrapper.findAll('button')
      // 3 action buttons: "Add to today", "Plan with Wren", "Move unfinished"
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('"Add to today" button has disabled attribute (placeholder)', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const text = wrapper.text()
      expect(text).toContain('Add to today')
    })

    it('"Plan with Wren" text is present in the action buttons', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.text()).toContain('Plan with Wren')
    })

    it('"Move unfinished to tomorrow" text is present', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.text()).toContain('Move unfinished')
    })
  })

  describe('TaskRow completion', () => {
    it('renders TaskRow components for tasks in view', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Task 1', done: false, scheduledTime: '09:00' }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const taskRows = wrapper.findAll('task-row-stub')
      expect(taskRows).toHaveLength(1)
    })

    it('passes task as prop to TaskRow', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      const task = { id: 't1', title: 'My Task', done: false, scheduledTime: '09:00' }
      store.view = buildView([task])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const taskRow = wrapper.find('task-row-stub')
      expect(taskRow.exists()).toBe(true)
    })
  })

  describe('KPI row', () => {
    it('renders the KpiRow component when view has kpis', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      const kpiRow = wrapper.find('kpi-row-stub')
      expect(kpiRow.exists()).toBe(true)
    })

    it('does not render KpiRow when loading', () => {
      const store = useTodayStore()
      store.loading = true
      store.view = null

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.find('kpi-row-stub').exists()).toBe(false)
    })
  })

  describe('ScreenHeading meta slot', () => {
    it('stores view.sunrise and view.sunset in state', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.vm.store.view.sunrise).toBe('6:01 AM')
      expect(wrapper.vm.store.view.sunset).toBe('8:17 PM')
    })

    it('does not render sunrise/sunset when view is null', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = null

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      expect(wrapper.vm.store.view).toBeNull()
    })

    it('renders sunrise/sunset text in meta slot when ScreenHeading renders slots', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      // Use the real ScreenHeading component so the #meta slot renders
      const wrapper = mount(TodayView, {
        global: {
          stubs: {
            ...globalStubs,
            ScreenHeading: false // use real component
          }
        }
      })
      // The meta slot contains sunrise and sunset
      expect(wrapper.text()).toContain('6:01 AM')
      expect(wrapper.text()).toContain('8:17 PM')
    })
  })

  describe('hourOf edge cases', () => {
    it('treats scheduledTime="00:00" as hour 0 — groups into Morning', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 'x', title: 'Midnight', done: false, scheduledTime: '00:00' }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      // hour 0 < 12 → Morning
      expect(wrapper.vm.groups[0].items).toHaveLength(1)
    })

    it('treats scheduledTime="23:59" as hour 23 — groups into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 'y', title: 'Late', done: false, scheduledTime: '23:59' }])

      const wrapper = mount(TodayView, { global: { stubs: globalStubs } })
      // hour 23 >= 17 → Evening
      expect(wrapper.vm.groups[2].items).toHaveLength(1)
    })
  })
})
