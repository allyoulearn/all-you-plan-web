import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ReviewView from '@/views/ReviewView.vue'
import { useTodayStore } from '@/stores/today.store'
import { useReviewStore } from '@/stores/review.store'
import en from '@/i18n/locales/en.json'

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  ScreenHeading: true,
  Card: { template: '<div><slot /></div>' },
  Button: { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
  RouterLink: true
}

function buildView(tasks = []) {
  return {
    date: '2026-05-22',
    sunrise: '6:01 AM',
    sunset: '8:17 PM',
    kpis: { streak: 3, todayDone: 1, todayTotal: 3, activeProjects: 2, focusMinutes: 60 },
    tasks
  }
}

function mountReview(todayState = {}, reviewState = {}) {
  return mount(ReviewView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            today: { view: null, loading: false, error: '', ...todayState },
            review: { review: null, loading: false, saving: false, error: '', ...reviewState }
          }
        }),
        i18n
      ]
    }
  })
}

describe('ReviewView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Rendering / step labels (WEB-T08-015 fix) --

  it('renders Step 1 label via i18n', () => {
    const wrapper = mountReview()
    expect(wrapper.text()).toContain('Step 1')
    expect(wrapper.text()).toContain('energy')
  })

  it('renders Step 2 label via i18n', () => {
    const wrapper = mountReview()
    expect(wrapper.text()).toContain('Step 2')
    expect(wrapper.text()).toContain('moved forward')
  })

  it('renders Step 3 label via i18n', () => {
    const wrapper = mountReview()
    expect(wrapper.text()).toContain('Step 3')
    expect(wrapper.text()).toContain("didn't finish")
  })

  it('renders Step 4 label via i18n', () => {
    const wrapper = mountReview()
    expect(wrapper.text()).toContain('Step 4')
    expect(wrapper.text()).toContain("Wren's send-off")
  })

  it('renders the send-off quote via i18n', () => {
    const wrapper = mountReview()
    expect(wrapper.text()).toContain('Every day that ends')
  })

  // -- Mood selector --

  it('renders all 5 mood options', () => {
    const wrapper = mountReview()
    for (const m of ['heavy', 'low', 'ok', 'good', 'alight']) {
      expect(wrapper.text()).toContain(m)
    }
  })

  it('updates mood when a mood button is clicked', async () => {
    const wrapper = mountReview()
    // MOODS buttons are stubbed as real <button> elements
    const moodButtons = wrapper.findAll('button')
    // First mood button should be 'heavy'
    await moodButtons[0].trigger('click')
    expect(wrapper.vm.mood).toBe('heavy')
  })

  it('finish button is disabled when no mood is selected', () => {
    const wrapper = mountReview()
    // mood starts as '' — find the Finish review button
    const buttons = wrapper.findAll('button')
    const finishBtn = buttons.find(b => b.attributes('disabled') !== undefined)
    expect(finishBtn).toBeDefined()
  })

  // -- Loading state --

  it('shows loading text in Step 2 when todayStore is loading', () => {
    const wrapper = mountReview({ loading: true })
    // Step 2 and Step 3 both show loading text
    expect(wrapper.text()).toContain('Loading')
  })

  // -- Done tasks (Step 2) --

  it('renders done tasks in the task list', () => {
    const tasks = [{ id: 't1', title: 'Finish report', done: true, scheduledTime: '09:00' }]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.text()).toContain('Finish report')
  })

  it('done task gets the line-through CSS class', () => {
    const tasks = [{ id: 't1', title: 'Finish report', done: true, scheduledTime: '09:00' }]
    const wrapper = mountReview({ view: buildView(tasks) })
    const doneTitle = wrapper.find('.review-view__task-title--done')
    expect(doneTitle.exists()).toBe(true)
    expect(doneTitle.text()).toContain('Finish report')
  })

  it('shows "No completed tasks today" when no done tasks', () => {
    const tasks = [{ id: 't1', title: 'Pending', done: false, scheduledTime: '10:00' }]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.text()).toContain('No completed tasks today')
  })

  // -- Pending tasks (Step 3) --

  it('renders pending tasks in Step 3', () => {
    const tasks = [
      { id: 't1', title: 'Not done', done: false, scheduledTime: '10:00' },
      { id: 't2', title: 'Also done', done: true, scheduledTime: '15:00' }
    ]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.text()).toContain('Not done')
  })

  it('shows "Everything got done" when all tasks are done', () => {
    const tasks = [{ id: 't1', title: 'Done task', done: true, scheduledTime: '09:00' }]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.text()).toContain('Everything got done')
  })

  // -- Save state --

  it('shows "Saving…" text while review is saving', () => {
    const wrapper = mountReview({}, { saving: true })
    expect(wrapper.text()).toContain('Saving')
  })

  it('shows "Review saved." when review has an id and is not saving', () => {
    const wrapper = mountReview({}, { review: { id: 'rev1', mood: 'ok' }, saving: false })
    expect(wrapper.text()).toContain('Review saved')
  })

  it('does not show saved note when saving is in progress', () => {
    const wrapper = mountReview({}, { review: { id: 'rev1', mood: 'ok' }, saving: true })
    expect(wrapper.text()).not.toContain('Review saved')
  })

  // -- Error state --

  it('shows error message when reviewStore.error is set', () => {
    const wrapper = mountReview({}, { error: 'Failed to save review' })
    expect(wrapper.text()).toContain('Failed to save review')
  })

  // -- Lifecycle --

  it('calls todayStore.load and reviewStore.load on mount', () => {
    mountReview()
    const todayStore = useTodayStore()
    const reviewStore = useReviewStore()
    expect(todayStore.load).toHaveBeenCalledTimes(1)
    expect(reviewStore.load).toHaveBeenCalledTimes(1)
  })

  it('passes the same date to both load calls', () => {
    mountReview()
    const todayStore = useTodayStore()
    const reviewStore = useReviewStore()
    const todayArg = todayStore.load.mock.calls[0][0]
    const reviewArg = reviewStore.load.mock.calls[0][0]
    // Both should be the same ISO date string
    expect(todayArg).toBe(reviewArg)
    expect(todayArg).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // -- WEB-T08-011 fix: todayDate is a plain string, not a reactive computed --

  it('todayDate is a plain ISO string (not a ref)', () => {
    const wrapper = mountReview()
    // If todayDate is a plain const it should be a string in the component's vm context
    expect(typeof wrapper.vm.todayDate).toBe('string')
    expect(wrapper.vm.todayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // -- finishReview --

  it('calls reviewStore.save with mood and task ids when finish is clicked', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true, scheduledTime: '09:00' },
      { id: 't2', title: 'Pending', done: false, scheduledTime: '13:00' }
    ]
    const wrapper = mountReview({ view: buildView(tasks) })
    const reviewStore = useReviewStore()

    // Set mood first
    wrapper.vm.mood = 'ok'
    await wrapper.vm.$nextTick()

    await wrapper.vm.finishReview()
    expect(reviewStore.save).toHaveBeenCalledWith(wrapper.vm.todayDate, 'ok', {
      moved: ['t1'],
      pending: ['t2']
    })
  })

  // -- Empty state when view is null --

  it('renders nothing (no tasks) when todayStore.view is null and not loading', () => {
    const wrapper = mountReview({ view: null, loading: false })
    // No task items should appear
    expect(wrapper.findAll('.review-view__task-row')).toHaveLength(0)
  })

  // -- doneTasks / pendingTasks computed --

  it('correctly computes doneTasks from view tasks', () => {
    const tasks = [
      { id: 'a', title: 'A', done: true, scheduledTime: null },
      { id: 'b', title: 'B', done: false, scheduledTime: null },
      { id: 'c', title: 'C', done: true, scheduledTime: null }
    ]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.vm.doneTasks.map(t => t.id)).toEqual(['a', 'c'])
  })

  it('correctly computes pendingTasks from view tasks', () => {
    const tasks = [
      { id: 'a', title: 'A', done: true, scheduledTime: null },
      { id: 'b', title: 'B', done: false, scheduledTime: null }
    ]
    const wrapper = mountReview({ view: buildView(tasks) })
    expect(wrapper.vm.pendingTasks.map(t => t.id)).toEqual(['b'])
  })
})
