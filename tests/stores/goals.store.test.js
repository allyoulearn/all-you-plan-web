import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalsStore } from '@/stores/goals.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  GOALS_QUERY: 'GOALS_QUERY',
  CREATE_GOAL: 'CREATE_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  ARCHIVE_GOAL: 'ARCHIVE_GOAL'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeGoals = [
  {
    id: 'g1',
    title: 'Write book',
    status: 'ok',
    progress: 0.3,
    why: 'because',
    targetDate: '2026-12-31',
    linkedProjects: [],
    linkedChores: []
  },
  {
    id: 'g2',
    title: 'Run marathon',
    status: 'risk',
    progress: 0.1,
    why: 'health',
    targetDate: '2026-09-30',
    linkedProjects: [],
    linkedChores: []
  }
]

describe('goals.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts empty', () => {
      const store = useGoalsStore()
      expect(store.goals).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates goals on success', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { goals: fakeGoals } })
      const store = useGoalsStore()
      await store.load()
      expect(store.goals).toEqual(fakeGoals)
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { goals: [] } })
      const store = useGoalsStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useGoalsStore()
      await store.load()
      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('mostActive getter', () => {
    it('is null when there are no goals', () => {
      const store = useGoalsStore()
      expect(store.mostActive).toBeNull()
    })

    it('returns the highest-progress non-done goal', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'ok', progress: 0.3, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'ok', progress: 0.8, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'c', status: 'risk', progress: 0.5, updatedAt: '2026-01-01T00:00:00Z' }
      ]

      expect(store.mostActive.id).toBe('b')
    })

    it('skips done goals even when they have higher progress', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'done', progress: 1, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'ok', progress: 0.4, updatedAt: '2026-01-01T00:00:00Z' }
      ]

      expect(store.mostActive.id).toBe('b')
    })

    it('breaks ties by most-recent update', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'ok', progress: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'ok', progress: 0.5, updatedAt: '2026-05-01T00:00:00Z' }
      ]

      expect(store.mostActive.id).toBe('b')
    })

    it('falls back to the highest-progress goal when every goal is done', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'done', progress: 0.6, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'done', progress: 0.9, updatedAt: '2026-01-01T00:00:00Z' }
      ]

      expect(store.mostActive.id).toBe('b')
    })

    it('does not mutate the underlying goals array order', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'ok', progress: 0.2, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'ok', progress: 0.9, updatedAt: '2026-01-01T00:00:00Z' }
      ]

      void store.mostActive
      expect(store.goals.map(g => g.id)).toEqual(['a', 'b'])
    })
  })

  describe('otherGoals getter', () => {
    it('returns every goal except the featured one', () => {
      const store = useGoalsStore()

      store.goals = [
        { id: 'a', status: 'ok', progress: 0.2, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', status: 'ok', progress: 0.9, updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'c', status: 'risk', progress: 0.5, updatedAt: '2026-01-01T00:00:00Z' }
      ]

      // b is featured (highest progress); a + c remain in server order.
      expect(store.otherGoals.map(g => g.id)).toEqual(['a', 'c'])
    })

    it('is empty when there are no goals', () => {
      const store = useGoalsStore()
      expect(store.otherGoals).toEqual([])
    })
  })

  describe('create()', () => {
    it('appends the new goal on success', async () => {
      const newGoal = {
        id: 'g3',
        title: 'New goal',
        status: 'ok',
        progress: 0,
        why: '',
        targetDate: '2026-06-01',
        linkedProjects: [],
        linkedChores: []
      }

      apolloClient.mutate.mockResolvedValueOnce({ data: { createGoal: newGoal } })
      const store = useGoalsStore()
      store.goals = [...fakeGoals]
      const returned = await store.create({ title: 'New goal' })
      expect(returned).toEqual(newGoal)
      expect(store.goals).toHaveLength(3)
      expect(store.goals[2]).toEqual(newGoal)
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useGoalsStore()
      await expect(store.create({ title: 'x' })).rejects.toThrow('create failed')
    })
  })

  describe('update()', () => {
    it('replaces the matching goal on success', async () => {
      const updated = { ...fakeGoals[0], title: 'Updated' }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateGoal: updated } })
      const store = useGoalsStore()
      store.goals = [...fakeGoals]
      const result = await store.update('g1', { title: 'Updated' })
      expect(result).toEqual(updated)
      expect(store.goals[0]).toEqual(updated)
      expect(store.goals[1]).toEqual(fakeGoals[1])
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useGoalsStore()
      await expect(store.update('g1', { title: 'x' })).rejects.toThrow('update failed')
    })
  })

  describe('archive()', () => {
    it('removes the matching goal on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useGoalsStore()
      store.goals = [...fakeGoals]
      await store.archive('g1')
      expect(store.goals).toHaveLength(1)
      expect(store.goals[0].id).toBe('g2')
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('archive failed'))
      const store = useGoalsStore()
      await expect(store.archive('g1')).rejects.toThrow('archive failed')
    })
  })
})
