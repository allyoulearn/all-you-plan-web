import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '@/stores/projects.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations/index.js', () => ({
  PROJECTS_QUERY: 'PROJECTS_QUERY',
  PROJECT_BOARD_QUERY: 'PROJECT_BOARD_QUERY',
  COMPLETE_PROJECT_TASK: 'COMPLETE_PROJECT_TASK',
  CREATE_PROJECT: 'CREATE_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  CREATE_TASK: 'CREATE_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_SUBTASK: 'ADD_SUBTASK',
  UPDATE_SUBTASK: 'UPDATE_SUBTASK',
  DELETE_SUBTASK: 'DELETE_SUBTASK',
  CREATE_COLUMN: 'CREATE_COLUMN',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  REORDER_COLUMNS: 'REORDER_COLUMNS',
  DELETE_COLUMN: 'DELETE_COLUMN',
  MOVE_TASK: 'MOVE_TASK',
  REORDER_TASKS_IN_COLUMN: 'REORDER_TASKS_IN_COLUMN'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeProjects = [
  { id: 'p1', title: 'Alpha', status: 'on_track', progress: { percent: 0.5, done: 2, total: 4 } },
  { id: 'p2', title: 'Beta', status: 'idle', progress: { percent: 0, done: 0, total: 3 } }
]

const fakeBoard = {
  project: { id: 'p1', title: 'Alpha', status: 'on_track' },
  columns: [
    { id: 'col-tw', label: 'This week', order: 0 },
    { id: 'col-dn', label: 'Done', order: 1 }
  ],
  tasksByColumn: [
    { columnId: 'col-tw', tasks: [{ id: 't1', title: 'Task A', done: false, columnId: 'col-tw' }] },
    { columnId: 'col-dn', tasks: [] }
  ]
}

function makeOptimisticBoard() {
  return {
    project: {
      id: 'p1',
      title: 'Alpha',
      status: 'on_track',
      progress: { done: 1, total: 4, percent: 25 }
    },
    columns: [
      { id: 'col-tw', label: 'This week', order: 0 },
      { id: 'col-do', label: 'Doing', order: 1 },
      { id: 'col-bl', label: 'Backlog', order: 2 },
      { id: 'col-dn', label: 'Done', order: 3 }
    ],
    tasksByColumn: [
      {
        columnId: 'col-tw',
        tasks: [{ id: 't1', title: 'Task A', done: false, tag: null, columnId: 'col-tw' }]
      },
      {
        columnId: 'col-do',
        tasks: [{ id: 't2', title: 'Task B', done: false, tag: null, columnId: 'col-do' }]
      },
      {
        columnId: 'col-bl',
        tasks: [{ id: 't3', title: 'Task C', done: false, tag: null, columnId: 'col-bl' }]
      },
      {
        columnId: 'col-dn',
        tasks: [{ id: 't4', title: 'Task D', done: true, tag: null, columnId: 'col-dn' }]
      }
    ]
  }
}

/** Look up a task across every column for assertion convenience. */
function findInBoard(board, id) {
  for (const entry of board.tasksByColumn) {
    const t = entry.tasks.find(t => t.id === id)
    if (t) return { task: t, columnId: entry.columnId }
  }

  return null
}

describe('projects.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty projects array', () => {
      const store = useProjectsStore()
      expect(store.projects).toEqual([])
    })

    it('has null board', () => {
      const store = useProjectsStore()
      expect(store.board).toBeNull()
    })

    it('loadingProjects is false', () => {
      const store = useProjectsStore()
      expect(store.loadingProjects).toBe(false)
    })

    it('loadingBoard is false', () => {
      const store = useProjectsStore()
      expect(store.loadingBoard).toBe(false)
    })

    it('errorProjects is empty string', () => {
      const store = useProjectsStore()
      expect(store.errorProjects).toBe('')
    })

    it('errorBoard is empty string', () => {
      const store = useProjectsStore()
      expect(store.errorBoard).toBe('')
    })
  })

  describe('loadProjects()', () => {
    it('populates projects and toggles loadingProjects', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()

      const promise = store.loadProjects()
      expect(store.loadingProjects).toBe(true)
      await promise

      expect(store.loadingProjects).toBe(false)
      expect(store.projects).toEqual(fakeProjects)
      expect(store.errorProjects).toBe('')
    })

    it('queries with includeArchived: false', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.loadProjects()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { includeArchived: false } })
      )
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.loadProjects()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets errorProjects on failure and resets loadingProjects', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('Network error'))
      const store = useProjectsStore()
      await store.loadProjects()

      expect(store.errorProjects).toBe('Network error')
      expect(store.loadingProjects).toBe(false)
      expect(store.projects).toEqual([])
    })

    it('clears errorProjects on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('first error'))
        .mockResolvedValueOnce({ data: { projects: fakeProjects } })

      const store = useProjectsStore()
      await store.loadProjects()
      expect(store.errorProjects).toBe('first error')
      await store.loadProjects()
      expect(store.errorProjects).toBe('')
    })

    it('does not affect loadingBoard when loading projects', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.loadProjects()
      expect(store.loadingBoard).toBe(false)
    })
  })

  describe('loadBoard()', () => {
    it('populates board and toggles loadingBoard', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()

      const promise = store.loadBoard('p1')
      expect(store.loadingBoard).toBe(true)
      await promise

      expect(store.loadingBoard).toBe(false)
      expect(store.board).toEqual(fakeBoard)
      expect(store.errorBoard).toBe('')
    })

    it('passes the project id as a variable', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      await store.loadBoard('p1')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'p1' } })
      )
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      await store.loadBoard('p1')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets errorBoard on failure and resets loadingBoard', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('Board load failed'))
      const store = useProjectsStore()
      await store.loadBoard('p1')

      expect(store.errorBoard).toBe('Board load failed')
      expect(store.loadingBoard).toBe(false)
      expect(store.board).toBeNull()
    })

    it('clears errorBoard on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('board error'))
        .mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })

      const store = useProjectsStore()
      await store.loadBoard('p1')
      expect(store.errorBoard).toBe('board error')
      await store.loadBoard('p1')
      expect(store.errorBoard).toBe('')
    })

    it('does not affect loadingProjects when loading board', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      await store.loadBoard('p1')
      expect(store.loadingProjects).toBe(false)
    })
  })

  describe('loadProjects and loadBoard are independent (WEB-T05-007)', () => {
    it('concurrent failures do not clobber each error ref independently', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('projects error'))
        .mockRejectedValueOnce(new Error('board error'))

      const store = useProjectsStore()
      await Promise.all([store.loadProjects(), store.loadBoard('p1')])

      expect(store.errorProjects).toBe('projects error')
      expect(store.errorBoard).toBe('board error')
    })

    it('project load completing does not reset board loading flag', async () => {
      let resolveBoard

      apolloClient.query
        .mockResolvedValueOnce({ data: { projects: fakeProjects } })
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolveBoard = resolve
          })
        )

      const store = useProjectsStore()
      await store.loadProjects()
      const boardPromise = store.loadBoard('p1')

      // Board still in flight: loadingBoard should be true, loadingProjects false
      expect(store.loadingProjects).toBe(false)
      expect(store.loadingBoard).toBe(true)

      resolveBoard({ data: { projectBoard: fakeBoard } })
      await boardPromise
    })
  })

  describe('completeTask() (decoupled from columns)', () => {
    it('marks the task done in place without moving columns', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't1' } })
      )

      expect(apolloClient.query).not.toHaveBeenCalled()
      const located = findInBoard(store.board, 't1')
      expect(located?.columnId).toBe('col-tw')
      expect(located?.task.done).toBe(true)
      expect(store.board.project.progress.done).toBe(2)
      expect(store.board.project.progress.percent).toBe(50)
      expect(store.loadingBoard).toBe(false)
    })

    it('marks tasks done in any column without rearranging them', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t3')

      const located = findInBoard(store.board, 't3')
      expect(located?.columnId).toBe('col-bl')
      expect(located?.task.done).toBe(true)
    })

    it('is a no-op when the task is already done (idempotent)', async () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const beforeProgress = { ...store.board.project.progress }

      await store.completeTask('t4')

      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(store.board.project.progress).toEqual(beforeProgress)
    })

    it('is a no-op when the task id is not found', async () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('nope')

      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      store.board = null

      await store.completeTask('t1').catch(() => {})

      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('rolls back state and surfaces error on mutation failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const snapshot = store.board

      await store.completeTask('t1').catch(() => {})

      expect(store.board).toBe(snapshot)
      expect(store.errorBoard).toBe('complete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to complete task')
    })

    it('re-throws the error on mutation failure (WEB-W1-01)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      await expect(store.completeTask('t1')).rejects.toThrow('complete failed')
    })

    it('clears a stale errorBoard before running (WEB-W1-05)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      store.errorBoard = 'stale error'

      await store.completeTask('t1')

      expect(store.errorBoard).toBe('')
    })

    it('toggles saving true → false (WEB-W1-11)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      const promise = store.completeTask('t1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure (WEB-W1-11)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t1').catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('never sets loadingBoard during completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      const promise = store.completeTask('t1')
      expect(store.loadingBoard).toBe(false)
      await promise
      expect(store.loadingBoard).toBe(false)
    })

    it('still completes when project.progress is missing', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      const board = makeOptimisticBoard()
      delete board.project.progress
      store.board = board

      await store.completeTask('t1')

      const located = findInBoard(store.board, 't1')
      expect(located?.task.done).toBe(true)
    })

    it('handles a frozen board (Apollo result) without throwing', async () => {
      // Apollo Client freezes query results in development; the store must
      // never mutate the board in place, only replace it atomically.
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      const board = makeOptimisticBoard()

      // Freeze every level: outer board, project, progress, each column entry.
      for (const entry of board.tasksByColumn) {
        Object.freeze(entry.tasks)
        Object.freeze(entry)
      }

      Object.freeze(board.tasksByColumn)
      Object.freeze(board.columns)
      Object.freeze(board.project.progress)
      Object.freeze(board.project)
      Object.freeze(board)
      store.board = board

      await expect(store.completeTask('t1')).resolves.not.toThrow()

      const located = findInBoard(store.board, 't1')
      expect(located?.task.done).toBe(true)
      expect(store.board.project.progress.done).toBe(2)
    })
  })

  describe('column actions', () => {
    function setBoard(store) {
      store.board = makeOptimisticBoard()
    }

    it('createColumn appends the new column and an empty task bucket', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { createColumn: { id: 'col-new', label: 'Review', order: 4 } }
      })

      const store = useProjectsStore()
      setBoard(store)

      await store.createColumn('p1', 'Review')

      const ids = store.board.columns.map(c => c.id)
      expect(ids).toEqual(['col-tw', 'col-do', 'col-bl', 'col-dn', 'col-new'])
      const entry = store.board.tasksByColumn.find(t => t.columnId === 'col-new')
      expect(entry?.tasks).toEqual([])
    })

    it('renameColumn updates the label optimistically', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { updateColumn: { id: 'col-tw', label: 'Inbox' } }
      })

      const store = useProjectsStore()
      setBoard(store)

      await store.renameColumn('col-tw', 'Inbox')

      const col = store.board.columns.find(c => c.id === 'col-tw')
      expect(col?.label).toBe('Inbox')
    })

    it('renameColumn rolls back on error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('rename failed'))
      const store = useProjectsStore()
      setBoard(store)
      const snapshot = store.board

      await store.renameColumn('col-tw', 'Inbox').catch(() => {})

      expect(store.board).toBe(snapshot)
      expect(store.errorBoard).toBe('rename failed')
    })

    it('reorderColumns rearranges columns and matching task buckets', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      setBoard(store)
      const newOrder = ['col-dn', 'col-bl', 'col-do', 'col-tw']

      await store.reorderColumns('p1', newOrder)

      expect(store.board.columns.map(c => c.id)).toEqual(newOrder)
      expect(store.board.tasksByColumn.map(t => t.columnId)).toEqual(newOrder)
    })

    it('deleteColumn fires a board reload after the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      setBoard(store)

      await store.deleteColumn('col-bl', 'delete', null)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 'col-bl', mode: 'delete', moveToColumnId: null }
        })
      )

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'PROJECT_BOARD_QUERY' })
      )
    })
  })

  describe('drag actions', () => {
    function setBoard(store) {
      store.board = makeOptimisticBoard()
    }

    it('moveTask updates state and fires the moveTask mutation', async () => {
      // moveTask + one reorder for the target column (single task left there).
      apolloClient.mutate.mockResolvedValue({})
      const store = useProjectsStore()
      setBoard(store)

      // Build a "next" tasksByColumn that moves t1 from col-tw to col-do at index 0.
      const next = store.board.tasksByColumn.map(entry => ({
        columnId: entry.columnId,
        tasks: entry.tasks.filter(t => t.id !== 't1')
      }))

      const movedTask = { ...store.board.tasksByColumn[0].tasks[0], columnId: 'col-do' }
      const tgt = next.find(e => e.columnId === 'col-do')
      tgt.tasks = [movedTask, ...tgt.tasks]

      await store.moveTask('t1', 'col-tw', 'col-do', 0, next)

      const moveCall = apolloClient.mutate.mock.calls.find(c => c[0]?.mutation === 'MOVE_TASK')
      expect(moveCall).toBeDefined()
      expect(moveCall[0].variables).toEqual({ id: 't1', columnId: 'col-do', order: 0 })
      const located = findInBoard(store.board, 't1')
      expect(located?.columnId).toBe('col-do')
    })

    it('moveTask rolls back on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('move failed'))
      const store = useProjectsStore()
      setBoard(store)
      const snapshot = store.board
      const next = store.board.tasksByColumn.map(e => ({ ...e, tasks: [...e.tasks] }))

      await store.moveTask('t1', 'col-tw', 'col-do', 0, next).catch(() => {})

      expect(store.board).toBe(snapshot)
      expect(store.errorBoard).toBe('move failed')
    })

    it('reorderTasksInColumn updates state and fires the reorder mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      setBoard(store)
      const next = store.board.tasksByColumn.map(e => ({ ...e, tasks: [...e.tasks] }))

      await store.reorderTasksInColumn('col-tw', ['t1'], next)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: 'REORDER_TASKS_IN_COLUMN',
          variables: { columnId: 'col-tw', taskIds: ['t1'] }
        })
      )
    })
  })

  describe('updateProject error routing (WEB-W1-06)', () => {
    it('routes failure to errorBoard when active board belongs to the project', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }
      await store.updateProject('p1', { name: 'X' }).catch(() => {})
      expect(store.errorBoard).toBe('update failed')
      expect(store.errorProjects).toBe('')
    })

    it('routes failure to errorProjects when no board is loaded', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useProjectsStore()
      store.board = null
      await store.updateProject('p1', { name: 'X' }).catch(() => {})
      expect(store.errorProjects).toBe('update failed')
      expect(store.errorBoard).toBe('')
    })

    it('routes failure to errorProjects when board is for a different project', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useProjectsStore()
      store.board = { project: { id: 'other' } }
      await store.updateProject('p1', { name: 'X' }).catch(() => {})
      expect(store.errorProjects).toBe('update failed')
      expect(store.errorBoard).toBe('')
    })

    it('clears both error refs at the start (WEB-W1-05)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      store.errorBoard = 'stale board'
      store.errorProjects = 'stale projects'
      await store.updateProject('p1', { name: 'X' })
      expect(store.errorBoard).toBe('')
      expect(store.errorProjects).toBe('')
    })
  })

  describe('createTask error routing (WEB-W1-07)', () => {
    it('routes failure to errorBoard when active board matches projectId', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }
      await store.createTask({ title: 't', projectId: 'p1' }).catch(() => {})
      expect(store.errorBoard).toBe('create failed')
      expect(store.errorProjects).toBe('')
    })

    it('routes failure to errorProjects when no board is loaded', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useProjectsStore()
      store.board = null
      await store.createTask({ title: 't', projectId: 'p1' }).catch(() => {})
      expect(store.errorProjects).toBe('create failed')
      expect(store.errorBoard).toBe('')
    })

    it('routes failure to errorProjects when board belongs to another project', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useProjectsStore()
      store.board = { project: { id: 'other' } }
      await store.createTask({ title: 't', projectId: 'p1' }).catch(() => {})
      expect(store.errorProjects).toBe('create failed')
      expect(store.errorBoard).toBe('')
    })
  })

  describe('deleteProject board cleanup (WEB-W1-21)', () => {
    it('clears errorBoard and loadingBoard when deleting the loaded board project', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { projects: [] } })
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }
      store.errorBoard = 'old board error'
      store.loadingBoard = true
      await store.deleteProject('p1')
      expect(store.board).toBeNull()
      expect(store.errorBoard).toBe('')
      expect(store.loadingBoard).toBe(false)
    })
  })

  describe('updateProject reload skip when only board fields change (WEB-W1-19)', () => {
    it('reloads projects when a list-visible field (name) changes', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.updateProject('p1', { name: 'New' })

      // One projects query call expected
      const projectsCalls = apolloClient.query.mock.calls.filter(
        c => c[0]?.query === 'PROJECTS_QUERY'
      )

      expect(projectsCalls.length).toBe(1)
    })

    it('does not reload projects when only board-only fields (nudge) change', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      const store = useProjectsStore()
      await store.updateProject('p1', { nudge: 'be bold' })

      const projectsCalls = apolloClient.query.mock.calls.filter(
        c => c[0]?.query === 'PROJECTS_QUERY'
      )

      expect(projectsCalls.length).toBe(0)
    })

    it('reloads the board when the change applies to the loaded project', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }
      await store.updateProject('p1', { nudge: 'be bold' })

      const boardCalls = apolloClient.query.mock.calls.filter(
        c => c[0]?.query === 'PROJECT_BOARD_QUERY'
      )

      expect(boardCalls.length).toBe(1)
    })
  })

  describe('createProject', () => {
    it('creates and refreshes the projects list', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { createProject: { id: 'p3', title: 'Gamma' } }
      })

      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()

      const result = await store.createProject({ name: 'Gamma', tag: 'work', blurb: 'New' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { name: 'Gamma', tag: 'work', blurb: 'New' }
        })
      )

      expect(result).toEqual({ id: 'p3', title: 'Gamma' })
    })

    it('defaults tag/blurb to null when omitted', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createProject: { id: 'p3' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()

      await store.createProject({ name: 'Gamma' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { name: 'Gamma', tag: null, blurb: null }
        })
      )
    })

    it('sets errorProjects and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useProjectsStore()

      await expect(store.createProject({ name: 'Gamma' })).rejects.toThrow('create failed')
      expect(store.errorProjects).toBe('create failed')
    })
  })

  describe('archiveProject and restoreProject', () => {
    it('archiveProject calls update with archived: true', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.archiveProject('p1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'p1', archived: true } })
      )
    })

    it('restoreProject calls update with archived: false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProject: { id: 'p1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.restoreProject('p1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'p1', archived: false } })
      )
    })
  })

  describe('createTask', () => {
    it('only sends fields that have values', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'tnew' } } })
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }

      await store.createTask({
        title: 'New Task',
        projectId: 'p1',
        note: 'A note',
        tag: 'urgent',
        scheduledDate: '2026-05-22',
        columnId: 'col-tw'
      })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              title: 'New Task',
              projectId: 'p1',
              note: 'A note',
              tag: 'urgent',
              scheduledDate: '2026-05-22',
              columnId: 'col-tw'
            }
          }
        })
      )
    })

    it('omits optional fields when undefined', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'tnew' } } })
      const store = useProjectsStore()

      await store.createTask({ title: 'New', projectId: 'p1' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { input: { title: 'New', projectId: 'p1' } }
        })
      )
    })

    it('reloads the board when the task lands in the active board', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'tnew' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      store.board = { project: { id: 'p1' } }

      await store.createTask({ title: 'New', projectId: 'p1' })

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'PROJECT_BOARD_QUERY' })
      )
    })
  })

  describe('createColumn', () => {
    it('returns null when board is null', async () => {
      const store = useProjectsStore()
      const result = await store.createColumn('p1', 'Review')
      expect(result).toBeNull()
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('rolls back on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create col failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const snapshot = store.board

      await expect(store.createColumn('p1', 'Review')).rejects.toThrow('create col failed')
      expect(store.board).toBe(snapshot)
      expect(store.errorBoard).toBe('create col failed')
    })

    it('toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { createColumn: { id: 'col-new', label: 'Review', order: 4 } }
      })

      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const promise = store.createColumn('p1', 'Review')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })
  })

  describe('renameColumn', () => {
    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      await store.renameColumn('col-tw', 'New')
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('passes UPDATE_COLUMN with id and label', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.renameColumn('col-tw', 'Inbox')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: 'UPDATE_COLUMN',
          variables: { id: 'col-tw', label: 'Inbox' }
        })
      )
    })
  })

  describe('reorderColumns', () => {
    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      await store.reorderColumns('p1', ['a', 'b'])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('rolls back on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('reorder failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const snapshot = store.board

      await expect(
        store.reorderColumns('p1', ['col-dn', 'col-bl', 'col-do', 'col-tw'])
      ).rejects.toThrow('reorder failed')

      expect(store.board).toBe(snapshot)
      expect(store.errorBoard).toBe('reorder failed')
    })
  })

  describe('deleteColumn', () => {
    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      await store.deleteColumn('col-tw', 'delete', null)
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('sets errorBoard on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete col failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.deleteColumn('col-tw', 'delete', null)).rejects.toThrow(
        'delete col failed'
      )

      expect(store.errorBoard).toBe('delete col failed')
    })
  })

  describe('moveTask', () => {
    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      await store.moveTask('t1', 'col-tw', 'col-do', 0, [])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('also calls REORDER_TASKS_IN_COLUMN for source column when cross-column move leaves residue', async () => {
      apolloClient.mutate.mockResolvedValue({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      // Add another task to col-tw so source list isn't empty after move.
      store.board.tasksByColumn[0].tasks.push({
        id: 't5',
        title: 'Stay',
        done: false,
        columnId: 'col-tw'
      })

      const next = store.board.tasksByColumn.map(entry => ({
        columnId: entry.columnId,
        tasks: entry.tasks.filter(t => t.id !== 't1')
      }))

      const movedTask = { ...store.board.tasksByColumn[0].tasks[0], columnId: 'col-do' }
      const tgt = next.find(e => e.columnId === 'col-do')
      tgt.tasks = [movedTask, ...tgt.tasks]

      await store.moveTask('t1', 'col-tw', 'col-do', 0, next)

      const reorderCalls = apolloClient.mutate.mock.calls.filter(
        c => c[0]?.mutation === 'REORDER_TASKS_IN_COLUMN'
      )

      // Source column still has t5 → reorder needed; target column has 2 tasks → reorder needed.
      expect(reorderCalls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('updateTask', () => {
    it('patches a task in place when columnId stays the same', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { updateTask: { id: 't1', title: 'Updated', columnId: 'col-tw' } }
      })

      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      const result = await store.updateTask('t1', { title: 'Updated' })

      expect(result).toEqual({ id: 't1', title: 'Updated', columnId: 'col-tw' })
      const located = findInBoard(store.board, 't1')
      expect(located.task.title).toBe('Updated')
    })

    it('reloads the board when columnId in input differs from response', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { updateTask: { id: 't1', columnId: 'col-do' } }
      })

      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.updateTask('t1', { columnId: 'col-dn' })

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'PROJECT_BOARD_QUERY' })
      )
    })

    it('sets errorBoard and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update task failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.updateTask('t1', { title: 'X' })).rejects.toThrow('update task failed')
      expect(store.errorBoard).toBe('update task failed')
    })

    it('handles a null updateTask response gracefully', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateTask: null } })
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const result = await store.updateTask('t1', { title: 'X' })
      expect(result).toBeNull()
    })
  })

  describe('deleteTask', () => {
    it('calls DELETE_TASK and reloads the board on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.deleteTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ mutation: 'DELETE_TASK', variables: { id: 't1' } })
      )

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'PROJECT_BOARD_QUERY' })
      )
    })

    it('sets errorBoard and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete task failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.deleteTask('t1')).rejects.toThrow('delete task failed')
      expect(store.errorBoard).toBe('delete task failed')
    })
  })

  describe('subtask actions', () => {
    it('addSubtask patches the parent task subtasks', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { addSubtask: { subtasks: [{ id: 's1', text: 'step', done: false }] } }
      })

      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.addSubtask('t1', 'step')

      const located = findInBoard(store.board, 't1')
      expect(located.task.subtasks).toEqual([{ id: 's1', text: 'step', done: false }])
    })

    it('addSubtask sets errorBoard on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('add subtask failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.addSubtask('t1', 'step')).rejects.toThrow('add subtask failed')
      expect(store.errorBoard).toBe('add subtask failed')
    })

    it('updateSubtask patches the parent task subtasks', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { updateSubtask: { subtasks: [{ id: 's1', text: 'step', done: true }] } }
      })

      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.updateSubtask('t1', 's1', { done: true })

      const located = findInBoard(store.board, 't1')
      expect(located.task.subtasks).toEqual([{ id: 's1', text: 'step', done: true }])
    })

    it('updateSubtask sets errorBoard and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update subtask failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.updateSubtask('t1', 's1', { done: true })).rejects.toThrow(
        'update subtask failed'
      )

      expect(store.errorBoard).toBe('update subtask failed')
    })

    it('deleteSubtask patches the parent task subtasks', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { deleteSubtask: { subtasks: [] } }
      })

      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.deleteSubtask('t1', 's1')

      const located = findInBoard(store.board, 't1')
      expect(located.task.subtasks).toEqual([])
    })

    it('deleteSubtask sets errorBoard and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete subtask failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await expect(store.deleteSubtask('t1', 's1')).rejects.toThrow('delete subtask failed')
      expect(store.errorBoard).toBe('delete subtask failed')
    })
  })

  describe('reorderTasksInColumn no-op when board is null', () => {
    it('does not call mutate', async () => {
      const store = useProjectsStore()
      await store.reorderTasksInColumn('col-tw', ['t1'], [])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })
  })

  describe('tasksFor / findTask / buildTasksByColumn helpers', () => {
    it('tasksFor returns empty array when board is null', () => {
      const store = useProjectsStore()
      expect(store.tasksFor('col-tw')).toEqual([])
    })

    it('tasksFor returns the tasks for a given column', () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      expect(store.tasksFor('col-tw')).toHaveLength(1)
    })

    it('tasksFor returns [] for unknown columnId', () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      expect(store.tasksFor('unknown')).toEqual([])
    })

    it('findTask returns null when board is null', () => {
      const store = useProjectsStore()
      expect(store.findTask('t1')).toBeNull()
    })

    it('findTask returns null when no task matches', () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      expect(store.findTask('nope')).toBeNull()
    })

    it('findTask returns the task and column when found', () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const result = store.findTask('t1')
      expect(result.task.id).toBe('t1')
      expect(result.columnId).toBe('col-tw')
    })

    it('buildTasksByColumn groups tasks by column id', () => {
      const store = useProjectsStore()

      const columns = [
        { id: 'a', label: 'A', order: 0 },
        { id: 'b', label: 'B', order: 1 }
      ]

      const tasks = [
        { id: 't1', columnId: 'a' },
        { id: 't2', columnId: 'b' },
        { id: 't3', columnId: 'a' }
      ]

      const result = store.buildTasksByColumn(columns, tasks)

      expect(result).toEqual([
        {
          columnId: 'a',
          tasks: [
            { id: 't1', columnId: 'a' },
            { id: 't3', columnId: 'a' }
          ]
        },
        { columnId: 'b', tasks: [{ id: 't2', columnId: 'b' }] }
      ])
    })

    it('buildTasksByColumn skips tasks with unknown columnId', () => {
      const store = useProjectsStore()
      const columns = [{ id: 'a', label: 'A', order: 0 }]

      const tasks = [
        { id: 't1', columnId: 'a' },
        { id: 't2', columnId: 'gone' }
      ]

      const result = store.buildTasksByColumn(columns, tasks)
      expect(result[0].tasks).toEqual([{ id: 't1', columnId: 'a' }])
    })
  })

  describe('loadProjects with includeArchived: true', () => {
    it('passes includeArchived: true through to the query', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { projects: fakeProjects } })
      const store = useProjectsStore()
      await store.loadProjects({ includeArchived: true })

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { includeArchived: true } })
      )
    })
  })

  describe('deleteProject', () => {
    it('does not touch the board when deleting a different project', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { projects: [] } })
      const store = useProjectsStore()
      const board = { project: { id: 'p2' }, columns: [], tasksByColumn: [] }
      store.board = board

      await store.deleteProject('p1')

      // Board reference is still pointing at the p2 board (id stays).
      expect(store.board?.project?.id).toBe('p2')
    })

    it('sets errorProjects and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete failed'))
      const store = useProjectsStore()

      await expect(store.deleteProject('p1')).rejects.toThrow('delete failed')
      expect(store.errorProjects).toBe('delete failed')
    })
  })
})
