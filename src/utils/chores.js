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

  if (type === 'once') {
    if (!cadence.dueDate) return false
    return isoDate(date) === String(cadence.dueDate).slice(0, 10)
  }

  return false
}

/**
 * Split chores into Due today and Upcoming.
 * Snoozed chores and chores whose skipNextDate matches today are always
 * pushed to Upcoming.
 *
 * A one-off chore (cadence.type === 'once') whose dueDate is on-or-before
 * today and is not yet completed lands in Due — otherwise a once chore
 * missed yesterday would silently move to Upcoming and the user would
 * forget it. Recurring chores keep the today-only semantics; their misses
 * are surfaced through the status pill instead.
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

    if (chore.cadence?.type === 'once') {
      const dueOn = chore.cadence.dueDate ? String(chore.cadence.dueDate).slice(0, 10) : null
      const lastDone = String(chore.lastCompletedOn ?? '').slice(0, 10)
      const isOpenOnce = dueOn && dueOn <= todayIso && lastDone !== todayIso
      if (isOpenOnce) due.push(chore)
      else upcoming.push(chore)
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
 *
 * One-off chores intentionally render as all-not-due — the dot strip is a
 * pattern-of-recurrence visual and means nothing for a single-shot todo.
 * The row layer can use this to decide whether to render the strip at all.
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
 * - daily interval=1 -> "Every day"
 * - daily interval>1 -> "Every N days"
 * - weekly -> "Mon · Wed · Fri"
 * - monthly -> "Day 15 of each month"
 * - once -> "Due May 30" (or similar; "One-off" when no dueDate yet)
 */
export function cadenceLabel(cadence, t) {
  const type = cadence?.type

  if (type === 'daily') {
    const n = cadence.interval ?? 1
    if (n <= 1) return t('chores.cadenceEveryDay')
    return t('chores.cadenceEveryNDays', { n })
  }

  if (type === 'weekly') {
    const days = cadence.daysOfWeek ?? []
    if (days.length === 0) return t('chores.cadenceWeekly')
    const keys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days
      .slice()
      .sort((a, b) => a - b)
      .map(d => t(`chores.dayAbbr${keys[d]}`))
      .join(' · ')
  }

  if (type === 'monthly') {
    if (cadence.dayOfMonth == null) return t('chores.cadenceMonthly')
    return t('chores.cadenceDayOfMonthOrdinal', { day: cadence.dayOfMonth })
  }

  if (type === 'once') {
    if (!cadence.dueDate) return t('chores.cadenceOnce')
    return t('chores.cadenceDueOn', { date: formatDueDate(cadence.dueDate) })
  }

  return type ?? ''
}

/**
 * Format an ISO date as a short, human-readable string ("May 30"). Kept
 * inline so the chores helper doesn't depend on date.js — that file imports
 * d3 + Intl shims that aren't needed here.
 */
function formatDueDate(iso) {
  const d = new Date(String(iso).slice(0, 10))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isoDate(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/**
 * Walks back from yesterday until the first due day. If that day was
 * completed the chore is in good standing (returns 0); if it was missed
 * the chore is overdue by the number of days since.
 *
 * Capped at 30 days back — anything older isn't actionable as "late" and
 * also bounds the cost for chores with weeks of missed days.
 */
export function overdueDays(chore, today = new Date()) {
  const completions = new Set(chore.recentCompletions ?? [])

  for (let offset = 1; offset <= 30; offset++) {
    const day = new Date(today)
    day.setUTCHours(0, 0, 0, 0)
    day.setUTCDate(day.getUTCDate() - offset)

    if (isDueOn(chore, day)) {
      const iso = isoDate(day)
      if (completions.has(iso)) return 0
      return offset
    }
  }

  return 0
}

/**
 * Resolve the chore's current status for display on the row.
 * Returns one of:
 *   { state: 'done' }                          — completed today
 *   { state: 'snoozed', until: ISO }           — snoozedUntil in the future
 *   { state: 'overdue', days: N }              — most recent past due day missed
 *   { state: 'due' }                           — anything else
 *
 * Order matters: a completed-today chore stays "done" even if it was also
 * overdue earlier in the week (the completion clears the slate visually).
 */
export function choreStatus(chore, today = new Date()) {
  // Use a local-date key (en-CA → YYYY-MM-DD) for the "done today" check
  // because callers compare against lastCompletedOn, which the rest of the
  // chores UI also treats as a local-date string. Switching to UTC here
  // makes evening completions in west-of-UTC zones look like yesterday.
  const todayLocal = today.toLocaleDateString('en-CA')
  const lastDone = String(chore.lastCompletedOn ?? '').slice(0, 10)

  if (lastDone === todayLocal) return { state: 'done' }

  if (isSnoozedNow(chore, today)) {
    return { state: 'snoozed', until: chore.snoozedUntil }
  }

  const late = overdueDays(chore, today)
  if (late > 0) return { state: 'overdue', days: late }

  return { state: 'due' }
}
