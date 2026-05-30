/** Mock fixtures for the Chores screen. */

const todayUtc = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const daysAgo = n => {
  const d = todayUtc()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

let chores = [
  {
    id: 'c1',
    title: 'Morning workout',
    cadence: {
      type: 'weekly',
      daysOfWeek: [1, 3, 5],
      interval: 1,
      dayOfMonth: null
    },
    streak: 4,
    bestStreak: 12,
    lastCompletedOn: daysAgo(2),
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 0,
    recentCompletions: [daysAgo(7), daysAgo(5), daysAgo(2)],
    createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'c2',
    title: 'Meditate',
    cadence: {
      type: 'daily',
      daysOfWeek: [],
      interval: 1,
      dayOfMonth: null
    },
    streak: 6,
    bestStreak: 21,
    lastCompletedOn: daysAgo(0),
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 1,
    recentCompletions: [daysAgo(6), daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(1), daysAgo(0)],
    createdAt: new Date('2026-04-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'c3',
    title: 'Journaling',
    cadence: {
      type: 'daily',
      daysOfWeek: [],
      interval: 1,
      dayOfMonth: null
    },
    streak: 3,
    bestStreak: 9,
    lastCompletedOn: daysAgo(1),
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 2,
    recentCompletions: [daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(1)],
    createdAt: new Date('2026-04-10T00:00:00.000Z').toISOString()
  },
  {
    id: 'c4',
    title: 'Review inbox',
    cadence: {
      type: 'weekly',
      daysOfWeek: [1, 5],
      interval: 1,
      dayOfMonth: null
    },
    streak: 2,
    bestStreak: 6,
    lastCompletedOn: daysAgo(3),
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 3,
    recentCompletions: [daysAgo(10), daysAgo(3)],
    createdAt: new Date('2026-03-15T00:00:00.000Z').toISOString()
  },
  {
    id: 'c5',
    title: 'Monthly budget review',
    cadence: {
      type: 'monthly',
      daysOfWeek: [],
      interval: 1,
      dayOfMonth: 1
    },
    streak: 1,
    bestStreak: 4,
    lastCompletedOn: daysAgo(20),
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 4,
    recentCompletions: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'c6',
    title: 'Renew passport',
    cadence: {
      type: 'once',
      daysOfWeek: [],
      interval: 1,
      dayOfMonth: null,
      // Due two days from "now" so this chore lands in the Upcoming
      // section by default and demonstrates the one-off render.
      dueDate: daysAgo(-2)
    },
    streak: 0,
    bestStreak: 0,
    lastCompletedOn: null,
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 5,
    recentCompletions: [],
    createdAt: new Date('2026-05-25T00:00:00.000Z').toISOString()
  },
  {
    id: 'c7',
    title: 'Call dentist',
    cadence: {
      type: 'once',
      daysOfWeek: [],
      interval: 1,
      dayOfMonth: null,
      // Past-due one-off so the row shows "X DAYS LATE" and stays in Due.
      dueDate: daysAgo(3)
    },
    streak: 0,
    bestStreak: 0,
    lastCompletedOn: null,
    active: true,
    snoozedUntil: null,
    skipNextDate: null,
    order: 6,
    recentCompletions: [],
    createdAt: new Date('2026-05-20T00:00:00.000Z').toISOString()
  }
]

export const registry = {
  // Mirror the API behaviour of returning chores sorted by their `order`
  // field — without this, drag-reorder writes the new orders to the mock
  // store but the next read returns them in insertion order, which makes
  // the UI look like the reorder didn't take.
  //
  // Return fresh copies of each chore on every read. The store wraps
  // whatever the query returns in a Vue reactive proxy keyed on the raw
  // object. If we hand back the same plain refs the mock mutates in
  // place, Vue caches the original proxy and never sees the mutations —
  // the row stays "Due" after a complete/uncomplete because the computed
  // never invalidates. Cloning forces new proxies on each load, which
  // matches how the real API would return brand-new documents each query.
  chores: () => ({
    chores: [...chores]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(c => ({
        ...c,
        cadence: { ...c.cadence },
        recentCompletions: [...(c.recentCompletions ?? [])]
      }))
  }),
  completeChore: variables => {
    // Reflect the actual day the mock action ran so the UI sees a sensible
    // value across shifted mock dates.
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const isoDay = `${yyyy}-${mm}-${dd}`
    const chore = chores.find(c => c.id === variables.id)

    if (chore) {
      chore.lastCompletedOn = isoDay
      const existing = new Set(chore.recentCompletions ?? [])
      existing.add(isoDay)
      chore.recentCompletions = [...existing].sort()
    }

    return {
      completeChore: {
        id: variables.id,
        streak: 7,
        bestStreak: 21,
        lastCompletedOn: isoDay
      }
    }
  },
  uncompleteChore: variables => {
    // Inverse of completeChore for the mock: remove today's completion and
    // roll lastCompletedOn back to the next-most-recent completion (if any).
    // Streak isn't recomputed from cadence here; we just shave one off,
    // which is enough for the UI to flip the row back to "Due."
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const isoDay = `${yyyy}-${mm}-${dd}`
    const chore = chores.find(c => c.id === variables.id)

    if (chore) {
      const remaining = (chore.recentCompletions ?? []).filter(d => d !== isoDay)
      chore.recentCompletions = remaining
      chore.lastCompletedOn = remaining.length ? remaining[remaining.length - 1] : null
    }

    return {
      uncompleteChore: {
        id: variables.id,
        streak: chore?.lastCompletedOn ? Math.max((chore.streak ?? 1) - 1, 0) : 0,
        bestStreak: chore?.bestStreak ?? 0,
        lastCompletedOn: chore?.lastCompletedOn ?? null
      }
    }
  },
  createChore: (variables = {}) => {
    const newChore = {
      id: `c-new-${Date.now()}`,
      title: variables.title ?? 'New chore',
      cadence: variables.cadence ?? {
        type: 'daily',
        daysOfWeek: null,
        interval: null,
        dayOfMonth: null
      },
      streak: 0,
      bestStreak: 0,
      lastCompletedOn: null,
      active: true,
      snoozedUntil: null,
      skipNextDate: null,
      order: chores.length,
      recentCompletions: [],
      createdAt: new Date().toISOString()
    }

    chores = [...chores, newChore]
    return { createChore: newChore }
  },
  updateChore: (variables = {}) => {
    const chore = chores.find(c => c.id === variables.id)
    if (!chore) return { updateChore: null }
    if (variables.title !== undefined && variables.title !== null) chore.title = variables.title
    if (variables.cadence !== undefined && variables.cadence !== null)
      chore.cadence = variables.cadence
    if (variables.active !== undefined && variables.active !== null) chore.active = variables.active
    if (variables.order !== undefined && variables.order !== null) chore.order = variables.order
    return {
      updateChore: {
        id: chore.id,
        title: chore.title,
        cadence: chore.cadence,
        active: chore.active,
        order: chore.order
      }
    }
  },
  deleteChore: (variables = {}) => {
    const before = chores.length
    chores = chores.filter(c => c.id !== variables.id)
    return { deleteChore: chores.length < before }
  },
  snoozeChore: (variables = {}) => {
    const chore = chores.find(c => c.id === variables.id)
    if (chore) chore.snoozedUntil = variables.until ?? null
    return {
      snoozeChore: {
        id: variables.id,
        snoozedUntil: variables.until ?? null,
        skipNextDate: chore?.skipNextDate ?? null
      }
    }
  },
  skipNextChore: (variables = {}) => {
    const chore = chores.find(c => c.id === variables.id)
    // Pick tomorrow as a plausible next-skip date so the UI has something to render.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    if (chore) chore.skipNextDate = tomorrow
    return {
      skipNextChore: {
        id: variables.id,
        snoozedUntil: chore?.snoozedUntil ?? null,
        skipNextDate: tomorrow
      }
    }
  },
  resumeChore: (variables = {}) => {
    const chore = chores.find(c => c.id === variables.id)

    if (chore) {
      chore.snoozedUntil = null
      chore.skipNextDate = null
    }

    return {
      resumeChore: {
        id: variables.id,
        snoozedUntil: null,
        skipNextDate: null
      }
    }
  }
}
