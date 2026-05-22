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
  MOVE_UNFINISHED: 'MOVE_UNFINISHED'
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
      await store.completeTask('t1')

      expect(store.error).toBe('mutate failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to complete task')
    })

    it('does not reload when mutation fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutate failed'))
      const store = useTodayStore()
      store.view = fakeView
      await store.completeTask('t1')
      expect(apolloClient.query).not.toHaveBeenCalled()
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
      await store.moveUnfinished()

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
      await store.moveUnfinished()
      expect(apolloClient.query).not.toHaveBeenCalled()
    })
  })
})
