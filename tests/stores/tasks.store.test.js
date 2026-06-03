import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '@/stores/tasks.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  TASK_WORKSPACE_QUERY: 'TASK_WORKSPACE_QUERY',
  CREATE_WORKSPACE_TASK: 'CREATE_WORKSPACE_TASK',
  UPDATE_WORKSPACE_TASK: 'UPDATE_WORKSPACE_TASK',
  COMPLETE_WORKSPACE_TASK: 'COMPLETE_WORKSPACE_TASK',
  DELETE_WORKSPACE_TASK: 'DELETE_WORKSPACE_TASK'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

/** A spread of tasks across urgencies, categories, dates, done state. */
function due(daysLeft) {
  return { label: `d${daysLeft}`, daysLeft }
}

const fakeTasks = [
  // critical, overdue, admin
  {
    id: 't-a',
    title: 'Reply accountant',
    urgency: 'critical',
    category: 'admin',
    kind: 'deadline',
    dueDate: '2026-05-19',
    due: due(-2),
    done: false,
    project: null
  },
  // critical, today, dev, project-linked
  {
    id: 't-b',
    title: 'Send invoice',
    urgency: 'critical',
    category: 'dev',
    kind: 'deadline',
    dueDate: '2026-05-21',
    due: due(0),
    done: false,
    project: { id: 'site', name: 'Site' }
  },
  // high, +7, admin
  {
    id: 't-c',
    title: 'Car insurance',
    urgency: 'high',
    category: 'admin',
    kind: 'deadline',
    dueDate: '2026-05-28',
    due: due(7),
    done: false,
    project: null
  },
  // high, undated, studio
  {
    id: 't-d',
    title: 'Fix tap',
    urgency: 'high',
    category: 'studio',
    kind: 'once',
    dueDate: null,
    due: null,
    done: false,
    project: null
  },
  // medium, undated, music
  {
    id: 't-e',
    title: 'Restring',
    urgency: 'medium',
    category: 'music',
    kind: 'once',
    dueDate: null,
    due: null,
    done: false,
    project: null
  },
  // low, +40, admin (dated but far future)
  {
    id: 't-f',
    title: 'Renew passport',
    urgency: 'high',
    category: 'admin',
    kind: 'deadline',
    dueDate: '2026-06-30',
    due: due(40),
    done: false,
    project: null
  },
  // done, admin
  {
    id: 't-g',
    title: 'Pay rent',
    urgency: 'high',
    category: 'admin',
    kind: 'deadline',
    dueDate: '2026-05-01',
    due: due(-20),
    done: true,
    project: null
  }
]

const fakeSummary = { total: 6, overdue: 1, dated: 4, critical: 2, high: 3, doneRecently: 1 }

function mockWorkspace(tasks = fakeTasks, summary = fakeSummary) {
  apolloClient.query.mockResolvedValueOnce({ data: { taskWorkspace: { tasks, summary } } })
}

