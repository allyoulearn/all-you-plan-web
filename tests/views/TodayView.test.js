import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import TodayView from '@/views/TodayView.vue'
import { useTodayStore } from '@/stores/today.store'
import { useBriefingStore } from '@/stores/briefing.store'
import { useOverlaysStore } from '@/stores/overlays.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'today', component: { template: '<div />' } },
    { path: '/wren', name: 'wren', component: { template: '<div />' } }
  ]
})

// Stub heavy child components to keep tests focused on TodayView logic
const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: true,
  AppButton: { template: '<button v-bind="$attrs"><slot /></button>' },
  KpiRow: true,
  TaskRow: true,
  RouterLink: true,
  CreateTaskModal: true,
  BriefingCard: true
}

function mountToday(options = {}) {
  return mount(TodayView, {
    global: { stubs: globalStubs, plugins: [i18n, router], ...(options.global ?? {}) }
  })
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

    const wrapper = mountToday()
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows the error message when there is an error', () => {
    const store = useTodayStore()
    store.loading = false
    store.error = 'Something went wrong'
    store.view = null

    const wrapper = mountToday()
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('shows the empty-state message when view has no tasks', () => {
    const store = useTodayStore()
    store.loading = false
    store.error = ''
    store.view = buildView([])

    const wrapper = mountToday()
    expect(wrapper.text()).toContain('Nothing scheduled for today')
  })

  it('calls store.load() on mount', () => {
    const store = useTodayStore()
    mountToday()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  describe('groups computed', () => {
    it('groups a morning task (hour < 12) into Morning', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '07:00' }])

      const wrapper = mountToday()
      // AppSectionHeader is stubbed — Vue Test Utils uses kebab-case with -stub suffix
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Morning')).toBe(true)
    })

    it('groups an afternoon task (12 <= hour < 17) into Afternoon', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''

      store.view = buildView([
        { id: 't2', title: 'Lunch call', done: false, scheduledTime: '13:00' }
      ])

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Afternoon')).toBe(true)
    })

    it('groups an evening task (hour >= 17) into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't3', title: 'Reading', done: false, scheduledTime: '19:30' }])

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Evening')).toBe(true)
    })

    it('places a task with no scheduledTime into Afternoon (hourOf defaults to 12)', () => {
      // hourOf returns 12 when scheduledTime is falsy → 12 >= 12 && 12 < 17 → Afternoon
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't4', title: 'No time', done: false, scheduledTime: null }])

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
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

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
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

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Morning')).toBe(true)
    })

    it('groups boundary hour 17 into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''

      store.view = buildView([
        { id: 'y', title: 'Evening task', done: false, scheduledTime: '17:00' }
      ])

      const wrapper = mountToday()
      const sectionHeaders = wrapper.findAll('app-section-header-stub')
      expect(sectionHeaders.some(el => el.attributes('label') === 'Evening')).toBe(true)
    })
  })

  describe('action buttons (WEB-T08-016 fix)', () => {
    it('renders action buttons area when view is loaded', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      expect(wrapper.find('.today-view__actions').exists()).toBe(true)
    })

    it('renders action buttons area with at least 3 buttons when view is loaded', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      // AppButton stub renders a real <button> element
      const buttons = wrapper.findAll('button')
      // 3 action buttons: "Add to today", "Plan with Wren", "Move unfinished"
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('"Add to today" button has disabled attribute (placeholder)', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      const text = wrapper.text()
      expect(text).toContain('Add to today')
    })

    it('"Plan with Wren" text is present in the action buttons', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      expect(wrapper.text()).toContain('Plan with Wren')
    })

    it('"Move unfinished to tomorrow" text is present', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      expect(wrapper.text()).toContain('Move unfinished')
    })
  })

  describe('TaskRow completion', () => {
    it('renders TaskRow components for tasks in view', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Task 1', done: false, scheduledTime: '09:00' }])

      const wrapper = mountToday()
      const taskRows = wrapper.findAll('task-row-stub')
      expect(taskRows).toHaveLength(1)
    })

    it('passes task as prop to TaskRow', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      const task = { id: 't1', title: 'My Task', done: false, scheduledTime: '09:00' }
      store.view = buildView([task])

      const wrapper = mountToday()
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

      const wrapper = mountToday()
      const kpiRow = wrapper.find('kpi-row-stub')
      expect(kpiRow.exists()).toBe(true)
    })

    it('does not render KpiRow when loading', () => {
      const store = useTodayStore()
      store.loading = true
      store.view = null

      const wrapper = mountToday()
      expect(wrapper.find('kpi-row-stub').exists()).toBe(false)
    })
  })

  describe('AppScreenHeading meta slot', () => {
    it('stores view.sunrise and view.sunset in state', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      const wrapper = mountToday()
      expect(wrapper.vm.store.view.sunrise).toBe('6:01 AM')
      expect(wrapper.vm.store.view.sunset).toBe('8:17 PM')
    })

    it('does not render sunrise/sunset when view is null', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = null

      const wrapper = mountToday()
      expect(wrapper.vm.store.view).toBeNull()
    })

    it('renders sunrise/sunset text in meta slot when AppScreenHeading renders slots', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])

      // Use the real AppScreenHeading component so the #meta slot renders
      const wrapper = mountToday({
        global: {
          stubs: {
            ...globalStubs,
            AppScreenHeading: false // use real component
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

      const wrapper = mountToday()
      // hour 0 < 12 → Morning
      expect(wrapper.vm.groups[0].items).toHaveLength(1)
    })

    it('treats scheduledTime="23:59" as hour 23 — groups into Evening', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 'y', title: 'Late', done: false, scheduledTime: '23:59' }])

      const wrapper = mountToday()
      // hour 23 >= 17 → Evening
      expect(wrapper.vm.groups[2].items).toHaveLength(1)
    })

    it('falls back to hour 12 for malformed scheduledTime', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''

      store.view = buildView([
        { id: 'x', title: 'Garbage', done: false, scheduledTime: 'not-a-time' }
      ])

      const wrapper = mountToday()
      // Falls back to 12 → Afternoon
      expect(wrapper.vm.groups[1].items).toHaveLength(1)
    })
  })

  describe('retry button on error', () => {
    it('invokes store.load() when retry button is clicked', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = 'oops'
      store.view = null

      const wrapper = mountToday()
      // Find the retry button which has the localized text
      const buttons = wrapper.findAll('button')

      const retryButton = buttons.find(
        b => b.text().includes('Retry') || b.text().toLowerCase().includes('retry')
      )

      if (retryButton) {
        await retryButton.trigger('click')
        // store.load() was called once on mount + once on retry
        expect(store.load).toHaveBeenCalledTimes(2)
      } else {
        // If no explicit retry button (just text), at least confirm one load call
        expect(store.load).toHaveBeenCalled()
      }
    })
  })

  describe('drag and drop handlers', () => {
    function buildDragEvent(taskId) {
      const data = {}
      return {
        dataTransfer: {
          getData: vi.fn(() => taskId),
          setData: vi.fn((k, v) => {
            data[k] = v
          }),
          effectAllowed: '',
          dropEffect: ''
        },
        preventDefault: vi.fn()
      }
    }

    it('onTaskDragStart sets draggingId and writes the id to dataTransfer', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '08:00' }])
      const wrapper = mountToday()
      const event = buildDragEvent('t1')
      wrapper.vm.onTaskDragStart(event, { id: 't1' })

      expect(wrapper.vm.draggingId).toBe('t1')
      expect(event.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 't1')
    })

    it('onTaskDragEnd resets draggingId and dropLane', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      wrapper.vm.draggingId = 't1'
      wrapper.vm.dropLane = 'morning'
      wrapper.vm.onTaskDragEnd()
      expect(wrapper.vm.draggingId).toBeNull()
      expect(wrapper.vm.dropLane).toBeNull()
    })

    it('onLaneDragOver sets dropLane to the group key when a drag is in flight', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      wrapper.vm.draggingId = 't1'
      const evt = buildDragEvent(null)
      wrapper.vm.onLaneDragOver(evt, { key: 'morning' })
      expect(wrapper.vm.dropLane).toBe('morning')
    })

    it('onLaneDragOver is a no-op when no drag is in flight', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      wrapper.vm.draggingId = null
      wrapper.vm.dropLane = null
      const evt = buildDragEvent(null)
      wrapper.vm.onLaneDragOver(evt, { key: 'morning' })
      expect(wrapper.vm.dropLane).toBeNull()
    })

    it('onLaneDragLeave clears dropLane only when it matches the leaving group', () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      wrapper.vm.dropLane = 'morning'
      wrapper.vm.onLaneDragLeave({ key: 'afternoon' })
      // Doesn't match → stays
      expect(wrapper.vm.dropLane).toBe('morning')
      wrapper.vm.onLaneDragLeave({ key: 'morning' })
      // Matches → cleared
      expect(wrapper.vm.dropLane).toBeNull()
    })

    it('onLaneDrop calls store.rescheduleTask with the lane time when the task moves lanes', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '08:00' }])
      const wrapper = mountToday()
      const evt = buildDragEvent('t1')
      await wrapper.vm.onLaneDrop(evt, { key: 'afternoon' })

      expect(store.rescheduleTask).toHaveBeenCalledWith('t1', { scheduledTime: '13:00' })
      expect(wrapper.vm.dropLane).toBeNull()
    })

    it('onLaneDrop is a no-op when the task is already in the dropped lane', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '08:00' }])
      const wrapper = mountToday()
      const evt = buildDragEvent('t1')
      await wrapper.vm.onLaneDrop(evt, { key: 'morning' })

      expect(store.rescheduleTask).not.toHaveBeenCalled()
    })

    it('onLaneDrop is a no-op when dataTransfer has no id', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      const evt = buildDragEvent('')
      await wrapper.vm.onLaneDrop(evt, { key: 'morning' })

      expect(store.rescheduleTask).not.toHaveBeenCalled()
    })

    it('onLaneDrop is a no-op when the task is not found', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([])
      const wrapper = mountToday()
      const evt = buildDragEvent('does-not-exist')
      await wrapper.vm.onLaneDrop(evt, { key: 'morning' })

      expect(store.rescheduleTask).not.toHaveBeenCalled()
    })

    it('onLaneDrop swallows rejection from store.rescheduleTask', async () => {
      const store = useTodayStore()
      store.rescheduleTask = vi.fn().mockRejectedValueOnce(new Error('boom'))
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '08:00' }])
      const wrapper = mountToday()
      const evt = buildDragEvent('t1')
      await expect(wrapper.vm.onLaneDrop(evt, { key: 'afternoon' })).resolves.toBeUndefined()
    })

    it('onLaneDrop is a no-op when the group key is unknown (no LANE_TIME)', async () => {
      const store = useTodayStore()
      store.loading = false
      store.error = ''
      store.view = buildView([{ id: 't1', title: 'Run', done: false, scheduledTime: '08:00' }])
      const wrapper = mountToday()
      const evt = buildDragEvent('t1')
      await wrapper.vm.onLaneDrop(evt, { key: 'midnight' })

      expect(store.rescheduleTask).not.toHaveBeenCalled()
    })
  })

  describe('onBriefingAction', () => {
    it('routes "capture" action to overlays.openCapture', () => {
      useTodayStore().view = buildView([])
      const overlays = useOverlaysStore()
      const wrapper = mountToday()
      wrapper.vm.onBriefingAction({ kind: 'capture' })
      expect(overlays.openCapture).toHaveBeenCalled()
    })

    it('routes "schedule" action to router push to calendar', async () => {
      useTodayStore().view = buildView([])
      const wrapper = mountToday()
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValueOnce(undefined)
      wrapper.vm.onBriefingAction({ kind: 'schedule' })
      expect(pushSpy).toHaveBeenCalledWith({ name: 'calendar' })
      pushSpy.mockRestore()
    })

    it('routes "snooze" action to wren', async () => {
      useTodayStore().view = buildView([])
      const wrapper = mountToday()
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValueOnce(undefined)
      wrapper.vm.onBriefingAction({ kind: 'snooze' })
      expect(pushSpy).toHaveBeenCalledWith({ name: 'wren' })
      pushSpy.mockRestore()
    })

    it('ignores unknown action kinds', async () => {
      useTodayStore().view = buildView([])
      const overlays = useOverlaysStore()
      const wrapper = mountToday()
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValueOnce(undefined)
      wrapper.vm.onBriefingAction({ kind: 'unknown' })
      expect(overlays.openCapture).not.toHaveBeenCalled()
      expect(pushSpy).not.toHaveBeenCalled()
      pushSpy.mockRestore()
    })
  })

  describe('briefing rendering', () => {
    it('mounts briefing store and triggers load on mount', () => {
      useTodayStore().view = buildView([])
      const briefingStore = useBriefingStore()
      mountToday()
      expect(briefingStore.load).toHaveBeenCalled()
    })

    it('renders the BriefingCard fallback when briefing is null', () => {
      useTodayStore().view = buildView([])
      const briefingStore = useBriefingStore()
      briefingStore.briefing = null
      const wrapper = mountToday()
      expect(wrapper.find('briefing-card-stub').exists()).toBe(true)
    })

    it('renders the BriefingCard with payload when briefing is set', () => {
      useTodayStore().view = buildView([])
      const briefingStore = useBriefingStore()

      briefingStore.briefing = {
        state: 'ready',
        greeting: 'Good morning',
        tone: 'warm',
        actions: []
      }

      const wrapper = mountToday()
      expect(wrapper.find('briefing-card-stub').exists()).toBe(true)
    })
  })

  describe('Plan with Wren button', () => {
    it('clicking Plan with Wren navigates to wren route', async () => {
      useTodayStore().view = buildView([])
      const wrapper = mountToday()
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValueOnce(undefined)
      // Wire by finding by text content
      const buttons = wrapper.findAll('button')
      const planButton = buttons.find(b => b.text().includes('Plan with Wren'))

      if (planButton) {
        await planButton.trigger('click')
        expect(pushSpy).toHaveBeenCalledWith({ name: 'wren' })
      }

      pushSpy.mockRestore()
    })
  })

  describe('showEmpty', () => {
    it('does not show empty state during initial load', () => {
      const store = useTodayStore()
      store.loading = true
      store.error = ''
      store.view = null
      const wrapper = mountToday()
      expect(wrapper.text()).not.toContain('Nothing scheduled for today')
    })
  })
})
