import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import StatsView from '@/views/StatsView.vue'
import { useStatsStore } from '@/stores/stats.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Card: { template: '<div><slot /></div>' },
  KpiTile: true,
  Heatmap: true,
  RouterLink: true
}

function buildStats(overrides = {}) {
  return {
    heatmap: Array(182).fill(0),
    rankedHabits: [],
    ...overrides
  }
}

function mountStats(storeState = {}) {
  return mount(StatsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            stats: { stats: null, loading: false, error: '', ...storeState }
          }
        }),
        i18n
      ]
    }
  })
}

describe('StatsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Loading / error states --

  it('shows loading indicator while loading is true', () => {
    const wrapper = mountStats({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when error is set', () => {
    const wrapper = mountStats({ error: 'Stats fetch failed' })
    expect(wrapper.text()).toContain('Stats fetch failed')
    expect(wrapper.find('.stats-view__status--error').exists()).toBe(true)
  })

  it('does not show stats when loading', () => {
    const wrapper = mountStats({ loading: true, stats: buildStats() })
    const kpiTiles = wrapper.findAll('kpi-tile-stub')
    expect(kpiTiles).toHaveLength(0)
  })

  it('does not show stats when there is an error', () => {
    const wrapper = mountStats({ error: 'Oops', stats: buildStats() })
    const kpiTiles = wrapper.findAll('kpi-tile-stub')
    expect(kpiTiles).toHaveLength(0)
  })

  it('does not show stats when stats is null and not loading', () => {
    const wrapper = mountStats({ stats: null, loading: false })
    const kpiTiles = wrapper.findAll('kpi-tile-stub')
    expect(kpiTiles).toHaveLength(0)
  })

  // -- Lifecycle --

  it('calls store.load() on mount', () => {
    mountStats()
    const store = useStatsStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  // -- Successful state with stats --

  it('renders 3 KpiTile components when stats are loaded', () => {
    const wrapper = mountStats({ stats: buildStats() })
    const kpiTiles = wrapper.findAll('kpi-tile-stub')
    expect(kpiTiles).toHaveLength(3)
  })

  it('renders Streak KpiTile with the correct label', () => {
    const wrapper = mountStats({ stats: buildStats() })
    const tiles = wrapper.findAll('kpi-tile-stub')
    expect(tiles.some(t => t.attributes('label') === 'Streak')).toBe(true)
  })

  it('renders Best KpiTile with the correct label', () => {
    const wrapper = mountStats({ stats: buildStats() })
    const tiles = wrapper.findAll('kpi-tile-stub')
    expect(tiles.some(t => t.attributes('label') === 'Best')).toBe(true)
  })

  it('renders Habits KpiTile with the correct label', () => {
    const wrapper = mountStats({ stats: buildStats() })
    const tiles = wrapper.findAll('kpi-tile-stub')
    expect(tiles.some(t => t.attributes('label') === 'Habits')).toBe(true)
  })

  it('renders the Heatmap component when stats are present', () => {
    const wrapper = mountStats({ stats: buildStats() })
    expect(wrapper.find('heatmap-stub').exists()).toBe(true)
  })

  // -- topStreak computed --

  it('topStreak is 0 when rankedHabits is empty', () => {
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: [] }) })
    expect(wrapper.vm.topStreak).toBe(0)
  })

  it('topStreak is the max streak across habits', () => {
    const habits = [
      { choreId: 'h1', name: 'Reading', streak: 5, bestStreak: 10 },
      { choreId: 'h2', name: 'Running', streak: 12, bestStreak: 20 }
    ]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.vm.topStreak).toBe(12)
  })

  // -- topBest computed --

  it('topBest is 0 when rankedHabits is empty', () => {
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: [] }) })
    expect(wrapper.vm.topBest).toBe(0)
  })

  it('topBest is the max bestStreak across habits', () => {
    const habits = [
      { choreId: 'h1', name: 'Reading', streak: 5, bestStreak: 10 },
      { choreId: 'h2', name: 'Running', streak: 12, bestStreak: 20 }
    ]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.vm.topBest).toBe(20)
  })

  // -- heatmapValues computed --

  it('heatmapValues defaults to 182 zeros when stats.heatmap is absent', () => {
    const wrapper = mountStats({ stats: { rankedHabits: [] } })
    expect(wrapper.vm.heatmapValues).toHaveLength(182)
    expect(wrapper.vm.heatmapValues.every(v => v === 0)).toBe(true)
  })

  it('heatmapValues uses stats.heatmap when provided', () => {
    const heatmap = Array(182)
      .fill(0)
      .map((_, i) => i % 5)
    const wrapper = mountStats({ stats: buildStats({ heatmap }) })
    expect(wrapper.vm.heatmapValues).toEqual(heatmap)
  })

  it('heatmapValues defaults to 182 zeros when stats is null', () => {
    const wrapper = mountStats({ stats: null })
    expect(wrapper.vm.heatmapValues).toHaveLength(182)
  })

  // -- Ranked habits list --

  it('shows "No habits tracked yet." when rankedHabits is empty', () => {
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: [] }) })
    expect(wrapper.text()).toContain('No habits tracked yet')
  })

  it('renders each habit in the ranked list', () => {
    const habits = [
      { choreId: 'h1', name: 'Reading', streak: 5, bestStreak: 10 },
      { choreId: 'h2', name: 'Running', streak: 12, bestStreak: 20 }
    ]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.text()).toContain('Reading')
    expect(wrapper.text()).toContain('Running')
  })

  it('renders the habit rank number padded to 2 digits', () => {
    const habits = [{ choreId: 'h1', name: 'Reading', streak: 5, bestStreak: 10 }]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.text()).toContain('01')
  })

  it('shows habit streak and bestStreak in the sub-label', () => {
    const habits = [{ choreId: 'h1', name: 'Reading', streak: 5, bestStreak: 10 }]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    const text = wrapper.text()
    expect(text).toContain('5 days')
    expect(text).toContain('best 10')
  })

  it('renders habits-list section header with count', () => {
    const habits = [
      { choreId: 'h1', name: 'A', streak: 1, bestStreak: 2 },
      { choreId: 'h2', name: 'B', streak: 3, bestStreak: 5 }
    ]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    const headers = wrapper.findAll('section-header-stub')
    const habitsHeader = headers.find(h => h.attributes('label') === 'Habits ranked')
    expect(habitsHeader).toBeDefined()
    expect(habitsHeader.attributes('count')).toBe('2')
  })

  // -- topStreak and topBest with empty rankedHabits array --

  it('topStreak returns 0 when habits list reduces from empty array', () => {
    // reduce on empty array with initial value 0 returns 0
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: [] }) })
    expect(wrapper.vm.topStreak).toBe(0)
  })

  it('topBest returns 0 when habits list reduces from empty array', () => {
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: [] }) })
    expect(wrapper.vm.topBest).toBe(0)
  })

  it('topStreak returns 0 when stats is null (covers ?? [] fallback branch)', () => {
    // When stats is null, stats?.rankedHabits is undefined, ?? [] returns []
    // reduce([]) with 0 initial returns 0
    const wrapper = mountStats({ stats: null })
    // Access computed directly — covers the ?? fallback
    expect(wrapper.vm.topStreak).toBe(0)
  })

  it('topBest returns 0 when stats is null (covers ?? [] fallback branch)', () => {
    const wrapper = mountStats({ stats: null })
    expect(wrapper.vm.topBest).toBe(0)
  })

  it('heatmapValues returns 182-zero array when stats is null (covers ?? Array fallback)', () => {
    const wrapper = mountStats({ stats: null })
    // Accessing heatmapValues covers the stats?.heatmap ?? Array(182).fill(0) branch
    const vals = wrapper.vm.heatmapValues
    expect(vals).toHaveLength(182)
    expect(vals.every(v => v === 0)).toBe(true)
  })

  it('topStreak handles single habit correctly', () => {
    const habits = [{ choreId: 'h1', name: 'Yoga', streak: 7, bestStreak: 14 }]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.vm.topStreak).toBe(7)
  })

  it('topBest handles single habit correctly', () => {
    const habits = [{ choreId: 'h1', name: 'Yoga', streak: 7, bestStreak: 14 }]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.vm.topBest).toBe(14)
  })

  it('renders multiple habits with correct zero-padded ranks', () => {
    const habits = [
      { choreId: 'h1', name: 'A', streak: 1, bestStreak: 2 },
      { choreId: 'h2', name: 'B', streak: 3, bestStreak: 4 }
    ]
    const wrapper = mountStats({ stats: buildStats({ rankedHabits: habits }) })
    expect(wrapper.text()).toContain('01')
    expect(wrapper.text()).toContain('02')
  })
})
