import { describe, it, expect } from 'vitest'
import {
  isSnoozedNow,
  isDueOn,
  groupChoresForView,
  buildRecentStrip,
  cadenceLabel
} from '@/utils/chores.js'

const baseChore = {
  id: 'c1',
  title: 'Stretch',
  cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: null },
  streak: 0,
  bestStreak: 0,
  lastCompletedOn: null,
  active: true,
  snoozedUntil: null,
  skipNextDate: null,
  recentCompletions: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  order: 0
}

describe('isSnoozedNow', () => {
  it('returns false when snoozedUntil is null', () => {
    expect(isSnoozedNow(baseChore)).toBe(false)
  })

  it('returns true when snoozedUntil is in the future', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isSnoozedNow({ ...baseChore, snoozedUntil: future })).toBe(true)
  })

  it('returns false when snoozedUntil is in the past', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    expect(isSnoozedNow({ ...baseChore, snoozedUntil: past })).toBe(false)
  })
})

describe('isDueOn — daily', () => {
  it('interval=1 is due every day from createdAt', () => {
    const chore = { ...baseChore }
    expect(isDueOn(chore, new Date('2026-05-01T12:00:00Z'))).toBe(true)
    expect(isDueOn(chore, new Date('2026-05-15T12:00:00Z'))).toBe(true)
  })

  it('interval=3 is due on offset 0, 3, 6 …', () => {
    const chore = { ...baseChore, cadence: { ...baseChore.cadence, interval: 3 } }
    expect(isDueOn(chore, new Date('2026-05-01T00:00:00Z'))).toBe(true)
    expect(isDueOn(chore, new Date('2026-05-02T00:00:00Z'))).toBe(false)
    expect(isDueOn(chore, new Date('2026-05-04T00:00:00Z'))).toBe(true)
  })

  it('not due before createdAt', () => {
    expect(isDueOn(baseChore, new Date('2026-04-25T00:00:00Z'))).toBe(false)
  })

  it('defaults missing interval to 1', () => {
    const chore = { ...baseChore, cadence: { type: 'daily', daysOfWeek: [], interval: null } }
    expect(isDueOn(chore, new Date('2026-05-02T00:00:00Z'))).toBe(true)
  })
})

describe('isDueOn — weekly', () => {
  it('due only on configured weekdays (UTC)', () => {
    const chore = { ...baseChore, cadence: { type: 'weekly', daysOfWeek: [1, 3], interval: 1 } }
    expect(isDueOn(chore, new Date('2026-05-18T12:00:00Z'))).toBe(true) // Mon
    expect(isDueOn(chore, new Date('2026-05-20T12:00:00Z'))).toBe(true) // Wed
    expect(isDueOn(chore, new Date('2026-05-19T12:00:00Z'))).toBe(false) // Tue
  })

  it('empty daysOfWeek is never due', () => {
    const chore = { ...baseChore, cadence: { type: 'weekly', daysOfWeek: [], interval: 1 } }
    expect(isDueOn(chore, new Date('2026-05-18T12:00:00Z'))).toBe(false)
  })
})

describe('isDueOn — monthly', () => {
  it('due only on configured dayOfMonth', () => {
    const chore = {
      ...baseChore,
      cadence: { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: 15 }
    }

    expect(isDueOn(chore, new Date('2026-05-15T12:00:00Z'))).toBe(true)
    expect(isDueOn(chore, new Date('2026-05-16T12:00:00Z'))).toBe(false)
  })

  it('null dayOfMonth is never due', () => {
    const chore = {
      ...baseChore,
      cadence: { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: null }
    }

    expect(isDueOn(chore, new Date('2026-05-15T12:00:00Z'))).toBe(false)
  })
})

