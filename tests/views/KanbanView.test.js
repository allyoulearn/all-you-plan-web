import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import KanbanView from '@/views/KanbanView.vue'
import { useProjectsStore } from '@/stores/projects.store'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'proj-1' } }),
  RouterLink: { template: '<a><slot /></a>' }
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const globalStubs = {
  ScreenHeading: true,
  KanbanCard: true,
  RouterLink: { template: '<a><slot /></a>' }
}

const PROJECT = { id: 'proj-1', name: 'Alpha' }

const BOARD = {
  project: PROJECT,
  backlog: [{ id: 't1', title: 'Plan', done: false }],
  thisWeek: [{ id: 't2', title: 'Execute', done: false }],
  doing: [{ id: 't3', title: 'Review', done: false }],
  done: [{ id: 't4', title: 'Ship', done: true }]
}

function mountKanban(storeOverrides = {}) {
  return mount(KanbanView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            projects: {
              board: null,
              loadingBoard: false,
              errorBoard: '',
              ...storeOverrides
            }
          }
        })
      ]
    }
  })
}

describe('KanbanView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  // ── Loading / error states ─────────────────────────────────────────────────

  it('shows loading indicator while loadingBoard is true', () => {
    const wrapper = mountKanban({ loadingBoard: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when errorBoard is set', () => {
    const wrapper = mountKanban({ errorBoard: 'Board fetch failed' })
    expect(wrapper.text()).toContain('Board fetch failed')
  })

  it('shows error with error style', () => {
    const wrapper = mountKanban({ errorBoard: 'Oops' })
    expect(wrapper.find('.kanban-view__status--error').exists()).toBe(true)
  })

  // ── Not-found state (WEB-T08-007 fix) ─────────────────────────────────────

  it('shows "Project not found" when board loads but project is null', () => {
    const wrapper = mountKanban({
      board: { project: null, backlog: [], thisWeek: [], doing: [], done: [] },
      loadingBoard: false,
      errorBoard: ''
    })
    expect(wrapper.text()).toContain('Project not found')
  })

  it('shows "Project not found" when board is null (empty payload)', () => {
    const wrapper = mountKanban({ board: null, loadingBoard: false, errorBoard: '' })
    expect(wrapper.text()).toContain('Project not found')
  })

  // ── Board renders correctly ────────────────────────────────────────────────

  it('calls store.loadBoard with the route param id on mount', () => {
    mountKanban()
    const store = useProjectsStore()
    expect(store.loadBoard).toHaveBeenCalledWith('proj-1')
  })

  it('renders the project back link when project is loaded', () => {
    const wrapper = mountKanban({ board: BOARD })
    expect(wrapper.text()).toContain('Alpha')
  })

  it('renders all 4 column headers', () => {
    const wrapper = mountKanban({ board: BOARD })
    expect(wrapper.text()).toContain('Backlog')
    expect(wrapper.text()).toContain('This week')
    expect(wrapper.text()).toContain('Doing')
    expect(wrapper.text()).toContain('Done')
  })

  it('renders task count badges for each column', () => {
    const wrapper = mountKanban({ board: BOARD })
    const counts = wrapper.findAll('.kanban-view__column-count')
    // Each column has exactly 1 task in BOARD
    counts.forEach(el => {
      expect(el.text()).toBe('[1]')
    })
  })

  it('renders KanbanCard for each task', () => {
    const wrapper = mountKanban({ board: BOARD })
    const cards = wrapper.findAll('kanban-card-stub')
    // BOARD has 4 tasks across 4 columns
    expect(cards.length).toBe(4)
  })

  it('shows "Empty" placeholder for an empty column', () => {
    const emptyBoard = {
      project: PROJECT,
      backlog: [],
      thisWeek: [],
      doing: [],
      done: []
    }
    const wrapper = mountKanban({ board: emptyBoard })
    const emptyTexts = wrapper.findAll('.kanban-view__empty-col')
    expect(emptyTexts.length).toBe(4)
    emptyTexts.forEach(el => expect(el.text()).toBe('Empty'))
  })

  // ── columns computed ───────────────────────────────────────────────────────

  it('defaults to empty arrays for missing board columns', () => {
    const wrapper = mountKanban({ board: { project: PROJECT } })
    // Should not throw; columns default to []
    expect(wrapper.text()).toContain('Backlog')
  })

  // ── completeTask wired to KanbanCard ──────────────────────────────────────

  it('passes the task to KanbanCard via task prop', () => {
    const wrapper = mountKanban({ board: BOARD })
    const firstCard = wrapper.find('kanban-card-stub')
    expect(firstCard.attributes('task')).toBeDefined()
  })
})
