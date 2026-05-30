/**
 * Composable that exposes a 7-element array of short weekday names ("Sun",
 * "Mon", ...) sourced from `Intl.DateTimeFormat` so consumers honour the
 * user's browser locale instead of hardcoded English.
 */
import { computed } from 'vue'

/**
 * Composable that returns a locale-aware short weekday name array.
 *
 * @returns {{ weekdayHeaders: import('vue').ComputedRef<string[]> }} Reactive array of 7 short weekday names starting from Sunday.
 */
export function useWeekdayHeaders() {
  const weekdayHeaders = computed(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
    const headers = []
    // 2024-01-07 was a Sunday — an arbitrary anchor for stepping through a week.
    const base = new Date(2024, 0, 7)

    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      headers.push(fmt.format(d))
    }

    return headers
  })

  return { weekdayHeaders }
}
