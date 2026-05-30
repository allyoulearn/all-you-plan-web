import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatsStore } from '@/stores/stats.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn()
  }
}))

vi.mock('@/api/operations/index.js', () => ({
  STATS_QUERY: 'STATS_QUERY'
}))

import { apolloClient } from '@/api/apollo'

const fakeStats = {
  streakDays: 7,
  tasksCompletedThisWeek: 14,
  tasksCompletedTotal: 120,
  reviewsThisMonth: 3,
  heatmap: [
    { week: 0, day: 0, count: 2 },
    { week: 0, day: 1, count: 0 }
  ]
}

describe('stats.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('stats is null', () => {
      const store = useStatsStore()
      expect(store.stats).toBeNull()
    })

    it('loading is false', () => {
      const store = useStatsStore()
      expect(store.loading).toBe(false)
    })

    it('error is empty string', () => {
      const store = useStatsStore()
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates stats and toggles loading', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { stats: fakeStats } })
      const store = useStatsStore()

      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.stats).toEqual(fakeStats)
      expect(store.error).toBe('')
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { stats: fakeStats } })
      const store = useStatsStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('passes the STATS_QUERY operation', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { stats: fakeStats } })
      const store = useStatsStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'STATS_QUERY' })
      )
    })

    it('sets error on failure and resets loading', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('stats load failed'))
      const store = useStatsStore()
      await store.load()

      expect(store.error).toBe('stats load failed')
      expect(store.loading).toBe(false)
      expect(store.stats).toBeNull()
    })

    it('clears error on a fresh successful load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('first error'))
        .mockResolvedValueOnce({ data: { stats: fakeStats } })

      const store = useStatsStore()
      await store.load()
      expect(store.error).toBe('first error')
      await store.load()
      expect(store.error).toBe('')
    })

    it('replaces stats with the new API response', async () => {
      const updatedStats = { ...fakeStats, streakDays: 10 }

      apolloClient.query
        .mockResolvedValueOnce({ data: { stats: fakeStats } })
        .mockResolvedValueOnce({ data: { stats: updatedStats } })

      const store = useStatsStore()
      await store.load()
      expect(store.stats.streakDays).toBe(7)
      await store.load()
      expect(store.stats.streakDays).toBe(10)
    })

    it('can load null stats (no data yet)', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { stats: null } })
      const store = useStatsStore()
      await store.load()
      expect(store.stats).toBeNull()
      expect(store.error).toBe('')
    })
  })
})
