import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toLocalISODate,
  monthKey,
  localISOToday,
  formatChatDate,
  groupMessagesByDay
} from '@/utils/date'

describe('toLocalISODate', () => {
  it('formats a date as YYYY-MM-DD using local time', () => {
    expect(toLocalISODate(new Date(2026, 4, 22))).toBe('2026-05-22')
  })

  it('zero-pads single-digit months and days', () => {
    expect(toLocalISODate(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('handles year boundaries cleanly', () => {
    expect(toLocalISODate(new Date(2025, 11, 31))).toBe('2025-12-31')
    expect(toLocalISODate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })

  it('returns local-time date even for a late-evening Date that would roll over in UTC', () => {
    const late = new Date(2026, 4, 22, 23, 59)
    expect(toLocalISODate(late)).toBe('2026-05-22')
  })
})

describe('monthKey', () => {
  it('returns the YYYY-MM key for a given year and 0-indexed month', () => {
    expect(monthKey(2026, 4)).toBe('2026-05')
  })

  it('zero-pads single-digit months', () => {
    expect(monthKey(2026, 0)).toBe('2026-01')
    expect(monthKey(2026, 8)).toBe('2026-09')
  })

  it('renders December correctly', () => {
    expect(monthKey(2026, 11)).toBe('2026-12')
  })
})

describe('localISOToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the current local-time date as YYYY-MM-DD', () => {
    vi.setSystemTime(new Date(2026, 4, 22, 9, 30))
    expect(localISOToday()).toBe('2026-05-22')
  })

  it('zero-pads single-digit months and days', () => {
    vi.setSystemTime(new Date(2026, 0, 3, 9, 30))
    expect(localISOToday()).toBe('2026-01-03')
  })
})

describe('formatChatDate', () => {
  const now = new Date(2026, 4, 27, 10, 0) // 2026-05-27 (Wednesday)

  it('returns "Today" for a date on the same local day as now', () => {
    expect(formatChatDate(new Date(2026, 4, 27, 6, 0), now)).toBe('Today')
  })

  it('returns "Yesterday" for the day before now', () => {
    expect(formatChatDate(new Date(2026, 4, 26, 23, 0), now)).toBe('Yesterday')
  })

  it('returns a weekday name for dates 2–6 days back', () => {
    // 2026-05-25 was a Monday in this calendar; 2 days before 2026-05-27.
    const label = formatChatDate(new Date(2026, 4, 25, 12, 0), now)
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    expect(weekdays).toContain(label)
  })

  it('returns a short month + day label for dates 7+ days back', () => {
    const label = formatChatDate(new Date(2026, 4, 15, 12, 0), now)
    expect(label).toMatch(/May/)
    expect(label).toMatch(/15/)
  })

  it('returns an empty string for invalid input', () => {
    expect(formatChatDate('not-a-date', now)).toBe('')
    expect(formatChatDate(null, now)).toBe('')
  })
})

describe('groupMessagesByDay', () => {
  const now = new Date(2026, 4, 27, 10, 0)

  it('returns an empty array for empty or non-array input', () => {
    expect(groupMessagesByDay([])).toEqual([])
    expect(groupMessagesByDay(null)).toEqual([])
    expect(groupMessagesByDay(undefined)).toEqual([])
  })

  it('buckets messages into one group per local day', () => {
    const messages = [
      { id: 'a', createdAt: new Date(2026, 4, 25, 18, 0).toISOString() },
      { id: 'b', createdAt: new Date(2026, 4, 26, 9, 0).toISOString() },
      { id: 'c', createdAt: new Date(2026, 4, 26, 14, 0).toISOString() },
      { id: 'd', createdAt: new Date(2026, 4, 27, 8, 0).toISOString() }
    ]

    const groups = groupMessagesByDay(messages, now)
    expect(groups).toHaveLength(3)
    expect(groups.map(g => g.messages.length)).toEqual([1, 2, 1])
  })

  it('preserves group order matching the input message order', () => {
    const messages = [
      { id: 'a', createdAt: new Date(2026, 4, 25, 18, 0).toISOString() },
      { id: 'b', createdAt: new Date(2026, 4, 27, 8, 0).toISOString() }
    ]

    const groups = groupMessagesByDay(messages, now)
    expect(groups[0].messages[0].id).toBe('a')
    expect(groups[1].messages[0].id).toBe('b')
  })

  it('renders a chat-style label per group', () => {
    const messages = [
      { id: 'a', createdAt: new Date(2026, 4, 26, 18, 0).toISOString() },
      { id: 'b', createdAt: new Date(2026, 4, 27, 8, 0).toISOString() }
    ]

    const groups = groupMessagesByDay(messages, now)
    expect(groups[0].label).toBe('Yesterday')
    expect(groups[1].label).toBe('Today')
  })

  it('lumps messages with null/missing createdAt into the current group', () => {
    const messages = [
      { id: 'a', createdAt: new Date(2026, 4, 27, 8, 0).toISOString() },
      { id: 'b', createdAt: null },
      { id: 'c' }
    ]

    const groups = groupMessagesByDay(messages, now)
    expect(groups).toHaveLength(1)
    expect(groups[0].messages).toHaveLength(3)
  })
})
