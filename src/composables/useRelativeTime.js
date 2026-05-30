/**
 * useRelativeTime — render an ISO timestamp as a coarse-grained relative
 * label like "Just now", "5 minutes ago", "3 hours ago", "2 days ago".
 *
 * The four thresholds (now / minutes / hours / days) are shared, but each
 * view uses its own localised key family (e.g. `notifications.relNow`,
 * `inbox.relJustNow`). Pass the prefix when calling the composable; the
 * returned function then looks up `<prefix>.relNow`, `<prefix>.relMinutesAgo`,
 * `<prefix>.relHoursAgo`, `<prefix>.relDaysAgo` for you.
 *
 * Empty or falsy input returns an empty string so consumers can render the
 * result directly without a v-if guard.
 *
 * @param {string} prefix - i18n key family prefix (e.g. 'notifications' or 'inbox')
 * @returns {{ relativeTime: (iso: string|null|undefined) => string }}
 */
import { useI18n } from 'vue-i18n'

export function useRelativeTime(prefix) {
  const { t } = useI18n()

  /**
   * Format an ISO timestamp as a relative-time label using the configured
   * i18n key family.
   * @param {string|null|undefined} iso
   * @returns {string}
   */
  function relativeTime(iso) {
    if (!iso) return ''
    const diffSeconds = (Date.now() - new Date(iso).getTime()) / 1000
    if (diffSeconds < 60) return t(`${prefix}.relNow`)
    if (diffSeconds < 3600)
      return t(`${prefix}.relMinutesAgo`, { count: Math.floor(diffSeconds / 60) })
    if (diffSeconds < 86400)
      return t(`${prefix}.relHoursAgo`, { count: Math.floor(diffSeconds / 3600) })
    return t(`${prefix}.relDaysAgo`, { count: Math.floor(diffSeconds / 86400) })
  }

  return { relativeTime }
}
