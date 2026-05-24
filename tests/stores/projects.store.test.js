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
  CREATE_TASK: 'CREATE_TASK'
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
    { id: 'col1', title: 'To Do', tasks: [{ id: 't1', title: 'Task A', done: false }] },
    { id: 'col2', title: 'Done', tasks: [] }
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
    thisWeek: [{ id: 't1', title: 'Task A', done: false, tag: null }],
    doing: [{ id: 't2', title: 'Task B', done: false, tag: null }],
    backlog: [{ id: 't3', title: 'Task C', done: false, tag: null }],
    done: [{ id: 't4', title: 'Task D', done: true, tag: null }]
  }
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

  describe('completeTask()', () => {
    it('moves the task to done locally without calling loadBoard (no reload flash)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't1' } })
      )
      expect(apolloClient.query).not.toHaveBeenCalled()
      expect(store.board.thisWeek.find(t => t.id === 't1')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't1', done: true })
      expect(store.board.project.progress.done).toBe(2)
      expect(store.board.project.progress.percent).toBe(50)
      expect(store.loadingBoard).toBe(false)
    })

    it('moves a task from doing to done', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t2')

      expect(store.board.doing.find(t => t.id === 't2')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't2', done: true })
    })

    it('moves a task from backlog to done', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t3')

      expect(store.board.backlog.find(t => t.id === 't3')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't3', done: true })
    })

    it('is a no-op when the task is already done (idempotent)', async () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const beforeDone = [...store.board.done]

      await store.completeTask('t4')

      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(store.board.done).toEqual(beforeDone)
      expect(store.board.project.progress.done).toBe(1)
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
      const originalThisWeek = [...store.board.thisWeek]
      const originalDone = [...store.board.done]
      const originalProgress = { ...store.board.project.progress }

      await store.completeTask('t1').catch(() => {})

      expect(store.board.thisWeek).toEqual(originalThisWeek)
      expect(store.board.done).toEqual(originalDone)
      expect(store.board.project.progress).toEqual(originalProgress)
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
  })
})
