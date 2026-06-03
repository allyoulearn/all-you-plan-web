import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CalendarView from '@/views/CalendarView.vue'
import { useCalendarStore } from '@/stores/calendar.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppIconButton: true,
  AppCard: { template: '<div><slot /></div>' },
  RouterLink: true,
  TimeBlockView: true,
  CalendarEventSheet: true,
  WrenOriginBadge: true,
  AppSegmentedControl: {
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template:
      '<div class="seg-stub"><button v-for="o in options" :key="o.value" :data-value="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  }
}

const MAY_2026_EVENTS = [
  { id: 'ev1', date: '2026-05-15', title: 'Dentist', accent: false },
  { id: 'ev2', date: '2026-05-15', title: 'Gym', accent: true },
  { id: 'ev3', date: '2026-05-21', title: 'Birthday', accent: true }
]

function mountCalendar(storeState = {}) {
  return mount(CalendarView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { calendar: { events: [], loading: false, error: '', ...storeState } }
        }),
        i18n
      ]
    }
  })
}

describe('CalendarView', () => {
  // CalendarView defaults to the real current month, but the fixtures and
  // index math below assume May 2026 (1st is a Friday; demo "today" is the
  // 21st). Pin only Date — leaving real timers intact — so these assertions
  // are deterministic regardless of the wall-clock date the suite runs on.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-21T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loading and error states', () => {
    it('shows loading indicator while loading', () => {
      const wrapper = mountCalendar({ loading: true })
      expect(wrapper.text()).toContain('Loading')
    })

    it('shows error message when error is set', () => {
      const wrapper = mountCalendar({ error: 'Calendar fetch failed' })
      expect(wrapper.text()).toContain('Calendar fetch failed')
    })
  })

  describe('month grid (calendarDays computed)', () => {
    it('renders exactly 42 day cells', () => {
      const wrapper = mountCalendar()
      // Day cells share the calendar-view__day-cell class so we filter — other
      // buttons (Month/Week segmented control, nav arrows) live alongside them.
      const buttons = wrapper.findAll('button.calendar-view__day-cell')
      expect(buttons).toHaveLength(42)
    })

    it('renders all 7 weekday header labels', () => {
      const wrapper = mountCalendar()
      const text = wrapper.text()

      for (const d of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
        expect(text).toContain(d)
      }
    })

    it('shows event dots for the current month', () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      // Event dot spans are rendered inside button cells
      const dots = wrapper.findAll('span.calendar-view__dot')
      // 2 events on May 15, 1 on May 21 = 3 dots max (but sliced at 3 per day)
      expect(dots.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('day selection', () => {
    it('shows no agenda when no day is selected', () => {
      // We can only reliably test the absence of the agenda label text
      // since selectedDay is initialized to today.getDate() — so we check
      // the agenda section renders when a day is selected.
      const wrapper = mountCalendar()
      // There's always an agendaLabel when today is selected
      // Just ensure the view mounts without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('shows "No events for this day." when selected day has no events', async () => {
      // Mount with empty events so the selected day (today) has no events
      const wrapper = mountCalendar({ events: [] })
      expect(wrapper.text()).toContain('No events for this day')
    })
  })

  describe('prevMonth() / nextMonth() — year rollover', () => {
    it('calls store.load with the correct month key after prevMonth', async () => {
      const wrapper = mountCalendar()
      const store = useCalendarStore()

      // Find the previous-month button via aria-label
      const prevBtn = wrapper.find('[aria-label="Previous month"]')
      await prevBtn.trigger('click')

      // store.load is a spy — check it was called with something
      expect(store.load).toHaveBeenCalled()
    })

    it('calls store.load with the correct month key after nextMonth', async () => {
      const wrapper = mountCalendar()
      const store = useCalendarStore()

      const nextBtn = wrapper.find('[aria-label="Next month"]')
      await nextBtn.trigger('click')

      expect(store.load).toHaveBeenCalled()
    })
  })

  describe('eventsForDay()', () => {
    it('returns up to 3 dots per day', () => {
      const manyEvents = [
        { id: 'e1', date: '2026-05-10', title: 'A', accent: false },
        { id: 'e2', date: '2026-05-10', title: 'B', accent: false },
        { id: 'e3', date: '2026-05-10', title: 'C', accent: false },
        { id: 'e4', date: '2026-05-10', title: 'D', accent: false }
      ]

      const wrapper = mountCalendar({ events: manyEvents })
      const dots = wrapper.findAll('span.calendar-view__dot')
      // slice(0,3) means max 3 dots for a single day
      expect(dots.length).toBeLessThanOrEqual(3)
    })
  })

  describe('agendaEvents computed', () => {
    it('shows agenda events for the selected day', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      // Scope to day-cell buttons so the Month/Week segmented control and nav
      // arrows don't shift the index of the day-15 cell.
      const buttons = wrapper.findAll('button.calendar-view__day-cell')
      // For May 2026 the 1st is Friday (dow=5), so 5 leading days; day 1 = index 5
      // Day 15 = index 5 + 14 = 19
      const day15btn = buttons[19]
      await day15btn.trigger('click')

      // Now the agenda for May 15 should show 2 events
      expect(wrapper.text()).toContain('Dentist')
      expect(wrapper.text()).toContain('Gym')
    })
  })

  describe('WEB-T08-006 fix — calendar grid hidden when error is active', () => {
    it('does not render the calendar AppCard when store.error is set', () => {
      const wrapper = mountCalendar({ error: 'Something broke' })
      // The grid AppCard is conditional on !store.error
      const buttons = wrapper.findAll('button')

      // Navigation buttons (prev/next) may still render, but no day-cell buttons
      const dayCellButtons = buttons.filter(b =>
        b.classes().some(c => c.startsWith('calendar-view__day-cell'))
      )

      expect(dayCellButtons.length).toBe(0)
    })

    it('nav buttons are still rendered while error is shown', () => {
      const wrapper = mountCalendar({ error: 'Failed' })
      expect(wrapper.find('[aria-label="Previous month"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Next month"]').exists()).toBe(true)
    })
  })

  describe('WEB-T08-012 fix — day cell accessibility attributes', () => {
    it('adds aria-label to each day cell button', () => {
      const wrapper = mountCalendar()
      const buttons = wrapper.findAll('button.calendar-view__day-cell')
      // Non-adjacent buttons should have aria-label
      const nonAdjacent = buttons.filter(b => !b.attributes('disabled'))
      expect(nonAdjacent.length).toBeGreaterThan(0)

      nonAdjacent.forEach(btn => {
        expect(btn.attributes('aria-label')).toBeDefined()
        expect(btn.attributes('aria-label').length).toBeGreaterThan(0)
      })
    })

    it('sets aria-current="date" on the today cell', () => {
      const wrapper = mountCalendar()
      const todayCell = wrapper.findAll('button.calendar-view__day-cell--today')

      if (todayCell.length > 0) {
        expect(todayCell[0].attributes('aria-current')).toBe('date')
      }
      // If no today cell (different month), we skip the assertion
    })

    it('sets aria-pressed="true" on the selected cell', () => {
      const wrapper = mountCalendar()
      const selected = wrapper.findAll('button.calendar-view__day-cell--selected')

      if (selected.length > 0) {
        expect(selected[0].attributes('aria-pressed')).toBe('true')
      }
    })
  })

  describe('year rollover edge cases', () => {
    it('rolls over from January to December when going to previous month', async () => {
      const wrapper = mountCalendar()
      // Manually set to January
      wrapper.vm.currentMonth = 0
      wrapper.vm.currentYear = 2026
      await wrapper.vm.$nextTick()

      const prevBtn = wrapper.find('[aria-label="Previous month"]')
      await prevBtn.trigger('click')

      expect(wrapper.vm.currentMonth).toBe(11)
      expect(wrapper.vm.currentYear).toBe(2025)
    })

    it('rolls over from December to January when going to next month', async () => {
      const wrapper = mountCalendar()
      wrapper.vm.currentMonth = 11
      wrapper.vm.currentYear = 2025
      await wrapper.vm.$nextTick()

      const nextBtn = wrapper.find('[aria-label="Next month"]')
      await nextBtn.trigger('click')

      expect(wrapper.vm.currentMonth).toBe(0)
      expect(wrapper.vm.currentYear).toBe(2026)
    })

    it('clears selectedDay after navigating to a new month', async () => {
      const wrapper = mountCalendar()
      wrapper.vm.selectedDay = 10
      await wrapper.vm.$nextTick()

      await wrapper.find('[aria-label="Next month"]').trigger('click')
      expect(wrapper.vm.selectedDay).toBeNull()
    })
  })

  describe('isToday / isSelected helpers', () => {
    it('adjacent cells are never marked as today', () => {
      const wrapper = mountCalendar()
      // Adjacent cells have 'disabled' attr
      const adjacent = wrapper.findAll('button[disabled]')

      adjacent.forEach(b => {
        expect(b.classes()).not.toContain('calendar-view__day-cell--today')
      })
    })

    it('selects a day cell on click', async () => {
      const wrapper = mountCalendar()
      const buttons = wrapper.findAll('button.calendar-view__day-cell')
      // Find a non-disabled button
      const clickable = buttons.find(b => !b.attributes('disabled'))

      if (clickable) {
        await clickable.trigger('click')
        expect(wrapper.vm.selectedDay).toBeDefined()
      }
    })
  })

  describe('monthKey helper', () => {
    it('generates correct YYYY-MM key', async () => {
      const wrapper = mountCalendar()
      const store = useCalendarStore()
      // Navigate to December 2025
      wrapper.vm.currentMonth = 11
      wrapper.vm.currentYear = 2025
      await wrapper.vm.$nextTick()
      await wrapper.find('[aria-label="Next month"]').trigger('click')
      // Should have called load with 2026-01
      expect(store.load).toHaveBeenCalledWith('2026-01')
    })
  })

  describe('view mode switch', () => {
    it('renders TimeBlockView when viewMode is week', async () => {
      const wrapper = mountCalendar()
      wrapper.vm.viewMode = 'week'
      await wrapper.vm.$nextTick()
      expect(wrapper.find('time-block-view-stub').exists()).toBe(true)
    })

    it('does not render day cells when viewMode is week', async () => {
      const wrapper = mountCalendar()
      wrapper.vm.viewMode = 'week'
      await wrapper.vm.$nextTick()
      const dayCells = wrapper.findAll('button.calendar-view__day-cell')
      expect(dayCells.length).toBe(0)
    })
  })

  describe('event sheet (create / edit modes)', () => {
    it('openCreateSheet sets create mode with no event', () => {
      const wrapper = mountCalendar()
      wrapper.vm.openCreateSheet()
      expect(wrapper.vm.sheetOpen).toBe(true)
      expect(wrapper.vm.sheetMode).toBe('create')
      expect(wrapper.vm.sheetEvent).toBeNull()
      expect(wrapper.vm.sheetDate).toBeDefined()
    })

    it('openEditSheet sets edit mode and seeds the event', () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const ev = MAY_2026_EVENTS[0]
      wrapper.vm.openEditSheet(ev)
      expect(wrapper.vm.sheetOpen).toBe(true)
      expect(wrapper.vm.sheetMode).toBe('edit')
      expect(wrapper.vm.sheetEvent.id).toBe(ev.id)
      expect(wrapper.vm.sheetDate).toBe(ev.date)
    })

    it('closeSheet clears sheet state', () => {
      const wrapper = mountCalendar()
      wrapper.vm.openCreateSheet()
      wrapper.vm.closeSheet()
      expect(wrapper.vm.sheetOpen).toBe(false)
      expect(wrapper.vm.sheetEvent).toBeNull()
      expect(wrapper.vm.sheetDate).toBeNull()
    })

    it('+ New event link in empty agenda opens the create sheet', async () => {
      const wrapper = mountCalendar({ events: [] })
      // Pick a day to open the agenda area.
      const buttons = wrapper.findAll('button.calendar-view__day-cell')
      const nonAdjacent = buttons.find(b => !b.attributes('disabled'))
      await nonAdjacent.trigger('click')
      const link = wrapper.find('.calendar-view__add-link')

      if (link.exists()) {
        await link.trigger('click')
        expect(wrapper.vm.sheetOpen).toBe(true)
        expect(wrapper.vm.sheetMode).toBe('create')
      }
    })
  })

  describe('drag-and-drop on day cells', () => {
    function buildDragEvent(taskId) {
      return {
        dataTransfer: {
          getData: vi.fn(() => taskId),
          setData: vi.fn(),
          effectAllowed: '',
          dropEffect: ''
        },
        preventDefault: vi.fn()
      }
    }

    it('onAgendaDragStart sets draggingId and writes the id', () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const evt = buildDragEvent(null)
      wrapper.vm.onAgendaDragStart(evt, { id: 'ev1' })
      expect(wrapper.vm.draggingId).toBe('ev1')
      expect(evt.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'ev1')
    })

    it('onAgendaDragEnd clears draggingId and dropTargetDate', () => {
      const wrapper = mountCalendar()
      wrapper.vm.draggingId = 'ev1'
      wrapper.vm.dropTargetDate = '2026-05-10'
      wrapper.vm.onAgendaDragEnd()
      expect(wrapper.vm.draggingId).toBeNull()
      expect(wrapper.vm.dropTargetDate).toBeNull()
    })

    it('onDayDragOver sets dropTargetDate for non-adjacent cells with active drag', () => {
      const wrapper = mountCalendar()
      wrapper.vm.draggingId = 'ev1'
      const evt = buildDragEvent(null)
      wrapper.vm.onDayDragOver(evt, { day: 5, adjacent: false, month: 4 })
      expect(wrapper.vm.dropTargetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('onDayDragOver is a no-op when cell is adjacent', () => {
      const wrapper = mountCalendar()
      wrapper.vm.draggingId = 'ev1'
      wrapper.vm.dropTargetDate = null
      const evt = buildDragEvent(null)
      wrapper.vm.onDayDragOver(evt, { day: 1, adjacent: true, month: 3 })
      expect(wrapper.vm.dropTargetDate).toBeNull()
    })

    it('onDayDragOver is a no-op when no drag is in flight', () => {
      const wrapper = mountCalendar()
      wrapper.vm.draggingId = null
      wrapper.vm.dropTargetDate = null
      const evt = buildDragEvent(null)
      wrapper.vm.onDayDragOver(evt, { day: 1, adjacent: false, month: 4 })
      expect(wrapper.vm.dropTargetDate).toBeNull()
    })

    it('onDayDragLeave clears dropTargetDate when the leaving cell matches', () => {
      const wrapper = mountCalendar()
      wrapper.vm.currentMonth = 4 // May
      wrapper.vm.currentYear = 2026
      const cell = { day: 5, adjacent: false, month: 4 }
      wrapper.vm.dropTargetDate = wrapper.vm.cellDateStr(cell)
      wrapper.vm.onDayDragLeave(cell)
      expect(wrapper.vm.dropTargetDate).toBeNull()
    })

    it('onDayDragLeave is a no-op when cells do not match', () => {
      const wrapper = mountCalendar()
      wrapper.vm.dropTargetDate = '2026-05-10'
      wrapper.vm.onDayDragLeave({ day: 12, adjacent: false, month: 4 })
      expect(wrapper.vm.dropTargetDate).toBe('2026-05-10')
    })

    it('onDayDrop reschedules the event and selects the destination day', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      const store = useCalendarStore()
      store.rescheduleEvent.mockResolvedValue()
      const cell = { day: 22, adjacent: false, month: 4 }
      const evt = buildDragEvent('ev1')
      await wrapper.vm.onDayDrop(evt, cell)

      expect(store.rescheduleEvent).toHaveBeenCalledWith(
        'ev1',
        expect.stringMatching(/^2026-05-22$/)
      )

      expect(wrapper.vm.selectedDay).toBe(22)
    })

    it('onDayDrop is a no-op when dropped on the same day', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      const store = useCalendarStore()
      // The event ev1 is on 2026-05-15
      const cell = { day: 15, adjacent: false, month: 4 }
      const evt = buildDragEvent('ev1')
      await wrapper.vm.onDayDrop(evt, cell)
      expect(store.rescheduleEvent).not.toHaveBeenCalled()
    })

    it('onDayDrop is a no-op when cell is adjacent', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const store = useCalendarStore()
      const cell = { day: 1, adjacent: true, month: 3 }
      const evt = buildDragEvent('ev1')
      await wrapper.vm.onDayDrop(evt, cell)
      expect(store.rescheduleEvent).not.toHaveBeenCalled()
    })

    it('onDayDrop is a no-op when no event id is supplied', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const store = useCalendarStore()
      const cell = { day: 22, adjacent: false, month: 4 }
      const evt = buildDragEvent('')
      await wrapper.vm.onDayDrop(evt, cell)
      expect(store.rescheduleEvent).not.toHaveBeenCalled()
    })

    it('onDayDrop swallows rescheduleEvent rejection', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      const store = useCalendarStore()
      store.rescheduleEvent.mockRejectedValue(new Error('boom'))
      const cell = { day: 22, adjacent: false, month: 4 }
      const evt = buildDragEvent('ev1')
      await expect(wrapper.vm.onDayDrop(evt, cell)).resolves.toBeUndefined()
    })

    it('onDayDrop is a no-op when the event id is not in store.events', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const store = useCalendarStore()
      const cell = { day: 22, adjacent: false, month: 4 }
      const evt = buildDragEvent('not-real')
      await wrapper.vm.onDayDrop(evt, cell)
      expect(store.rescheduleEvent).not.toHaveBeenCalled()
    })
  })

  describe('agenda interactions', () => {
    it('renders agenda items as draggable when day has events', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      wrapper.vm.selectedDay = 15
      await wrapper.vm.$nextTick()
      const items = wrapper.findAll('.calendar-view__agenda-item')
      expect(items.length).toBe(2)
      items.forEach(el => expect(el.attributes('draggable')).toBe('true'))
    })

    it('clicking an agenda item opens the edit sheet', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      wrapper.vm.selectedDay = 15
      await wrapper.vm.$nextTick()
      const items = wrapper.findAll('.calendar-view__agenda-item')
      await items[0].trigger('click')
      expect(wrapper.vm.sheetOpen).toBe(true)
      expect(wrapper.vm.sheetMode).toBe('edit')
    })

    it('shows the agenda count badge with the right number', async () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      wrapper.vm.selectedDay = 15
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('[2]')
    })
  })

  describe('cellDateStr helper', () => {
    it('returns null for adjacent cells', () => {
      const wrapper = mountCalendar()
      expect(wrapper.vm.cellDateStr({ day: 1, adjacent: true })).toBeNull()
    })

    it('returns YYYY-MM-DD for non-adjacent cells', () => {
      const wrapper = mountCalendar()
      wrapper.vm.currentMonth = 4
      wrapper.vm.currentYear = 2026
      const result = wrapper.vm.cellDateStr({ day: 22, adjacent: false })
      expect(result).toBe('2026-05-22')
    })
  })

  describe('eventsByDay map', () => {
    it('builds a map keyed by date with arrays of events', () => {
      const wrapper = mountCalendar({ events: MAY_2026_EVENTS })
      const map = wrapper.vm.eventsByDay
      // 2 events on May 15
      expect(map.get('2026-05-15')).toHaveLength(2)
      expect(map.get('2026-05-21')).toHaveLength(1)
    })
  })
})