describe('tasks.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('populates tasks + summary and toggles loading', async () => {
      mockWorkspace()
      const store = useTasksStore()

      expect(store.loading).toBe(false)
      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.tasks).toEqual(fakeTasks)
      expect(store.summary).toEqual(fakeSummary)
      expect(store.error).toBe('')
    })

    it('uses network-only and passes includeDone=false by default', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'network-only',
          variables: { includeDone: false }
        })
      )
    })

    it('sets error on failure and keeps loading false', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useTasksStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })

    it('clears a previous error on a fresh load', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('old error'))
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      expect(store.error).toBe('old error')
      await store.load()
      expect(store.error).toBe('')
    })
  })

  describe('visibleTasks getter', () => {
    it('hides done tasks unless showDone is on', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      expect(store.visibleTasks.map(t => t.id)).not.toContain('t-g')
    })

    it('includes done tasks when showDone is on', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      // toggleShowDone reloads (includeDone true) — return the full set.
      mockWorkspace()
      await store.toggleShowDone()
      expect(store.showDone).toBe(true)
      expect(store.visibleTasks.map(t => t.id)).toContain('t-g')
    })

    it('applies the category filter', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      store.setCategoryFilter('admin')
      expect(store.visibleTasks.every(t => t.category === 'admin')).toBe(true)
      // 't-a', 't-c', 't-f' are open admin tasks; 't-g' is done so excluded.
      expect(store.visibleTasks.map(t => t.id).sort()).toEqual(['t-a', 't-c', 't-f'])
    })
  })

  describe('toggleShowDone()', () => {
    it('flips the flag and reloads with includeDone=true', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      mockWorkspace()
      await store.toggleShowDone()

      expect(store.showDone).toBe(true)

      expect(apolloClient.query).toHaveBeenLastCalledWith(
        expect.objectContaining({ variables: { includeDone: true } })
      )
    })
  })

  describe('groups getter — urgency mode', () => {
    it('returns non-empty groups in critical→high→medium→low order', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      // default groupBy is 'urgency'
      expect(store.groups.map(g => g.key)).toEqual(['critical', 'high', 'medium'])
    })

    it('sorts within an urgency group by soonest deadline (undated last)', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      const high = store.groups.find(g => g.key === 'high')
      // high tasks: t-c (+7), t-d (undated), t-f (+40) → +7, +40, undated
      expect(high.tasks.map(t => t.id)).toEqual(['t-c', 't-f', 't-d'])
    })

    it('exposes a count and urgency on each group', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      const critical = store.groups.find(g => g.key === 'critical')
      expect(critical.count).toBe(2)
      expect(critical.urgency).toBe('critical')
    })
  })

  describe('groups getter — category mode', () => {
    it('returns one group per present category, urgency-sorted within', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      store.setGroupBy('category')
      const keys = store.groups.map(g => g.key)
      // present open categories: admin, dev, studio, music
      expect(keys).toEqual(['admin', 'music', 'studio', 'dev'])
      const admin = store.groups.find(g => g.key === 'admin')
      // admin open: t-a (critical), t-c (high +7), t-f (high +40) → critical first
      expect(admin.tasks.map(t => t.id)).toEqual(['t-a', 't-c', 't-f'])
    })
  })

  describe('groups getter — due mode', () => {
    it('splits into dated (soonest first) and undated (by urgency)', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      store.setGroupBy('due')
      const [dated, undated] = store.groups
      expect(dated.key).toBe('dated')
      // dated open: t-a(-2), t-b(0), t-c(+7), t-f(+40)
      expect(dated.tasks.map(t => t.id)).toEqual(['t-a', 't-b', 't-c', 't-f'])
      expect(undated.key).toBe('undated')
      // undated open: t-d (high), t-e (medium) → high first
      expect(undated.tasks.map(t => t.id)).toEqual(['t-d', 't-e'])
    })

    it('drops an empty group', async () => {
      // Only undated tasks → "With a deadline" group should not appear.
      const undatedOnly = [
        {
          id: 'u1',
          title: 'A',
          urgency: 'high',
          category: 'studio',
          kind: 'once',
          dueDate: null,
          due: null,
          done: false,
          project: null
        }
      ]

      apolloClient.query.mockResolvedValueOnce({
        data: { taskWorkspace: { tasks: undatedOnly, summary: fakeSummary } }
      })

      const store = useTasksStore()
      await store.load()
      store.setGroupBy('due')
      expect(store.groups.map(g => g.key)).toEqual(['undated'])
    })
  })

  describe('categoriesPresent getter', () => {
    it('lists open categories with counts, ignoring the active filter', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      store.setCategoryFilter('music')
      const present = store.categoriesPresent
      const admin = present.find(c => c.id === 'admin')
      expect(admin.count).toBe(3)
      // music still present even though filter is music
      expect(present.some(c => c.id === 'music')).toBe(true)
      // done-only categories don't add phantom counts
      expect(present.every(c => c.count > 0)).toBe(true)
    })
  })

  describe('setGroupBy / setCategoryFilter', () => {
    it('updates groupBy without a fetch', async () => {
      mockWorkspace()
      const store = useTasksStore()
      await store.load()
      const callsBefore = apolloClient.query.mock.calls.length
      store.setGroupBy('due')
      expect(store.groupBy).toBe('due')
      expect(apolloClient.query.mock.calls.length).toBe(callsBefore)
    })

    it('updates and clears the category filter', () => {
      const store = useTasksStore()
      store.setCategoryFilter('admin')
      expect(store.categoryFilter).toBe('admin')
      store.setCategoryFilter(null)
      expect(store.categoryFilter).toBe(null)
    })
  })

  describe('createTask()', () => {
    it('sends only provided fields and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'new' } } })
      mockWorkspace()
      const store = useTasksStore()

      const result = await store.createTask({
        title: 'New task',
        urgency: 'high',
        category: 'admin',
        kind: 'deadline',
        dueDate: '2026-06-01'
      })

      expect(result).toEqual({ id: 'new' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              title: 'New task',
              urgency: 'high',
              category: 'admin',
              kind: 'deadline',
              dueDate: '2026-06-01'
            }
          }
        })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('omits empty optional fields from the input', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'new' } } })
      mockWorkspace()
      const store = useTasksStore()
      await store.createTask({ title: 'Bare' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { input: { title: 'Bare' } } })
      )
    })

    it('toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 'x' } } })
      mockWorkspace()
      const store = useTasksStore()
      const promise = store.createTask({ title: 't' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('toasts and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useTasksStore()
      await expect(store.createTask({ title: 't' })).rejects.toThrow('create failed')
      expect(store.error).toBe('create failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create task')
      expect(store.saving).toBe(false)
    })
  })

  describe('completeTask()', () => {
    it('calls the mutation with the id and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      mockWorkspace()
      const store = useTasksStore()
      await store.completeTask('t-a')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't-a' } })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('toasts and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useTasksStore()
      await expect(store.completeTask('t-a')).rejects.toThrow('complete failed')
      expect(store.error).toBe('complete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to update task')
    })
  })

  describe('updateTask()', () => {
    it('passes id + input and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateTask: { id: 't-a' } } })
      mockWorkspace()
      const store = useTasksStore()
      await store.updateTask('t-a', { urgency: 'low' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't-a', input: { urgency: 'low' } } })
      )
    })

    it('toasts and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useTasksStore()
      await expect(store.updateTask('t-a', { urgency: 'low' })).rejects.toThrow('update failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to update task')
    })
  })

  describe('deleteTask()', () => {
    it('calls the mutation and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      mockWorkspace()
      const store = useTasksStore()
      await store.deleteTask('t-a')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't-a' } })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('toasts and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete failed'))
      const store = useTasksStore()
      await expect(store.deleteTask('t-a')).rejects.toThrow('delete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to delete task')
      expect(store.saving).toBe(false)
    })
  })
})
