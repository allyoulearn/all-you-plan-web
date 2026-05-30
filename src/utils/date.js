import i18n from '@/i18n/index.js'

/**
 * Returns a local-time ISO date string (YYYY-MM-DD) for the given Date,
 * without UTC conversion. Avoids the off-by-one issue that
 * `Date.prototype.toISOString` causes for users west of UTC where late-evening
 * dates roll forward to the next day.
 * @param {Date} d
 * @returns {string}
 */
export function toLocalISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns the YYYY-MM key for a given year and 0-indexed month.
 * @param {number} year
 * @param {number} month - 0-indexed (0=Jan, 11=Dec)
 * @returns {string}
 */
export function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Returns today's local-time ISO date string (YYYY-MM-DD). Equivalent to
 * `toLocalISODate(new Date())` but more ergonomic at call sites.
 * @returns {string}
 */
export function localISOToday() {
  return toLocalISODate(new Date())
}

/**
 * Format a `HH:mm` 24-hour time string using the browser's locale-aware
 * short time format. Returns an empty string when the input is missing or
 * unparseable, so consumers can render the result without a v-if guard.
 *
 * Used wherever the API returns `scheduledTime` style fields (TaskRow,
 * Wren bubble timestamps, etc.) so the display picks up locale preferences
 * (24-hour vs AM/PM) without hand-rolling per-component.
 *
 * @param {string|null|undefined} hhmm
 * @returns {string}
 */
export function formatTime(hhmm) {
  if (!hhmm) return ''
  const [hStr, mStr] = String(hhmm).split(':')
  const h = Number(hStr)
  const m = Number(mStr ?? 0)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return ''
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format a Date as `Mon 5` style — short month + numeric day, locale-aware.
 * @param {Date|null|undefined} date
 * @returns {string}
 */
export function formatDayMonth(date) {
  if (!date || Number.isNaN(date.getTime?.())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Format a Date with weekday + day + month + year, locale-aware. Used by
 * the top bar's date pill and similar prominent timestamps.
 * @param {Date|null|undefined} date
 * @returns {string}
 */
export function formatLongDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return ''
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Resolve the user's IANA timezone via the browser's locale APIs. Falls back
 * to the supplied default (defaults to 'UTC') when the API returns an empty
 * string — rare but observed in some sandbox environments.
 * @param {string} [fallback='UTC']
 * @returns {string}
 */
export function localTimezone(fallback = 'UTC') {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback
}

/**
 * Format a date for chat-style day dividers: "Today", "Yesterday", a weekday
 * name for the last week, or a longer label for older dates. Mirrors the
 * grouping language used by iOS Messages and similar chat surfaces.
 * @param {string|Date} input
 * @param {Date} [now=new Date()] - reference "now" (injected for tests)
 * @returns {string}
 */
export function formatChatDate(input, now = new Date()) {
  if (input == null) return ''
  const d = input instanceof Date ? input : new Date(input)
  if (!d || Number.isNaN(d.getTime())) return ''
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((today.getTime() - day.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return i18n.global.t('common.dateToday')
  if (diffDays === 1) return i18n.global.t('common.dateYesterday')
  const localeTag = i18n.global.locale.value
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString(localeTag, { weekday: 'long' })
  return d.toLocaleDateString(localeTag, { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * Group an ordered list of messages into per-day buckets keyed by local
 * YYYY-MM-DD. The bucket order matches the input order (assumes the list is
 * already sorted ascending by createdAt). Each bucket carries the rendered
 * `label` so the chat surfaces don't recompute it.
 * @template {{ id: string, createdAt?: string|null }} T
 * @param {T[]} messages
 * @param {Date} [now=new Date()]
 * @returns {{ date: string, label: string, messages: T[] }[]}
 */
export function groupMessagesByDay(messages, now = new Date()) {
  if (!Array.isArray(messages) || messages.length === 0) return []
  const groups = []
  let current = null

  for (const msg of messages) {
    const d = msg?.createdAt ? new Date(msg.createdAt) : null

    if (!d || Number.isNaN(d.getTime())) {
      // Messages with no createdAt land in the last bucket if one exists,
      // otherwise an "Unknown" bucket so they still render.
      if (current) {
        current.messages.push(msg)
      } else {
        current = { date: 'unknown', label: '', messages: [msg] }
        groups.push(current)
      }

      continue
    }

    const key = toLocalISODate(d)

    if (!current || current.date !== key) {
      current = { date: key, label: formatChatDate(d, now), messages: [] }
      groups.push(current)
    }

    current.messages.push(msg)
  }

  return groups
}
