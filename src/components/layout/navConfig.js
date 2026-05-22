/**
 * Navigation configuration.
 * Defines the sidebar navigation groups, their labels, and the ordered list
 * of route items (path, icon key, display label, keyboard shortcut) within
 * each group.  Consumed by the AppSidebar and mobile navigation components.
 */
/**
 * @type {Array<{ label: string, items: Array<{ to: string, icon: string, label: string, key: string }> }>}
 */
export const navGroups = [
  {
    label: 'Workspaces',
    items: [
      { to: '/', icon: 'today', label: 'Today', key: 'T' },
      { to: '/chores', icon: 'chores', label: 'Chores', key: 'C' },
      { to: '/projects', icon: 'projects', label: 'Projects', key: 'P' }
    ]
  },
  {
    label: 'Looking back',
    items: [
      { to: '/calendar', icon: 'calendar', label: 'Calendar', key: 'K' },
      { to: '/stats', icon: 'stats', label: 'Stats', key: 'S' },
      { to: '/journal', icon: 'journal', label: 'Journal', key: 'J' },
      { to: '/inbox', icon: 'inbox', label: 'Inbox', key: 'I' }
    ]
  },
  {
    label: 'With Wren',
    items: [
      { to: '/wren', icon: 'chat', label: 'Chat', key: 'W' },
      { to: '/review', icon: 'review', label: 'Daily review', key: 'R' }
    ]
  },
  {
    label: 'System',
    items: [{ to: '/settings', icon: 'settings', label: 'Settings', key: ',' }]
  }
]
