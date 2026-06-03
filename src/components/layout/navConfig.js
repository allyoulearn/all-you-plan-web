/**
 * Navigation configuration.
 * Defines the sidebar navigation groups, their labels, and the ordered list
 * of route items (path, icon key, display label, keyboard shortcut) within
 * each group.  Consumed by the AppSidebar and mobile navigation components.
 *
 * `labelKey` is the i18n key the consumer (AppSidebar) resolves via `t()`;
 * the literal `label` remains as an English fallback for tests and non-i18n
 * contexts.
 */
/**
 * @type {Array<{ label: string, labelKey: string, items: Array<{ to: string, icon: string, label: string, labelKey: string, key: string }> }>}
 */
export const navGroups = [
  {
    label: 'Workspaces',
    labelKey: 'nav.workspaces',
    items: [
      { to: '/', icon: 'today', label: 'Today', labelKey: 'nav.itemToday', key: 'T' },
      { to: '/tasks', icon: 'tasks', label: 'Tasks', labelKey: 'nav.itemTasks', key: 'A' },
      { to: '/goals', icon: 'flag', label: 'Goals', labelKey: 'nav.itemGoals', key: 'G' },
      { to: '/chores', icon: 'chores', label: 'Chores', labelKey: 'nav.itemChores', key: 'C' },
      {
        to: '/projects',
        icon: 'projects',
        label: 'Projects',
        labelKey: 'nav.itemProjects',
        key: 'P'
      }
    ]
  },
  {
    label: 'Looking back',
    labelKey: 'nav.lookingBack',
    items: [
      {
        to: '/calendar',
        icon: 'calendar',
        label: 'Calendar',
        labelKey: 'nav.itemCalendar',
        key: 'K'
      },
      { to: '/stats', icon: 'stats', label: 'Stats', labelKey: 'nav.itemStats', key: 'S' },
      { to: '/journal', icon: 'journal', label: 'Journal', labelKey: 'nav.itemJournal', key: 'J' },
      { to: '/inbox', icon: 'inbox', label: 'Inbox', labelKey: 'nav.itemInbox', key: 'I' }
    ]
  },
  {
    label: 'With Wren',
    labelKey: 'nav.withWren',
    items: [
      { to: '/wren', icon: 'chat', label: 'Chat', labelKey: 'nav.itemChat', key: 'W' },
      {
        to: '/review',
        icon: 'review',
        label: 'Daily review',
        labelKey: 'nav.itemDailyReview',
        key: 'R'
      }
    ]
  },
  {
    label: 'System',
    labelKey: 'nav.system',
    items: [
      { to: '/settings', icon: 'settings', label: 'Settings', labelKey: 'nav.settings', key: ',' }
    ]
  }
]
