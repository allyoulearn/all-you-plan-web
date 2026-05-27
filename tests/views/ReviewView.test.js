import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ReviewView from '@/views/ReviewView.vue'
import { useTodayStore } from '@/stores/today.store'
import { useReviewStore } from '@/stores/review.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppCard: { template: '<div><slot /></div>' },
  WrenCrossAppUpsell: { template: '<div class="wren-upsell" />' },
  WrenTurn: { template: '<div class="wren-turn"><slot /></div>', props: ['prompt', 'callout'] },
  MoodPicker: {
    template: '<div class="mood-picker" @click="$emit(\'update:modelValue\', \'steady\')" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  WinPicker: {
    template: '<div class="win-picker" />',
    props: ['tasks', 'modelValue'],
    emits: ['update:modelValue']
  },
  FrictionInput: {
    template: '<div class="friction-input" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  LeftoverRow: {
    template: '<div class="leftover-row" />',
    props: ['task', 'action'],
    emits: ['update:action']
  },
  TomorrowIntent: {
    template: '<div class="tomorrow-intent" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  SendoffCard: {
    template: '<div class="sendoff-card"><button @click="$emit(\'finish\')">Finish</button></div>',
    props: ['input', 'saving', 'disabled', 'saved'],
    emits: ['finish', 'edit']
  }
}

function buildView(tasks = []) {
  return {
    date: '2026-05-22',
    kpis: { streak: 3, todayDone: 1, todayTotal: 3, activeProjects: 2, focusMinutes: 60 },
    tasks
  }
}

function mountReview(todayState = {}, reviewState = {}, todayOverrides = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      today: { view: null, loading: false, error: '', ...todayState },
      review: { review: null, loading: false, saving: false, error: '', ...reviewState }
    }
  })

  const wrapper = mount(ReviewView, {
    global: { stubs: globalStubs, plugins: [pinia, i18n] }
  })

  // Inject overrides on the store mock (rescheduleTask, etc.)
  const todayStore = useTodayStore()
  Object.assign(todayStore, todayOverrides)
  return { wrapper, todayStore, reviewStore: useReviewStore() }
}

describe('ReviewView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Mount / data load --

  it('calls todayStore.load and reviewStore.load on mount with the same date', () => {
    const { todayStore, reviewStore } = mountReview()
    expect(todayStore.load).toHaveBeenCalledTimes(1)
    expect(reviewStore.load).toHaveBeenCalledTimes(1)
    expect(todayStore.load.mock.calls[0][0]).toBe(reviewStore.load.mock.calls[0][0])
  })

  // -- Hydration from saved review --

  it('hydrates mood from the saved review', async () => {
    const { wrapper } = mountReview({}, {
      review: {
        id: 'r1',
        mood: 'good',
        responses: {
          wins: { starred: [], freeText: '' },
          friction: { text: '', tags: [] },
          leftovers: { tomorrow: [], picked: [], dropped: [], kept: [] },
          tomorrowIntent: ''
        }
      }
    })
    await flushPromises()
    expect(wrapper.vm.mood).toBe('good')
  })

  // -- Section rendering --

  it('renders all six Wren-led sections plus a sendoff card', () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]
    const { wrapper } = mountReview({ view: buildView(tasks) })

    expect(wrapper.find('.mood-picker').exists()).toBe(true)
    expect(wrapper.find('.win-picker').exists()).toBe(true)
    expect(wrapper.find('.friction-input').exists()).toBe(true)
    expect(wrapper.findAll('.leftover-row')).toHaveLength(1) // one pending task
    expect(wrapper.find('.tomorrow-intent').exists()).toBe(true)
    expect(wrapper.find('.sendoff-card').exists()).toBe(true)
  })

  it('shows leftovers empty state when no pending tasks', () => {
    const tasks = [{ id: 't1', title: 'Done', done: true }]
    const { wrapper } = mountReview({ view: buildView(tasks) })
    expect(wrapper.findAll('.leftover-row')).toHaveLength(0)
    expect(wrapper.text()).toContain('Everything got done')
  })

  // -- Finish review wires save and reschedule mutations --

  it('calls reviewStore.save with structured responses on finish', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]

    const { wrapper, reviewStore, todayStore } = mountReview(
      { view: buildView(tasks) },
      {},
      { rescheduleTask: vi.fn().mockResolvedValue(undefined) }
    )

    wrapper.vm.mood = 'steady'
    await wrapper.vm.$nextTick()
    await wrapper.vm.finishReview()
    await flushPromises()

    expect(reviewStore.save).toHaveBeenCalledTimes(1)
    const [date, mood, responses] = reviewStore.save.mock.calls[0]
    expect(typeof date).toBe('string')
    expect(mood).toBe('steady')
    expect(responses).toMatchObject({
      wins: { starred: expect.any(Array), freeText: expect.any(String) },
      friction: { text: expect.any(String), tags: expect.any(Array) },
      leftovers: { tomorrow: ['t2'], picked: [], dropped: [], kept: [] },
      tomorrowIntent: expect.any(String)
    })

    // Reschedule was called for the leftover pending task
    expect(todayStore.rescheduleTask).toHaveBeenCalledTimes(1)
    const [taskId, opts] = todayStore.rescheduleTask.mock.calls[0]
    expect(taskId).toBe('t2')
    expect(opts.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not re-fire reschedule mutations when finish is called with the same leftover decisions as the saved review', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]

    const savedResponses = {
      wins: { starred: [], freeText: '' },
      friction: { text: '', tags: [] },
      leftovers: { tomorrow: ['t2'], picked: [], dropped: [], kept: [] },
      tomorrowIntent: ''
    }

    const { wrapper, todayStore } = mountReview(
      { view: buildView(tasks) },
      { review: { id: 'r1', mood: 'steady', responses: savedResponses } },
      { rescheduleTask: vi.fn().mockResolvedValue(undefined) }
    )
    await flushPromises()

    await wrapper.vm.finishReview()
    await flushPromises()

    expect(todayStore.rescheduleTask).not.toHaveBeenCalled()
  })
})
