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
  COMPLETE_PROJECT_TASK: 'COMPLETE_PROJECT_TASK'
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
    it('calls the mutation and reloads the board', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { projectBoard: fakeBoard } })
      const store = useProjectsStore()
      store.board = fakeBoard
      await store.completeTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't1' } })
      )
      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'p1' } })
      )
    })

    it('does not reload the board when board.project is absent', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = null
      await store.completeTask('t1')

      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('sets errorBoard and shows toast on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = fakeBoard
      await store.completeTask('t1')

      expect(store.errorBoard).toBe('complete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to complete task')
    })

    it('does not reload board when mutation fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = fakeBoard
      await store.completeTask('t1')

      expect(apolloClient.query).not.toHaveBeenCalled()
    })
  })
})
