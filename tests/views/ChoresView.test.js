import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ChoresView from '@/views/ChoresView.vue'
import { useChoresStore } from '@/stores/chores.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Button: { template: '<button type="button"><slot /></button>' },
  ChoreRow: true,
  CreateChoreModal: true
}

const DAILY_CHORE = {
  id: 'c1',
  title: 'Morning run',
  cadence: { type: 'daily' },
  lastCompletedOn: null
}
const WEEKLY_CHORE = {
  id: 'c2',
  title: 'Groceries',
  cadence: { type: 'weekly' },
  lastCompletedOn: null
}
const MONTHLY_CHORE = {
  id: 'c3',
  title: 'Deep clean',
  cadence: { type: 'monthly' },
  lastCompletedOn: null
}

function mountChores(storeOverrides = {}) {
  return mount(ChoresView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { chores: { chores: [], loading: false, error: '', ...storeOverrides } }
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

  // ── Loading / error states ─────────────────────────────────────────────────

  it('shows loading indicator while loading', () => {
    const wrapper = mountChores({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when error is set', () => {
    const wrapper = mountChores({ error: 'Chores fetch failed' })
    expect(wrapper.text()).toContain('Chores fetch failed')
  })

  it('shows error with error style', () => {
    const wrapper = mountChores({ error: 'Oops' })
    expect(wrapper.find('.chores-view__status--error').exists()).toBe(true)
  })

  // ── Empty state (WEB-T08-009 fix) ─────────────────────────────────────────

  it('does not show empty-state before load completes (prevents flash)', () => {
    // loaded ref starts false; store.load is a spy that does not resolve
    const wrapper = mountChores({ chores: [], loading: false })
    // The empty state div should NOT appear before loaded becomes true
    expect(wrapper.find('.chores-view__empty').exists()).toBe(false)
  })

  it('calls store.load on mount', () => {
    mountChores()
    const store = useChoresStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  // ── Groups computed ────────────────────────────────────────────────────────

  it('groups daily chores under the Daily section', async () => {
    // Set up store.load to resolve immediately so loaded becomes true
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [DAILY_CHORE], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const sections = wrapper.findAll('section-header-stub')
    expect(sections.some(el => el.attributes('label') === 'Daily')).toBe(true)
  })

  it('groups weekly chores under the Weekly section', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [WEEKLY_CHORE], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()

    const sections = wrapper.findAll('section-header-stub')
    expect(sections.some(el => el.attributes('label') === 'Weekly')).toBe(true)
  })

  it('groups monthly chores under the Monthly section', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [MONTHLY_CHORE], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()

    const sections = wrapper.findAll('section-header-stub')
    expect(sections.some(el => el.attributes('label') === 'Monthly')).toBe(true)
  })

  it('handles all three cadence groups simultaneously', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              chores: {
                chores: [DAILY_CHORE, WEEKLY_CHORE, MONTHLY_CHORE],
                loading: false,
                error: ''
              }
            }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()

    const sections = wrapper.findAll('section-header-stub')
    const labels = sections.map(el => el.attributes('label'))
    expect(labels).toContain('Daily')
    expect(labels).toContain('Weekly')
    expect(labels).toContain('Monthly')
  })

  // ── completeChore wired to ChoreRow ───────────────────────────────────────

  it('renders ChoreRow components for each chore', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              chores: { chores: [DAILY_CHORE, WEEKLY_CHORE], loading: false, error: '' }
            }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()

    const rows = wrapper.findAll('chore-row-stub')
    expect(rows.length).toBe(2)
  })

  // ── isEmpty computed ───────────────────────────────────────────────────────

  it('shows empty state after load with no chores', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.chores-view__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No chores yet')
  })

  // ── watch(store.loading) — resets loaded on reload ─────────────────────────

  it('resets loaded to false when store.loading becomes true (watch callback)', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()
    // loaded should now be true
    expect(wrapper.vm.loaded).toBe(true)

    // Simulate store.loading becoming true (e.g. completeChore triggers a reload)
    store.loading = true
    await wrapper.vm.$nextTick()
    // The watch should have reset loaded to false
    expect(wrapper.vm.loaded).toBe(false)
  })

  // ── New chore button renders (covers the Button element in v-else block) ──

  it('renders the New chore button after load', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Button stub renders as <button-stub>
    expect(wrapper.find('.chores-view__actions').exists()).toBe(true)
  })

  // ── null chores fallback (branch 0[1]: store.chores ?? []) ───────────────

  it('handles store.chores being null without crashing', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: null, loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()
    // Groups should all have empty items
    expect(wrapper.vm.groups.every(g => g.items.length === 0)).toBe(true)
  })

  // ── watch both branches (WEB-W4-24: also restore loaded on false) ───────

  it('resets loaded to true when store.loading transitions false → true → false (WEB-W4-24)', async () => {
    const wrapper = mount(ChoresView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { chores: { chores: [DAILY_CHORE], loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    const store = useChoresStore()
    store.load.mockResolvedValue()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loaded).toBe(true)

    // Transition loading: false → true → false
    store.loading = true
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loaded).toBe(false)

    store.loading = false
    await wrapper.vm.$nextTick()
    // WEB-W4-24: the watch now also flips `loaded` back to true on the
    // loading→done transition so the empty-state isn't briefly suppressed
    // after a completeChore reload.
    expect(wrapper.vm.loaded).toBe(true)
  })
})
