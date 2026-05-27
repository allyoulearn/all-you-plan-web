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
  AppButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click']
  },
  WrenCrossAppUpsell: { template: '<div class="wren-upsell" />' },
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

  // -- Stepper rendering --

  it('starts on step 1 (mood)', () => {
    const { wrapper } = mountReview()
    expect(wrapper.vm.currentStep).toBe(1)
    expect(wrapper.find('.mood-picker').exists()).toBe(true)
    expect(wrapper.find('.win-picker').exists()).toBe(false)
  })

  it('renders only the active step component', async () => {
    const { wrapper } = mountReview({ view: buildView([]) })
    wrapper.vm.mood = 'steady'
    await wrapper.vm.$nextTick()

    wrapper.vm.next()
    await flushPromises()
    expect(wrapper.find('.mood-picker').exists()).toBe(false)
    expect(wrapper.find('.win-picker').exists()).toBe(true)
  })

  it('renders the empty leftover state when no pending tasks on step 4', async () => {
    const tasks = [{ id: 't1', title: 'Done', done: true }]
    const { wrapper } = mountReview({ view: buildView(tasks) })
    wrapper.vm.mood = 'steady'
    wrapper.vm.goToStep(4)
    await flushPromises()
    expect(wrapper.text()).toContain('Everything got done')
    expect(wrapper.findAll('.leftover-row')).toHaveLength(0)
  })

  it('renders leftover rows on step 4 when there are pending tasks', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]
    const { wrapper } = mountReview({ view: buildView(tasks) })
    wrapper.vm.mood = 'steady'
    wrapper.vm.goToStep(4)
    await flushPromises()
    expect(wrapper.findAll('.leftover-row')).toHaveLength(1)
  })

  // -- Navigation gating --

  it('blocks advance from step 1 without a mood', async () => {
    const { wrapper } = mountReview()
    expect(wrapper.vm.canAdvance).toBe(false)
    wrapper.vm.next()
    await flushPromises()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('allows advance from step 1 once mood is set', async () => {
    const { wrapper } = mountReview()
    wrapper.vm.mood = 'steady'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.canAdvance).toBe(true)
    wrapper.vm.next()
    await flushPromises()
    expect(wrapper.vm.currentStep).toBe(2)
  })

  it('clamps backward navigation at step 1', async () => {
    const { wrapper } = mountReview()
    wrapper.vm.prev()
    await flushPromises()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('clamps forward navigation at the finale', async () => {
    const { wrapper } = mountReview()
    wrapper.vm.mood = 'steady'
    await wrapper.vm.$nextTick()
    for (let i = 0; i < 10; i++) wrapper.vm.next()
    await flushPromises()
    expect(wrapper.vm.currentStep).toBe(6)
    expect(wrapper.vm.isFinale).toBe(true)
  })

  it('routes goToStep back to 1 when mood is unset and target is > 1', () => {
    const { wrapper } = mountReview()
    wrapper.vm.goToStep(3)
    expect(wrapper.vm.currentStep).toBe(1)
  })

  // -- Finale on existing saved review --

  it('lands directly on the finale when a saved review exists', async () => {
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
    expect(wrapper.vm.currentStep).toBe(6)
    expect(wrapper.find('.sendoff-card').exists()).toBe(true)
  })

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

  // -- Edit affordance from the finale --

  it('returns to step 1 in editing mode when SendoffCard emits edit', async () => {
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
    wrapper.vm.onEdit()
    await flushPromises()
    expect(wrapper.vm.currentStep).toBe(1)
    expect(wrapper.vm.editing).toBe(true)
  })

  // -- Finish wires save + reschedule mutations --

  it('calls reviewStore.save with structured responses on Finish', async () => {
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
