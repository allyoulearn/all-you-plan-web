/**
 * Wren sync composable.
 *
 * Watches `wrenStore.lastAction` and, whenever Wren applies a write action,
 * refreshes the matching domain store so the affected view picks up the
 * change without a full app reload. Stores that aren't yet hydrated (their
 * view hasn't been visited) are skipped — refresh would just fetch into a
 * Pinia state nobody is reading. The view's own `onMounted` load() will pull
 * the up-to-date data when the user opens it.
 *
 * Mount this once from AppShell.vue so the listener spans every route inside
 * the authenticated shell.
 */
import { watch } from 'vue'
import { useWrenStore } from '@/stores/wren.store.js'
import { useTodayStore } from '@/stores/today.store.js'
import { useProjectsStore } from '@/stores/projects.store.js'
import { useChoresStore } from '@/stores/chores.store.js'
import { useCalendarStore } from '@/stores/calendar.store.js'
import { useJournalStore } from '@/stores/journal.store.js'
import { useInboxStore } from '@/stores/inbox.store.js'

/**
 * Subscribe to wren store action events and refresh affected domain stores.
 * Must be called from a component setup so the watcher tears down on unmount.
 */
export function useWrenSync() {
  const wren = useWrenStore()
  const today = useTodayStore()
  const projects = useProjectsStore()
  const chores = useChoresStore()
  const calendar = useCalendarStore()
  const journal = useJournalStore()
  const inbox = useInboxStore()

  watch(
    () => wren.lastAction,
    action => {
      if (!action?.refType) return

      switch (action.refType) {
        case 'task':
          if (today.view) today.load(today.view.date).catch(() => {})
          if (projects.board) projects.loadBoard(projects.board.project.id).catch(() => {})
          break
        case 'project':
          if (projects.projects.length) projects.loadProjects().catch(() => {})
          if (projects.board) projects.loadBoard(projects.board.project.id).catch(() => {})
          break
        case 'chore':
          if (chores.chores.length || chores.loading) chores.load().catch(() => {})
          break
        case 'calendar_event':
          if (calendar.events.length || calendar.loading) calendar.load().catch(() => {})
          break
        case 'journal_entry':
          if (journal.entries.length || journal.loading) journal.load().catch(() => {})
          break
        case 'inbox_item':
          if (inbox.items.length || inbox.loading) inbox.load().catch(() => {})
          break
      }
    }
  )
}
