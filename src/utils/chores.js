/**
 * Pure helpers for the chores view.
 * Mirrors the API's isChoreDueOn algorithm so client + server stay in sync.
 */

/** True when chore.snoozedUntil is a timestamp in the future. */
export function isSnoozedNow(chore, now = new Date()) {
  if (!chore.snoozedUntil) return false
  return new Date(chore.snoozedUntil) > now
}

/**
 * Returns true if the chore's cadence makes it due on the given date (UTC).
 * Mirrors all-you-plan-api/src/domains/chores/service.ts:isChoreDueOn.
 */
export function isDueOn(chore, date) {
  const cadence = chore.cadence ?? {}
  const type = cadence.type
  const daysOfWeek = cadence.daysOfWeek ?? []
  const interval = cadence.interval ?? 1
  const dayOfMonth = cadence.dayOfMonth

  if (type === 'daily') {
    if (!chore.createdAt) return true
    const created = new Date(chore.createdAt)
    created.setUTCHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setUTCHours(0, 0, 0, 0)
    const diffMs = target.getTime() - created.getTime()
    const diffDays = Math.round(diffMs / 86_400_000)
    return diffDays >= 0 && diffDays % interval === 0
  }

  if (type === 'weekly') {
    return daysOfWeek.includes(date.getUTCDay())
  }

  if (type === 'monthly') {
    if (dayOfMonth == null) return false
    return date.getUTCDate() === dayOfMonth
  }

  return false
}

/**
 * Split chores into Due today and Upcoming.
 * Snoozed chores and chores whose skipNextDate matches today are always
 * pushed to Upcoming.
 */
export function groupChoresForView(chores, today = new Date()) {
  const due = []
  const upcoming = []
  const todayIso = isoDate(today)

  for (const chore of chores) {
    if (isSnoozedNow(chore, today)) {
      upcoming.push(chore)
      continue
    }

    if (chore.skipNextDate === todayIso) {
      upcoming.push(chore)
      continue
    }

    if (isDueOn(chore, today)) due.push(chore)
    else upcoming.push(chore)
  }

  return { due, upcoming }
}

/**
 * Build a 7-element strip representing the chore's last week of completions.
 * Returned oldest first; each entry is { iso, state: 'done'|'missed'|'not-due' }.
 */
export function buildRecentStrip(chore, today = new Date()) {
  const completions = new Set(chore.recentCompletions ?? [])
  const strip = []

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(today)
    day.setUTCHours(0, 0, 0, 0)
    day.setUTCDate(day.getUTCDate() - offset)
    const iso = isoDate(day)
    if (completions.has(iso)) strip.push({ iso, state: 'done' })
    else if (isDueOn(chore, day)) strip.push({ iso, state: 'missed' })
    else strip.push({ iso, state: 'not-due' })
  }

  return strip
}

/**
 * Human-readable cadence label.
 * - daily interval=1 -> "Daily"
 * - daily interval>1 -> "Every N days"
 * - weekly -> "Mon · Wed · Fri"
 * - monthly -> "Day 15"
 */
export function cadenceLabel(cadence, t) {
  const type = cadence?.type

  if (type === 'daily') {
    const n = cadence.interval ?? 1
    if (n <= 1) return t('chores.cadenceDaily')
    return t('chores.cadenceEveryNDays', { n })
  }

  if (type === 'weekly') {
    const days = cadence.daysOfWeek ?? []
    if (days.length === 0) return t('chores.cadenceWeekly')
    const keys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days
      .slice()
      .sort((a, b) => a - b)
      .map(d => t(`chores.dayShort${keys[d]}`))
      .join(' · ')
  }

  if (type === 'monthly') {
    if (cadence.dayOfMonth == null) return t('chores.cadenceMonthly')
    return t('chores.cadenceDayOfMonth', { day: cadence.dayOfMonth })
  }

  return type ?? ''
}

function isoDate(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
