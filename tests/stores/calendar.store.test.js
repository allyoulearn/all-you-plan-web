import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '@/stores/calendar.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  CALENDAR_EVENTS_QUERY: 'CALENDAR_EVENTS_QUERY'
}))

import { apolloClient } from '@/api/apollo'

const fakeEvents = [
  { id: 'ev1', date: '2026-05-15', title: 'Dentist', accent: false },
  { id: 'ev2', date: '2026-05-21', title: 'Birthday', accent: true }
]

describe('calendar.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('populates events and resets loading/error', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
      const store = useCalendarStore()

      expect(store.loading).toBe(false)
      const promise = store.load('2026-05')
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.events).toEqual(fakeEvents)
      expect(store.error).toBe('')
    })

    it('passes the month variable to the query', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
      const store = useCalendarStore()
      await store.load('2026-05')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { month: '2026-05' } })
      )
    })

    it('passes null when no month is provided', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: [] } })
      const store = useCalendarStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { month: null } })
      )
    })

    it('sets error on failure and keeps loading false', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('calendar fetch failed'))
      const store = useCalendarStore()
      await store.load('2026-05')

      expect(store.error).toBe('calendar fetch failed')
      expect(store.loading).toBe(false)
    })

    it('clears a previous error on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('old error'))
        .mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
      const store = useCalendarStore()
      await store.load('2026-04')
      expect(store.error).toBe('old error')
      await store.load('2026-05')
      expect(store.error).toBe('')
    })
  })
})
