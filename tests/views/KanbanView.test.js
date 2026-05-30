import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import KanbanView from '@/views/KanbanView.vue'
import { useProjectsStore } from '@/stores/projects.store'
import en from '@/i18n/locales/en.json'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'proj-1' } }),
  RouterLink: { template: '<a><slot /></a>' }
}))

// Stub vuedraggable so the component renders without instantiating the
// SortableJS engine in jsdom. The stub honours the slot-based item API:
// expose each list element through the `item` slot just like the real
// component does.
vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    props: ['modelValue', 'list', 'itemKey', 'group', 'handle', 'animation'],
    template:
      '<div data-test="draggable"><template v-for="(element, index) in (modelValue || list || [])" :key="element[itemKey] ?? index"><slot name="item" :element="element" :index="index" /></template><slot name="footer" /></div>'
  }
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: {
    props: ['title', 'emphasis'],
    template: '<header class="screen-heading-stub">{{ title }}<em>{{ emphasis }}</em></header>'
  },
  KanbanCard: true,
  ColumnHeaderMenu: true,
  RenameColumnModal: true,
  DeleteColumnDialog: true,
  AddColumnButton: true,
  TaskDetailModal: true,
  RouterLink: { template: '<a><slot /></a>' }
}

const PROJECT = { id: 'proj-1', name: 'Alpha' }

const BOARD = {
  project: PROJECT,
  columns: [
    { id: 'col-bl', label: 'Backlog', order: 0 },
    { id: 'col-tw', label: 'This week', order: 1 },
    { id: 'col-do', label: 'Doing', order: 2 },
    { id: 'col-dn', label: 'Done', order: 3 }
  ],
  tasksByColumn: [
    { columnId: 'col-bl', tasks: [{ id: 't1', title: 'Plan', done: false, columnId: 'col-bl' }] },
    {
      columnId: 'col-tw',
      tasks: [{ id: 't2', title: 'Execute', done: false, columnId: 'col-tw' }]
    },
    { columnId: 'col-do', tasks: [{ id: 't3', title: 'Review', done: false, columnId: 'col-do' }] },
    { columnId: 'col-dn', tasks: [{ id: 't4', title: 'Ship', done: true, columnId: 'col-dn' }] }
  ]
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
        }),
        i18n
      ]
    }
  })
}

