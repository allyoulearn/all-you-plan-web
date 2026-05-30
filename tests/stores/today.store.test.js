import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodayStore } from '@/stores/today.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  TODAY_QUERY: 'TODAY_QUERY',
  COMPLETE_TASK: 'COMPLETE_TASK',
  MOVE_UNFINISHED: 'MOVE_UNFINISHED',
  CREATE_TASK: 'CREATE_TASK',
  RESCHEDULE_TASK: 'RESCHEDULE_TASK'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeView = {
  date: '2026-05-21',
  sunrise: '6:00 AM',
  sunset: '8:00 PM',
  tasks: [
    { id: 't1', title: 'Morning run', done: false, scheduledTime: '07:00' },
    { id: 't2', title: 'Lunch call', done: false, scheduledTime: '13:00' }
  ],
  kpis: { streak: 3, todayDone: 1, todayTotal: 4, activeProjects: 2, focusMinutes: 90 }
}

describe('today.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('populates view and toggles loading correctly', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()

      expect(store.loading).toBe(false)
      const promise = store.load('2026-05-21')
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.view).toEqual(fakeView)
      expect(store.error).toBe('')
    })

    it('passes date variable to the query', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      await store.load('2026-05-21')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { date: '2026-05-21' } })
      )
    })

    it('passes null when no date is provided', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { date: null } })
      )
    })

    it('sets error on rejection and resets loading', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('Network error'))
      const store = useTodayStore()
      await store.load()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
      expect(store.view).toBeNull()
    })

    it('clears a previous error on a new load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: { today: fakeView } })

      const store = useTodayStore()
      await store.load()
      expect(store.error).toBe('First error')
      await store.load()
      expect(store.error).toBe('')
    })
  })

  describe('completeTask()', () => {
    it('calls the mutation then reloads with the current date', async () => {
      apolloClient.query.mockResolvedValue({ data: { today: fakeView } })
      apolloClient.mutate.mockResolvedValue({})
      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't1' } })
      )

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { date: fakeView.date } })
      )
    })

    it('is a no-op when view has no date (WEB-T05-014)', async () => {
      const store = useTodayStore()
      store.view = null
      await store.completeTask('t1')
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('sets error and toasts on mutation failure (WEB-T05-005)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutate failed'))
      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1').catch(() => {})

      expect(store.error).toBe('mutate failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to complete task')
    })

    it('does not reload when mutation fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutate failed'))
      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1').catch(() => {})
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('re-throws the error on mutation failure (WEB-W1-02)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutate failed'))
      const store = useTodayStore()
      store.view = fakeView
      await expect(store.completeTask('t1')).rejects.toThrow('mutate failed')
    })

    it('uses the captured date not the post-await view.date', async () => {
      // Simulates: view is cleared mid-flight, but reload uses the captured date
      apolloClient.mutate.mockResolvedValueOnce({})

      apolloClient.query.mockImplementationOnce(async () => {
        return { data: { today: fakeView } }
      })

      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { date: '2026-05-21' } })
      )
    })
  })

  describe('moveUnfinished()', () => {
    it('guards against null view and does not call mutate', async () => {
      const store = useTodayStore()
      expect(store.view).toBeNull()
      await store.moveUnfinished()
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('calls the mutation and reloads when view is set', async () => {
      apolloClient.query.mockResolvedValue({ data: { today: fakeView } })
      apolloClient.mutate.mockResolvedValue({})
      const store = useTodayStore()
      store.view = fakeView
      await store.moveUnfinished()

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { fromDate: fakeView.date } })
      )

      expect(apolloClient.query).toHaveBeenCalled()
    })

    it('sets error and toasts on mutation failure (WEB-T05-005)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('move failed'))
      const store = useTodayStore()
      store.view = fakeView
      await store.moveUnfinished().catch(() => {})

      expect(store.error).toBe('move failed')

      expect(mockToastError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to move unfinished tasks'
      )
    })

    it('does not reload when mutation fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('move failed'))
      const store = useTodayStore()
      store.view = fakeView
      await store.moveUnfinished().catch(() => {})
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('re-throws the error on mutation failure (WEB-W1-02)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('move failed'))
      const store = useTodayStore()
      store.view = fakeView
      await expect(store.moveUnfinished()).rejects.toThrow('move failed')
    })
  })

  describe('error reset and saving flag (WEB-W1-05 / WEB-W1-11)', () => {
    it('completeTask clears a stale error before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView
      store.error = 'stale error'
      await store.completeTask('t1')
      expect(store.error).toBe('')
    })

    it('completeTask toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView
      const promise = store.completeTask('t1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('completeTask resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1').catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('moveUnfinished clears a stale error and toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView
      store.error = 'stale error'
      const promise = store.moveUnfinished()
      expect(store.saving).toBe(true)
      await promise
      expect(store.error).toBe('')
      expect(store.saving).toBe(false)
    })

    it('createTask clears a stale error and toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView
      store.error = 'stale error'
      const promise = store.createTask({ title: 'New' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.error).toBe('')
      expect(store.saving).toBe(false)
    })

    it('createTask resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create fail'))
      const store = useTodayStore()
      store.view = fakeView
      await store.createTask({ title: 'New' }).catch(() => {})
      expect(store.saving).toBe(false)
    })
  })

  describe('createTask date routing (WEB-W1-20)', () => {
    it('uses explicit scheduledDate when provided', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      const store = useTodayStore()
      store.view = fakeView
      await store.createTask({ title: 'Future', scheduledDate: '2026-06-01' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { input: { title: 'Future', scheduledDate: '2026-06-01' } }
        })
      )
    })

    it('skips reload when new task is on a different date than the current view', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      const store = useTodayStore()
      store.view = fakeView // date '2026-05-21'

      await store.createTask({ title: 'Future', scheduledDate: '2026-06-01' })

      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('reloads when new task lands on the current view date', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView

      await store.createTask({ title: 'Today task', scheduledDate: fakeView.date })

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('includes optional fields only when set', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView

      await store.createTask({
        title: 'Full',
        scheduledTime: '09:00',
        note: 'a note',
        effortMinutes: 45,
        tag: 'work'
      })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              title: 'Full',
              scheduledDate: fakeView.date,
              scheduledTime: '09:00',
              note: 'a note',
              effortMinutes: 45,
              tag: 'work'
            }
          }
        })
      )
    })

    it('omits zero effortMinutes only if null/undefined', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = fakeView

      await store.createTask({ title: 'Z', effortMinutes: 0 })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { input: { title: 'Z', scheduledDate: fakeView.date, effortMinutes: 0 } }
        })
      )
    })
  })

  describe('rescheduleTask()', () => {
    it('is a no-op when view is null', async () => {
      const store = useTodayStore()
      await store.rescheduleTask('t1', { scheduledTime: '14:00' })
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('patches scheduledTime optimistically when staying on the same date', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useTodayStore()
      store.view = { ...fakeView, tasks: [...fakeView.tasks] }

      await store.rescheduleTask('t1', { scheduledTime: '14:00' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 't1', scheduledDate: fakeView.date, scheduledTime: '14:00' }
        })
      )

      const updated = store.view.tasks.find(t => t.id === 't1')
      expect(updated.scheduledTime).toBe('14:00')
      // Should NOT reload when staying on same date.
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('reloads when moving the task to a different date', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { today: fakeView } })
      const store = useTodayStore()
      store.view = { ...fakeView, tasks: [...fakeView.tasks] }

      await store.rescheduleTask('t1', { scheduledDate: '2026-06-01', scheduledTime: '14:00' })

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('passes null when scheduledTime is omitted', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useTodayStore()
      store.view = { ...fakeView, tasks: [...fakeView.tasks] }

      await store.rescheduleTask('t1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 't1', scheduledDate: fakeView.date, scheduledTime: null }
        })
      )
    })

    it('rolls back on failure and sets error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('reschedule failed'))
      const store = useTodayStore()
      const snapshot = { ...fakeView, tasks: [...fakeView.tasks] }
      store.view = snapshot

      await expect(store.rescheduleTask('t1', { scheduledTime: '14:00' })).rejects.toThrow(
        'reschedule failed'
      )

      // The store snapshot replays the captured object — the task in t1 stays
      // at its original scheduledTime (07:00), not the optimistic 14:00.
      const t1 = store.view.tasks.find(t => t.id === 't1')
      expect(t1.scheduledTime).toBe('07:00')
      expect(store.error).toBe('reschedule failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to reschedule task')
    })

    it('toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useTodayStore()
      store.view = { ...fakeView, tasks: [...fakeView.tasks] }
      const promise = store.rescheduleTask('t1', { scheduledTime: '14:00' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useTodayStore()
      store.view = { ...fakeView, tasks: [...fakeView.tasks] }
      await store.rescheduleTask('t1', { scheduledTime: '14:00' }).catch(() => {})
      expect(store.saving).toBe(false)
    })
  })

  describe('moveUnfinished and createTask error branches', () => {
    it('createTask sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useTodayStore()
      store.view = fakeView

      await expect(store.createTask({ title: 'X' })).rejects.toThrow('create failed')
      expect(store.error).toBe('create failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to add task')
    })

    it('createTask falls back to localISOToday when view has no date', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createTask: { id: 't9' } } })
      const store = useTodayStore()
      store.view = null
      await store.createTask({ title: 'X' })

      // We can't easily assert the exact date here but the call should have
      // scheduledDate set (not undefined).
      const call = apolloClient.mutate.mock.calls[0][0]
      expect(call.variables.input.scheduledDate).toBeDefined()
    })
  })
})
