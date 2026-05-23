/** Mock fixtures for the Chores screen. */

const chores = [
  {
    id: 'c1',
    title: 'Morning workout',
    cadence: {
      type: 'weekly',
      daysOfWeek: [1, 3, 5],
      interval: null,
      dayOfMonth: null
    },
    streak: 4,
    bestStreak: 12,
    lastCompletedOn: '2026-05-20',
    active: true,
    order: 0
  },
  {
    id: 'c2',
    title: 'Meditate',
    cadence: {
      type: 'daily',
      daysOfWeek: null,
      interval: null,
      dayOfMonth: null
    },
    streak: 6,
    bestStreak: 21,
    lastCompletedOn: '2026-05-21',
    active: true,
    order: 1
  },
  {
    id: 'c3',
    title: 'Journaling',
    cadence: {
      type: 'daily',
      daysOfWeek: null,
      interval: null,
      dayOfMonth: null
    },
    streak: 3,
    bestStreak: 9,
    lastCompletedOn: '2026-05-21',
    active: true,
    order: 2
  },
  {
    id: 'c4',
    title: 'Review inbox',
    cadence: {
      type: 'weekly',
      daysOfWeek: [1, 5],
      interval: null,
      dayOfMonth: null
    },
    streak: 2,
    bestStreak: 6,
    lastCompletedOn: '2026-05-18',
    active: true,
    order: 3
  },
  {
    id: 'c5',
    title: 'Monthly budget review',
    cadence: {
      type: 'monthly',
      daysOfWeek: null,
      interval: null,
      dayOfMonth: 1
    },
    streak: 1,
    bestStreak: 4,
    lastCompletedOn: '2026-05-01',
    active: true,
    order: 4
  }
]

export const registry = {
  chores: () => ({ chores }),
  completeChore: variables => {
    // Reflect the actual day the mock action ran so the UI sees a sensible
    // value across shifted mock dates (WEB-W2-27).
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return {
      completeChore: {
        id: variables.id,
        streak: 7,
        bestStreak: 21,
        lastCompletedOn: `${yyyy}-${mm}-${dd}`
      }
    }
  }
}