describe('groupChoresForView', () => {
  const today = new Date('2026-05-18T12:00:00Z') // Monday

  it('puts due-today chores in due, others in upcoming', () => {
    const chores = [
      { ...baseChore, id: 'a' },
      { ...baseChore, id: 'b', cadence: { type: 'weekly', daysOfWeek: [3], interval: 1 } }
    ]

    const { due, upcoming } = groupChoresForView(chores, today)
    expect(due.map(c => c.id)).toEqual(['a'])
    expect(upcoming.map(c => c.id)).toEqual(['b'])
  })

  it('snoozed chores never appear in due, always in upcoming', () => {
    const future = new Date(today.getTime() + 7 * 86_400_000).toISOString()
    const chores = [{ ...baseChore, id: 'a', snoozedUntil: future }]
    const { due, upcoming } = groupChoresForView(chores, today)
    expect(due).toEqual([])
    expect(upcoming.map(c => c.id)).toEqual(['a'])
  })

  it('skipNextDate matching today excludes the chore from due', () => {
    const chores = [{ ...baseChore, id: 'a', skipNextDate: '2026-05-18' }]
    const { due, upcoming } = groupChoresForView(chores, today)
    expect(due).toEqual([])
    expect(upcoming.map(c => c.id)).toEqual(['a'])
  })
})

describe('buildRecentStrip', () => {
  const today = new Date('2026-05-18T12:00:00Z') // Monday

  it('returns 7 entries (oldest first)', () => {
    const strip = buildRecentStrip(baseChore, today)
    expect(strip).toHaveLength(7)
  })

  it('marks done dates as done, missed-due as missed, others as not-due', () => {
    const chore = {
      ...baseChore,
      cadence: { type: 'daily', daysOfWeek: [], interval: 1 },
      recentCompletions: ['2026-05-15', '2026-05-18']
    }

    const strip = buildRecentStrip(chore, today)

    // Days are 2026-05-12 (Tue) … 2026-05-18 (Mon). All due (interval=1).
    expect(strip.map(d => d.state)).toEqual([
      'missed',
      'missed',
      'missed',
      'done',
      'missed',
      'missed',
      'done'
    ])
  })

  it('non-due days are not-due', () => {
    const chore = {
      ...baseChore,
      cadence: { type: 'weekly', daysOfWeek: [1], interval: 1 }, // Mon only
      recentCompletions: ['2026-05-18']
    }

    const strip = buildRecentStrip(chore, today)
    expect(strip[6].state).toBe('done')
    expect(strip.slice(0, 6).every(d => d.state === 'not-due')).toBe(true)
  })
})

describe('cadenceLabel', () => {
  const t = (key, params) => {
    const map = {
      'chores.cadenceDaily': 'Daily',
      'chores.cadenceWeekly': 'Weekly',
      'chores.cadenceMonthly': 'Monthly',
      'chores.cadenceEveryNDays': `Every ${params?.n} days`,
      'chores.cadenceDayOfMonth': `Day ${params?.day}`,
      'chores.dayShortSun': 'Su',
      'chores.dayShortMon': 'Mo',
      'chores.dayShortTue': 'Tu',
      'chores.dayShortWed': 'We',
      'chores.dayShortThu': 'Th',
      'chores.dayShortFri': 'Fr',
      'chores.dayShortSat': 'Sa'
    }

    return map[key] ?? key
  }

  it('returns "Daily" for daily interval=1', () => {
    expect(cadenceLabel({ type: 'daily', interval: 1 }, t)).toBe('Daily')
  })

  it('returns "Every N days" for daily interval>1', () => {
    expect(cadenceLabel({ type: 'daily', interval: 3 }, t)).toBe('Every 3 days')
  })

  it('returns dot-separated short days for weekly', () => {
    expect(cadenceLabel({ type: 'weekly', daysOfWeek: [1, 3, 5] }, t)).toBe('Mo · We · Fr')
  })

  it('returns "Day N" for monthly', () => {
    expect(cadenceLabel({ type: 'monthly', dayOfMonth: 15 }, t)).toBe('Day 15')
  })

  it('falls back to raw type for unknown cadence', () => {
    expect(cadenceLabel({ type: 'custom' }, t)).toBe('custom')
  })
})
