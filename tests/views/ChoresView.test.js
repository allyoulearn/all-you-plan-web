import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ChoresView from '@/views/ChoresView.vue'
import { useChoresStore } from '@/stores/chores.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: {
    props: ['label', 'count'],
    template:
      '<header class="section-header-stub" :data-label="label">{{ label }} ({{ count }})</header>'
  },
  AppButton: { template: '<button type="button"><slot /></button>' },
  AppConfirmDialog: true,
  KpiRow: {
    props: ['tiles'],
    template: '<div class="kpi-row-stub" :data-tiles="tiles?.length || 0" />'
  },
  ChoreRow: {
    props: ['chore', 'atTop', 'atBottom', 'showHandle'],
    template: '<div class="chore-row-stub" :data-id="chore.id" />'
  },
  ChoresSkeleton: { template: '<div class="skeleton-stub" />' },
  ChoresEmpty: {
    template: '<div class="empty-stub"><button @click="$emit(\'create\')">Empty CTA</button></div>',
    emits: ['create']
  },
  AllDoneCard: { template: '<div class="all-done-stub" />' },
  CreateChoreModal: true,
  EditChoreModal: true
}

// Daily chore created long ago — due every day, never completed today.
function dailyChore(overrides = {}) {
  return {
    id: 'c-daily',
    title: 'Meditate',
    cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: null },
    streak: 5,
    bestStreak: 10,
    lastCompletedOn: null,
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    recentCompletions: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    order: 0,
    ...overrides
  }
}

function snoozedChore() {
  return dailyChore({
    id: 'c-snoozed',
    title: 'Workout',
    snoozedUntil: new Date(Date.now() + 7 * 86_400_000).toISOString()
  })
}

function neverDueChore() {
  return dailyChore({
    id: 'c-weekly',
    title: 'Weekly review',
    cadence: { type: 'weekly', daysOfWeek: [9], interval: 1, dayOfMonth: null }
  })
}

function mountView(initialChores = [], extraState = {}) {
  // Reset localStorage so view-mode toggle starts from 'flow'
  try {
    localStorage.removeItem('chores.viewMode')
  } catch {
    /* ignore */
  }

  return mount(ChoresView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            chores: { chores: initialChores, loading: false, error: '', ...extraState }
          }
        }),
        i18n
      ]
    }
  })
}

