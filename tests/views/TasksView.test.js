import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import TasksView from '@/views/TasksView.vue'
import { useTasksStore } from '@/stores/tasks.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: {
    props: ['eyebrow', 'title', 'emphasis'],
    template: '<header class="heading-stub"><slot name="meta" /></header>'
  },
  AppButton: {
    props: ['variant', 'icon', 'size', 'disabled'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>'
  },
  AppCard: { template: '<div class="card-stub"><slot /></div>' },
  AppSegmentedControl: {
    props: ['modelValue', 'options', 'groupLabel'],
    emits: ['update:modelValue'],
    template:
      '<div class="seg-stub"><button v-for="o in options" :key="o.value" type="button" :data-value="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  },
  UrgencySummary: {
    props: ['summary', 'upcoming'],
    emits: ['select'],
    template:
      '<div class="urgency-summary-stub" :data-upcoming="upcoming"><button class="us-urgency" @click="$emit(\'select\', \'urgency\')" /><button class="us-due" @click="$emit(\'select\', \'due\')" /></div>'
  },
  CategoryFilter: {
    props: ['modelValue', 'categories'],
    emits: ['update:modelValue'],
    template: '<div class="cat-filter-stub" :data-count="categories.length" />'
  },
  TaskGroup: {
    props: ['group'],
    emits: ['complete'],
    template:
      '<div class="task-group-stub" :data-key="group.key" :data-count="group.count"><button class="tg-complete" @click="$emit(\'complete\', group.tasks[0]?.id)" /></div>'
  },
  CreateTaskModal: {
    props: ['modelValue'],
    template: '<div v-if="modelValue" class="create-modal-stub" />'
  }
}

function task(id, overrides = {}) {
  return {
    id,
    title: `Task ${id}`,
    note: null,
    urgency: 'high',
    category: 'admin',
    kind: 'once',
    dueDate: null,
    due: null,
    done: false,
    tag: null,
    project: null,
    ...overrides
  }
}

const seededTasks = [
  task('a', {
    urgency: 'critical',
    category: 'admin',
    dueDate: '2026-06-04',
    due: { label: 'd1', daysLeft: 1 }
  }),
  task('b', { urgency: 'high', category: 'studio' }),
  task('c', { urgency: 'medium', category: 'music' }),
  task('d', { urgency: 'high', category: 'admin', done: true })
]

const seededSummary = { total: 3, overdue: 0, dated: 1, critical: 1, high: 1, doneRecently: 1 }

function mountView(extraState = {}) {
  return mount(TasksView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            tasks: {
              tasks: seededTasks,
              summary: seededSummary,
              loading: false,
              error: '',
              showDone: false,
              groupBy: 'urgency',
              categoryFilter: null,
              ...extraState
            }
          }
        }),
        i18n
      ]
    }
  })
}

describe('TasksView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls load on mount', async () => {
    const wrapper = mountView()
    const store = useTasksStore()
    await flushPromises()
    expect(store.load).toHaveBeenCalled()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the urgency summary with the upcoming count derived from tasks', async () => {
    const wrapper = mountView()
    await flushPromises()
    const summary = wrapper.find('.urgency-summary-stub')
    expect(summary.exists()).toBe(true)
    // task 'a' is due in 1 day (open) → upcoming = 1
    expect(summary.attributes('data-upcoming')).toBe('1')
  })

  it('renders a TaskGroup per non-empty urgency group', async () => {
    const wrapper = mountView()
    await flushPromises()
    const keys = wrapper.findAll('.task-group-stub').map(g => g.attributes('data-key'))
    // open tasks: a(critical), b(high), c(medium); d is done/hidden
    expect(keys).toEqual(['critical', 'high', 'medium'])
  })

  it('shows the empty-state card when there are no visible groups', async () => {
    const wrapper = mountView({ tasks: [], summary: { ...seededSummary, total: 0 } })
    await flushPromises()
    expect(wrapper.find('.card-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nothing here.')
  })

  it('renders the footer note', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('Tasks flow into Today')
  })

  it('switching the segmented control calls setGroupBy', async () => {
    const wrapper = mountView()
    const store = useTasksStore()
    await flushPromises()
    await wrapper.find('button[data-value="due"]').trigger('click')
    expect(store.setGroupBy).toHaveBeenCalledWith('due')
  })

  it('a summary select sets grouping and clears the category filter', async () => {
    const wrapper = mountView()
    const store = useTasksStore()
    await flushPromises()
    await wrapper.find('.us-due').trigger('click')
    expect(store.setGroupBy).toHaveBeenCalledWith('due')
    expect(store.setCategoryFilter).toHaveBeenCalledWith(null)
  })

  it('the show-done button calls toggleShowDone', async () => {
    const wrapper = mountView()
    const store = useTasksStore()
    await flushPromises()
    const btn = wrapper.findAll('button').find(b => b.text().includes('Show done'))
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(store.toggleShowDone).toHaveBeenCalled()
  })

  it('the New task button opens the create modal', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.find('.create-modal-stub').exists()).toBe(false)
    const btn = wrapper.findAll('button').find(b => b.text().includes('New task'))
    await btn.trigger('click')
    await flushPromises()
    expect(wrapper.find('.create-modal-stub').exists()).toBe(true)
  })

  it('forwarding a TaskGroup complete calls store.completeTask', async () => {
    const wrapper = mountView()
    const store = useTasksStore()
    store.completeTask.mockResolvedValue(undefined)
    await flushPromises()
    await wrapper.find('.tg-complete').trigger('click')
    expect(store.completeTask).toHaveBeenCalled()
  })

  it('renders the error state when the store has an error', async () => {
    const wrapper = mountView({ error: 'boom', loading: false })
    await flushPromises()
    expect(wrapper.text()).toContain('boom')
  })
})
