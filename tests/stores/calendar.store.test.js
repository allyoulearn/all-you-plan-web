import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '@/stores/calendar.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  CALENDAR_EVENTS_QUERY: 'CALENDAR_EVENTS_QUERY',
  UPDATE_CALENDAR_EVENT: 'UPDATE_CALENDAR_EVENT',
  CREATE_CALENDAR_EVENT: 'CREATE_CALENDAR_EVENT',
  DELETE_CALENDAR_EVENT: 'DELETE_CALENDAR_EVENT',
  MOVE_TASK_TO_TIME_SLOT: 'MOVE_TASK_TO_TIME_SLOT'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
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

  describe('initial state', () => {
    it('has an empty events array', () => {
      const store = useCalendarStore()
      expect(store.events).toEqual([])
    })

    it('loading is false initially', () => {
      const store = useCalendarStore()
      expect(store.loading).toBe(false)
    })

    it('saving is false initially', () => {
      const store = useCalendarStore()
      expect(store.saving).toBe(false)
    })

    it('error is empty string initially', () => {
      const store = useCalendarStore()
      expect(store.error).toBe('')
    })

    it('lastLoadedMonth is null initially', () => {
      const store = useCalendarStore()
      expect(store.lastLoadedMonth).toBeNull()
    })
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

    it('passes null when no month is provided and none has been loaded', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: [] } })
      const store = useCalendarStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { month: null } })
      )
    })

    it('falls back to lastLoadedMonth when load() is called with no args', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
        .mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })

      const store = useCalendarStore()
      await store.load('2026-05')
      expect(store.lastLoadedMonth).toBe('2026-05')
      await store.load()

      expect(apolloClient.query).toHaveBeenLastCalledWith(
        expect.objectContaining({ variables: { month: '2026-05' } })
      )
    })

    it('passes null when month is explicitly null', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: [] } })
      const store = useCalendarStore()
      await store.load(null)

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { month: null } })
      )
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { calendarEvents: [] } })
      const store = useCalendarStore()
      await store.load('2026-05')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('replaces the events list with the API response', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
        .mockResolvedValueOnce({ data: { calendarEvents: [fakeEvents[0]] } })

      const store = useCalendarStore()
      await store.load('2026-04')
      expect(store.events).toHaveLength(2)
      await store.load('2026-05')
      expect(store.events).toHaveLength(1)
    })

    it('sets error on failure and keeps loading false', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('calendar fetch failed'))
      const store = useCalendarStore()
      await store.load('2026-05')

      expect(store.error).toBe('calendar fetch failed')
      expect(store.loading).toBe(false)
    })

    it('does not modify events on failure', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { calendarEvents: fakeEvents } })
        .mockRejectedValueOnce(new Error('network error'))

      const store = useCalendarStore()
      await store.load('2026-04')
      await store.load('2026-05')
      expect(store.events).toEqual(fakeEvents)
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

  describe('rescheduleEvent()', () => {
    it('updates the event date optimistically and persists via mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      await store.rescheduleEvent('ev1', '2026-06-01')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 'ev1', date: '2026-06-01' }
        })
      )

      const moved = store.events.find(e => e.id === 'ev1')
      expect(moved.date).toBe('2026-06-01')
    })

    it('rolls back on failure and surfaces error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('reschedule failed'))
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      const snapshot = store.events

      await expect(store.rescheduleEvent('ev1', '2026-06-01')).rejects.toThrow('reschedule failed')
      expect(store.events).toBe(snapshot)
      expect(store.error).toBe('reschedule failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to reschedule event')
    })

    it('toggles saving true then false on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      const promise = store.rescheduleEvent('ev1', '2026-06-01')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      await store.rescheduleEvent('ev1', '2026-06-01').catch(() => {})
      expect(store.saving).toBe(false)
    })
  })

  describe('createEvent()', () => {
    it('pushes the created event into the list', async () => {
      const newEvent = { id: 'ev3', date: '2026-07-01', title: 'Concert', accent: true }
      apolloClient.mutate.mockResolvedValueOnce({ data: { createCalendarEvent: newEvent } })
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      const result = await store.createEvent({ title: 'Concert', date: '2026-07-01', accent: true })

      expect(result).toEqual(newEvent)
      expect(store.events).toHaveLength(3)
      expect(store.events[2]).toEqual(newEvent)
    })

    it('defaults accent to false when omitted', async () => {
      const newEvent = { id: 'ev3', date: '2026-07-01', title: 'Concert', accent: false }
      apolloClient.mutate.mockResolvedValueOnce({ data: { createCalendarEvent: newEvent } })
      const store = useCalendarStore()
      await store.createEvent({ title: 'Concert', date: '2026-07-01' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { title: 'Concert', date: '2026-07-01', accent: false }
        })
      )
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useCalendarStore()

      await expect(store.createEvent({ title: 'Concert', date: '2026-07-01' })).rejects.toThrow(
        'create failed'
      )

      expect(store.error).toBe('create failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create event')
    })

    it('toggles saving on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { createCalendarEvent: { id: 'ev3' } }
      })

      const store = useCalendarStore()
      const promise = store.createEvent({ title: 'X', date: '2026-05-22' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useCalendarStore()
      await store.createEvent({ title: 'X', date: '2026-05-22' }).catch(() => {})
      expect(store.saving).toBe(false)
    })
  })

  describe('updateEvent()', () => {
    it('patches title optimistically and calls the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { updateCalendarEvent: { id: 'ev1', title: 'Dentist (rescheduled)' } }
      })

      const store = useCalendarStore()
      store.events = [...fakeEvents]

      const result = await store.updateEvent('ev1', { title: 'Dentist (rescheduled)' })
      expect(result).toEqual({ id: 'ev1', title: 'Dentist (rescheduled)' })

      const updated = store.events.find(e => e.id === 'ev1')
      expect(updated.title).toBe('Dentist (rescheduled)')
    })

    it('patches date and accent when provided', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateCalendarEvent: { id: 'ev1' } } })
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      await store.updateEvent('ev1', { date: '2026-06-15', accent: true })

      const updated = store.events.find(e => e.id === 'ev1')
      expect(updated.date).toBe('2026-06-15')
      expect(updated.accent).toBe(true)
    })

    it('leaves unspecified fields untouched', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateCalendarEvent: { id: 'ev1' } } })
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      await store.updateEvent('ev1', {})

      const updated = store.events.find(e => e.id === 'ev1')
      expect(updated.title).toBe('Dentist')
      expect(updated.date).toBe('2026-05-15')
    })

    it('rolls back on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      const snapshot = store.events

      await expect(store.updateEvent('ev1', { title: 'X' })).rejects.toThrow('update failed')
      expect(store.events).toBe(snapshot)
      expect(store.error).toBe('update failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to update event')
    })

    it('toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateCalendarEvent: { id: 'ev1' } } })
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      const promise = store.updateEvent('ev1', { title: 'X' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })
  })

  describe('deleteEvent()', () => {
    it('removes the event optimistically and persists via mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      store.events = [...fakeEvents]

      await store.deleteEvent('ev1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'ev1' } })
      )

      expect(store.events).toHaveLength(1)
      expect(store.events[0].id).toBe('ev2')
    })

    it('rolls back on failure and surfaces error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete failed'))
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      const snapshot = store.events

      await expect(store.deleteEvent('ev1')).rejects.toThrow('delete failed')
      expect(store.events).toBe(snapshot)
      expect(store.error).toBe('delete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to delete event')
    })

    it('toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      store.events = [...fakeEvents]
      const promise = store.deleteEvent('ev1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })
  })

  describe('moveTaskToTimeSlot()', () => {
    it('calls the MOVE_TASK_TO_TIME_SLOT mutation with all fields', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()

      await store.moveTaskToTimeSlot('t1', '2026-05-22', '09:00', 30)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: 'MOVE_TASK_TO_TIME_SLOT',
          variables: {
            id: 't1',
            scheduledDate: '2026-05-22',
            scheduledTime: '09:00',
            effortMinutes: 30
          }
        })
      )
    })

    it('sets error, toasts and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('move failed'))
      const store = useCalendarStore()

      await expect(store.moveTaskToTimeSlot('t1', '2026-05-22', '09:00', 30)).rejects.toThrow(
        'move failed'
      )

      expect(store.error).toBe('move failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to move task')
    })

    it('toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      const promise = store.moveTaskToTimeSlot('t1', '2026-05-22', '09:00', 30)
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useCalendarStore()
      await store.moveTaskToTimeSlot('t1', '2026-05-22', '09:00', 30).catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('clears stale error before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useCalendarStore()
      store.error = 'old'
      await store.moveTaskToTimeSlot('t1', '2026-05-22', '09:00', 30)
      expect(store.error).toBe('')
    })
  })
})
