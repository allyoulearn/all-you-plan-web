import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReviewStore } from '@/stores/review.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations/index.js', () => ({
  DAILY_REVIEW_QUERY: 'DAILY_REVIEW_QUERY',
  SAVE_DAILY_REVIEW: 'SAVE_DAILY_REVIEW'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeReview = {
  id: 'r1',
  date: '2026-05-22',
  mood: '4',
  responses: [
    { question: 'What moved forward?', answer: 'Finished the PR.' },
    { question: "What didn't finish?", answer: 'Code review pending.' }
  ]
}

describe('review.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('review is null', () => {
      const store = useReviewStore()
      expect(store.review).toBeNull()
    })

    it('loading is false', () => {
      const store = useReviewStore()
      expect(store.loading).toBe(false)
    })

    it('saving is false', () => {
      const store = useReviewStore()
      expect(store.saving).toBe(false)
    })

    it('error is empty string', () => {
      const store = useReviewStore()
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates review and toggles loading', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { dailyReview: fakeReview } })
      const store = useReviewStore()

      const promise = store.load('2026-05-22')
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.review).toEqual(fakeReview)
      expect(store.error).toBe('')
    })

    it('passes the date variable to the query', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { dailyReview: fakeReview } })
      const store = useReviewStore()
      await store.load('2026-05-22')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { date: '2026-05-22' } })
      )
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { dailyReview: fakeReview } })
      const store = useReviewStore()
      await store.load('2026-05-22')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure and resets loading', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useReviewStore()
      await store.load('2026-05-22')

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
      expect(store.review).toBeNull()
    })

    it('clears error on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('first error'))
        .mockResolvedValueOnce({ data: { dailyReview: fakeReview } })

      const store = useReviewStore()
      await store.load('2026-05-22')
      expect(store.error).toBe('first error')
      await store.load('2026-05-22')
      expect(store.error).toBe('')
    })

    it('load can return null review (no review for the date)', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { dailyReview: null } })
      const store = useReviewStore()
      await store.load('2026-05-22')
      expect(store.review).toBeNull()
      expect(store.error).toBe('')
    })
  })

  describe('save()', () => {
    it('persists the review and toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { saveDailyReview: fakeReview } })
      const store = useReviewStore()

      const promise = store.save('2026-05-22', '4', fakeReview.responses)
      expect(store.saving).toBe(true)
      await promise

      expect(store.saving).toBe(false)
      expect(store.review).toEqual(fakeReview)
      expect(store.error).toBe('')
    })

    it('passes date, mood, and responses as variables', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { saveDailyReview: fakeReview } })
      const store = useReviewStore()
      await store.save('2026-05-22', '4', fakeReview.responses)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { date: '2026-05-22', mood: '4', responses: fakeReview.responses }
        })
      )
    })

    it('updates review with the returned value', async () => {
      const updatedReview = { ...fakeReview, mood: '5' }
      apolloClient.mutate.mockResolvedValueOnce({ data: { saveDailyReview: updatedReview } })
      const store = useReviewStore()
      await store.save('2026-05-22', '5', fakeReview.responses)

      expect(store.review).toEqual(updatedReview)
    })

    it('sets error, toasts, and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useReviewStore()

      await expect(store.save('2026-05-22', '3', [])).rejects.toThrow('save failed')
      expect(store.error).toBe('save failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to save review')
    })

    it('resets saving to false after failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useReviewStore()
      await store.save('2026-05-22', '3', []).catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('clears a previous error before saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { saveDailyReview: fakeReview } })
      const store = useReviewStore()
      store.error = 'stale error'
      await store.save('2026-05-22', '4', [])
      expect(store.error).toBe('')
    })
  })

  describe('diffLeftovers()', () => {
    it('returns an empty diff when previous and next are identical', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a'], picked: [], dropped: ['b'], kept: [] }
      const next = { tomorrow: ['a'], picked: [], dropped: ['b'], kept: [] }
      expect(store.diffLeftovers(prev, next)).toEqual({
        tomorrow: [],
        picked: [],
        dropped: []
      })
    })

    it('returns only newly-added ids for each kind', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a'], picked: [], dropped: [], kept: [] }
      const next = {
        tomorrow: ['a', 'b'],
        picked: [{ id: 'c', date: '2026-06-01' }],
        dropped: ['d'],
        kept: []
      }
      expect(store.diffLeftovers(prev, next)).toEqual({
        tomorrow: ['b'],
        picked: [{ id: 'c', date: '2026-06-01' }],
        dropped: ['d']
      })
    })

    it('treats a missing previous payload as an empty baseline', () => {
      const store = useReviewStore()
      const next = { tomorrow: ['a'], picked: [], dropped: [], kept: [] }
      expect(store.diffLeftovers(null, next).tomorrow).toEqual(['a'])
    })

    it('does not return tasks that were already in the previous tomorrow set', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a', 'b'], picked: [], dropped: [], kept: [] }
      const next = { tomorrow: ['a', 'b', 'c'], picked: [], dropped: [], kept: [] }
      expect(store.diffLeftovers(prev, next).tomorrow).toEqual(['c'])
    })
  })
})