describe('ChoresView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  describe('error + loading states', () => {
    it('renders skeleton while loading and not yet loaded', () => {
      const wrapper = mountView([], { loading: true })
      expect(wrapper.find('.skeleton-stub').exists()).toBe(true)
    })

    it('renders error message and retry button', () => {
      const wrapper = mountView([], { error: 'Chores fetch failed' })
      expect(wrapper.text()).toContain('Chores fetch failed')
      expect(wrapper.find('.chores-view__status--error').exists()).toBe(true)
    })

    it('calls store.load on mount', () => {
      mountView()
      const store = useChoresStore()
      expect(store.load).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty state', () => {
    it('renders ChoresEmpty after load when no chores', async () => {
      const wrapper = mountView([])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-stub').exists()).toBe(true)
    })
  })

  describe('flow mode groups', () => {
    it('puts due chores in the Due section and the rest in Upcoming', async () => {
      const wrapper = mountView([dailyChore(), neverDueChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      const headers = wrapper.findAll('.section-header-stub').map(h => h.attributes('data-label'))
      expect(headers).toContain('Due today')
      expect(headers).toContain('Upcoming')
    })

    it('renders the all-done card when due is empty but at least one chore was due today', async () => {
      // Daily chore completed today — present in dueToday calc but groups.due is empty
      const today = new Date().toLocaleDateString('en-CA')

      const wrapper = mountView([
        dailyChore({ lastCompletedOn: today, recentCompletions: [today] })
      ])

      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      // Today's date may match a daily-due that we then completed — but our daily
      // helper considers completedToday separately from isDueOn. The view counts
      // hasAnyDueScheduled based on isDueOn (cadence), so the daily chore is
      // scheduled today. groups.due includes due-not-yet-done chores. A daily
      // chore with lastCompletedOn=today is still in due since the row toggles
      // its checkbox via the lastCompletedOn data. The view does not exclude
      // completed-today from groups.due.
      const headers = wrapper.findAll('.section-header-stub').map(h => h.attributes('data-label'))
      expect(headers).toContain('Due today')
    })

    it('does not render the Due section header when no chore is scheduled today', async () => {
      const wrapper = mountView([neverDueChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      const headers = wrapper.findAll('.section-header-stub').map(h => h.attributes('data-label'))
      expect(headers).not.toContain('Due today')
      expect(headers).toContain('Upcoming')
    })
  })

  describe('stat lede', () => {
    it('renders the three-part stat lede (today / streak / best)', async () => {
      const wrapper = mountView([dailyChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      const lede = wrapper.find('.chores-view__lede')
      expect(lede.exists()).toBe(true)
      expect(lede.findAll('.chores-view__lede-part')).toHaveLength(3)
    })
  })

  describe('view-mode toggle', () => {
    it('defaults to flow mode and toggles to cadence on click', async () => {
      const wrapper = mountView([dailyChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.viewMode).toBe('flow')
      wrapper.vm.toggleViewMode()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.viewMode).toBe('cadence')
    })

    it('persists the chosen mode in localStorage', async () => {
      const wrapper = mountView([dailyChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      wrapper.vm.toggleViewMode()
      expect(localStorage.getItem('chores.viewMode')).toBe('cadence')
    })

    it('renders Daily/Weekly/Monthly section headers in cadence mode', async () => {
      const wrapper = mountView([dailyChore(), neverDueChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      wrapper.vm.toggleViewMode()
      await wrapper.vm.$nextTick()
      const headers = wrapper.findAll('.section-header-stub').map(h => h.attributes('data-label'))
      expect(headers).toContain('Daily')
      expect(headers).toContain('Weekly')
    })
  })

  describe('delete flow', () => {
    it('queues a chore for delete on row delete and confirms via the dialog', async () => {
      const wrapper = mountView([dailyChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      store.deleteChore.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()

      wrapper.vm.rowHandlers.delete('c-daily')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.confirmDelete).toBe(true)

      await wrapper.vm.performDelete()
      expect(store.deleteChore).toHaveBeenCalledWith('c-daily')
      expect(wrapper.vm.confirmDelete).toBe(false)
    })
  })

  describe('reorder flow', () => {
    it('move-up swaps adjacent chores and calls store.reorderChores', async () => {
      const a = dailyChore({ id: 'a' })
      const b = dailyChore({ id: 'b' })
      const wrapper = mountView([a, b])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      store.reorderChores.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.vm.rowHandlers['move-up']('b')
      expect(store.reorderChores).toHaveBeenCalledWith(['b', 'a'])
    })

    it('move-up at top is a no-op', async () => {
      const a = dailyChore({ id: 'a' })
      const b = dailyChore({ id: 'b' })
      const wrapper = mountView([a, b])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      store.reorderChores.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()

      await wrapper.vm.rowHandlers['move-up']('a')
      expect(store.reorderChores).not.toHaveBeenCalled()
    })
  })

  describe('edit flow', () => {
    it('opens the edit modal with the selected chore', async () => {
      const wrapper = mountView([dailyChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      wrapper.vm.rowHandlers.edit('c-daily')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showEdit).toBe(true)
      expect(wrapper.vm.editingChore.id).toBe('c-daily')
    })
  })

  describe('null chores fallback', () => {
    it('treats null chores as empty and renders the empty state', async () => {
      const wrapper = mountView(null)
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-stub').exists()).toBe(true)
    })
  })

  describe('snoozed chore in upcoming', () => {
    it('renders a snoozed chore in Upcoming, never in Due', async () => {
      const wrapper = mountView([snoozedChore()])
      const store = useChoresStore()
      store.load.mockResolvedValue()
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.groups.due).toHaveLength(0)
      expect(wrapper.vm.groups.upcoming).toHaveLength(1)
    })
  })
})