describe('KanbanView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

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

  it('shows "Project not found" when board loads but project is null', () => {
    const wrapper = mountKanban({
      board: { project: null, columns: [], tasksByColumn: [] },
      loadingBoard: false,
      errorBoard: ''
    })

    expect(wrapper.text()).toContain('Project not found')
  })

  it('shows "Project not found" when board is null (empty payload)', () => {
    const wrapper = mountKanban({ board: null, loadingBoard: false, errorBoard: '' })
    expect(wrapper.text()).toContain('Project not found')
  })

  it('calls store.loadBoard with the route param id on mount', () => {
    mountKanban()
    const store = useProjectsStore()
    expect(store.loadBoard).toHaveBeenCalledWith('proj-1')
  })

  it('renders the project back link when project is loaded', () => {
    const wrapper = mountKanban({ board: BOARD })
    expect(wrapper.text()).toContain('Alpha')
  })

  it('renders every column header label from the board', () => {
    const wrapper = mountKanban({ board: BOARD })
    expect(wrapper.text()).toContain('Backlog')
    expect(wrapper.text()).toContain('This week')
    expect(wrapper.text()).toContain('Doing')
    expect(wrapper.text()).toContain('Done')
  })

  it('renders task count badges for each column', () => {
    const wrapper = mountKanban({ board: BOARD })
    const counts = wrapper.findAll('.kanban-view__column-count')
    expect(counts).toHaveLength(4)

    counts.forEach(el => {
      expect(el.text()).toBe('[1]')
    })
  })

  it('renders KanbanCard for each task across all columns', () => {
    const wrapper = mountKanban({ board: BOARD })
    const cards = wrapper.findAllComponents({ name: 'KanbanCard' })
    expect(cards.length).toBe(4)
  })

  it('shows "Empty" placeholder for an empty column', () => {
    const emptyBoard = {
      project: PROJECT,
      columns: BOARD.columns,
      tasksByColumn: BOARD.columns.map(c => ({ columnId: c.id, tasks: [] }))
    }

    const wrapper = mountKanban({ board: emptyBoard })
    const emptyTexts = wrapper.findAll('.kanban-view__empty-col')
    expect(emptyTexts.length).toBe(4)
    emptyTexts.forEach(el => expect(el.text()).toBe('Empty'))
  })

  it('renders no columns when the board has none', () => {
    const wrapper = mountKanban({
      board: { project: PROJECT, columns: [], tasksByColumn: [] }
    })

    expect(wrapper.findAll('.kanban-view__column')).toHaveLength(0)
  })

  it('passes the task to KanbanCard via task prop', () => {
    const wrapper = mountKanban({ board: BOARD })
    const firstCard = wrapper.findComponent({ name: 'KanbanCard' })
    expect(firstCard.props('task')).toMatchObject({ id: 't1' })
  })

  it('forwards a column rename through the store action', async () => {
    const wrapper = mountKanban({ board: BOARD })
    const store = useProjectsStore()
    // The view exposes renameTarget for the modal via the menu; invoke the
    // handler directly since the menu itself is a stub.
    wrapper.vm.openRenameFor({ id: 'col-bl', label: 'Backlog' })
    await wrapper.vm.onRenameSubmit('Inbox')
    expect(store.renameColumn).toHaveBeenCalledWith('col-bl', 'Inbox')
  })

  it('forwards a column delete through the store action', async () => {
    const wrapper = mountKanban({ board: BOARD })
    const store = useProjectsStore()
    wrapper.vm.openDeleteFor({ id: 'col-tw', label: 'This week' })
    await wrapper.vm.onDeleteConfirm({ mode: 'delete', moveToColumnId: null })
    expect(store.deleteColumn).toHaveBeenCalledWith('col-tw', 'delete', null)
  })

  it('forwards an add-column event through the store action', async () => {
    const wrapper = mountKanban({ board: BOARD })
    const store = useProjectsStore()
    await wrapper.vm.onAddColumn('Review')
    expect(store.createColumn).toHaveBeenCalledWith('proj-1', 'Review')
  })

  describe('drag handlers', () => {
    it('onColumnDragEnd skips network call when order unchanged', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      // Don't touch localBoard column order — should be a no-op.
      await wrapper.vm.onColumnDragEnd()
      expect(store.reorderColumns).not.toHaveBeenCalled()
    })

    it('onColumnDragEnd fires reorder when order changed', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.reorderColumns.mockResolvedValue()
      // Reverse the local board columns to simulate a drag.
      wrapper.vm.localBoard.columns = [...BOARD.columns].reverse()
      await wrapper.vm.$nextTick()
      wrapper.vm.onColumnDragEnd()

      expect(store.reorderColumns).toHaveBeenCalledWith('proj-1', [
        'col-dn',
        'col-do',
        'col-tw',
        'col-bl'
      ])
    })

    it('onColumnDragEnd is safe when localBoard is null', async () => {
      const wrapper = mountKanban({ board: null })
      const store = useProjectsStore()
      // localBoard should be null when board is null
      wrapper.vm.localBoard = null
      await wrapper.vm.onColumnDragEnd()
      expect(store.reorderColumns).not.toHaveBeenCalled()
    })

    it('onTaskDragEnd within the same column fires reorder', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.reorderTasksInColumn.mockResolvedValue()

      // Inject a second task into col-tw so reorder is meaningful
      wrapper.vm.localBoard.tasksByColumn[1].tasks = [
        { id: 't2a', title: 'A', done: false, columnId: 'col-tw' },
        { id: 't2', title: 'Execute', done: false, columnId: 'col-tw' }
      ]

      await wrapper.vm.$nextTick()

      const evt = {
        from: { dataset: { columnId: 'col-tw' } },
        to: { dataset: { columnId: 'col-tw' } },
        oldIndex: 0,
        newIndex: 1
      }

      wrapper.vm.onTaskDragEnd(evt)
      expect(store.reorderTasksInColumn).toHaveBeenCalled()
    })

    it('onTaskDragEnd within same column skips when oldIndex === newIndex', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()

      const evt = {
        from: { dataset: { columnId: 'col-tw' } },
        to: { dataset: { columnId: 'col-tw' } },
        oldIndex: 0,
        newIndex: 0
      }

      await wrapper.vm.onTaskDragEnd(evt)
      expect(store.reorderTasksInColumn).not.toHaveBeenCalled()
    })

    it('onTaskDragEnd across columns fires store.moveTask', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.moveTask.mockResolvedValue()
      // Simulate vuedraggable having already shifted the local task arrays:
      // t1 moved from col-bl to col-tw at index 0.
      const t1 = wrapper.vm.localBoard.tasksByColumn[0].tasks[0]
      wrapper.vm.localBoard.tasksByColumn[0].tasks = []

      wrapper.vm.localBoard.tasksByColumn[1].tasks = [
        t1,
        ...wrapper.vm.localBoard.tasksByColumn[1].tasks
      ]

      await wrapper.vm.$nextTick()

      const evt = {
        from: { dataset: { columnId: 'col-bl' } },
        to: { dataset: { columnId: 'col-tw' } },
        oldIndex: 0,
        newIndex: 0
      }

      wrapper.vm.onTaskDragEnd(evt)
      expect(store.moveTask).toHaveBeenCalledWith('t1', 'col-bl', 'col-tw', 0, expect.any(Array))
    })

    it('onTaskDragEnd is a no-op without source/target column id', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      await wrapper.vm.onTaskDragEnd({ from: {}, to: {} })
      expect(store.moveTask).not.toHaveBeenCalled()
    })

    it('onTaskDragEnd is a no-op when localBoard is null', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      wrapper.vm.localBoard = null

      const evt = {
        from: { dataset: { columnId: 'col-bl' } },
        to: { dataset: { columnId: 'col-tw' } },
        oldIndex: 0,
        newIndex: 0
      }

      await wrapper.vm.onTaskDragEnd(evt)
      expect(store.moveTask).not.toHaveBeenCalled()
    })

    it('onTaskDragEnd is a no-op when movedTask cannot be located at newIndex', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()

      const evt = {
        from: { dataset: { columnId: 'col-tw' } },
        to: { dataset: { columnId: 'col-tw' } },
        oldIndex: 0,
        newIndex: 99
      }

      await wrapper.vm.onTaskDragEnd(evt)
      expect(store.moveTask).not.toHaveBeenCalled()
      expect(store.reorderTasksInColumn).not.toHaveBeenCalled()
    })
  })

  describe('task detail modal', () => {
    it('openTaskDetail sets detailTask and opens modal', async () => {
      const wrapper = mountKanban({ board: BOARD })
      wrapper.vm.openTaskDetail({ id: 't1' })
      expect(wrapper.vm.detailOpen).toBe(true)
      expect(wrapper.vm.detailTask?.id).toBe('t1')
    })

    it('onTaskSave closes modal when updates are empty', async () => {
      const wrapper = mountKanban({ board: BOARD })
      wrapper.vm.openTaskDetail({ id: 't1' })
      await wrapper.vm.onTaskSave({})
      expect(wrapper.vm.detailOpen).toBe(false)
    })

    it('onTaskSave forwards updates to store.updateTask', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.updateTask.mockResolvedValue()
      wrapper.vm.openTaskDetail({ id: 't1' })
      await wrapper.vm.onTaskSave({ title: 'Renamed' })
      expect(store.updateTask).toHaveBeenCalledWith('t1', { title: 'Renamed' })
      expect(wrapper.vm.detailOpen).toBe(false)
    })

    it('onTaskSave keeps modal open when store.updateTask rejects', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.updateTask.mockRejectedValue(new Error('boom'))
      wrapper.vm.openTaskDetail({ id: 't1' })
      await wrapper.vm.onTaskSave({ title: 'Renamed' })
      expect(wrapper.vm.detailOpen).toBe(true)
    })

    it('onTaskDelete invokes store.deleteTask and closes the modal', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.deleteTask.mockResolvedValue()
      wrapper.vm.openTaskDetail({ id: 't1' })
      await wrapper.vm.onTaskDelete()
      expect(store.deleteTask).toHaveBeenCalledWith('t1')
      expect(wrapper.vm.detailOpen).toBe(false)
    })

    it('onTaskDelete keeps modal open when delete fails', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.deleteTask.mockRejectedValue(new Error('boom'))
      wrapper.vm.openTaskDetail({ id: 't1' })
      await wrapper.vm.onTaskDelete()
      expect(wrapper.vm.detailOpen).toBe(true)
    })

    it('onTaskDelete is a no-op without an active task', async () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      await wrapper.vm.onTaskDelete()
      expect(store.deleteTask).not.toHaveBeenCalled()
    })

    it('onAddSubtask forwards to store.addSubtask', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.addSubtask.mockResolvedValue()
      wrapper.vm.openTaskDetail({ id: 't1' })
      wrapper.vm.onAddSubtask({ text: 'step 1' })
      expect(store.addSubtask).toHaveBeenCalledWith('t1', 'step 1')
    })

    it('onAddSubtask is a no-op without active task', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      wrapper.vm.onAddSubtask({ text: 'step' })
      expect(store.addSubtask).not.toHaveBeenCalled()
    })

    it('onUpdateSubtask forwards to store.updateSubtask', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.updateSubtask.mockResolvedValue()
      wrapper.vm.openTaskDetail({ id: 't1' })
      wrapper.vm.onUpdateSubtask({ subtaskId: 's1', done: true })
      expect(store.updateSubtask).toHaveBeenCalledWith('t1', 's1', { done: true })
    })

    it('onUpdateSubtask is a no-op without active task', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      wrapper.vm.onUpdateSubtask({ subtaskId: 's1' })
      expect(store.updateSubtask).not.toHaveBeenCalled()
    })

    it('onDeleteSubtask forwards to store.deleteSubtask', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      store.deleteSubtask.mockResolvedValue()
      wrapper.vm.openTaskDetail({ id: 't1' })
      wrapper.vm.onDeleteSubtask({ subtaskId: 's1' })
      expect(store.deleteSubtask).toHaveBeenCalledWith('t1', 's1')
    })

    it('onDeleteSubtask is a no-op without active task', () => {
      const wrapper = mountKanban({ board: BOARD })
      const store = useProjectsStore()
      wrapper.vm.onDeleteSubtask({ subtaskId: 's1' })
      expect(store.deleteSubtask).not.toHaveBeenCalled()
    })

    it('detailTask is null when no task id is set', () => {
      const wrapper = mountKanban({ board: BOARD })
      expect(wrapper.vm.detailTask).toBeNull()
    })
  })
})
