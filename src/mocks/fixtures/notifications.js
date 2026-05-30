/** Mock fixtures for notification settings + devices. */

const settings = {
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dailyBriefingTime: '07:00',
  permission: 'granted',
  preferences: [
    { id: 'p1', categoryId: 'tasks.due', push: true, email: false, inApp: true },
    { id: 'p2', categoryId: 'tasks.overdue', push: true, email: false, inApp: true },
    { id: 'p3', categoryId: 'chores.due', push: true, email: false, inApp: true },
    { id: 'p4', categoryId: 'chores.streak-risk', push: true, email: false, inApp: true },
    { id: 'p5', categoryId: 'briefing.am', push: true, email: false, inApp: true },
    { id: 'p6', categoryId: 'review.weekly', push: false, email: true, inApp: true },
    { id: 'p7', categoryId: 'wren.proactive', push: false, email: false, inApp: true }
  ]
}

const devices = [
  {
    id: 'd1',
    label: "Mara's iPhone 15",
    platform: 'ios',
    status: 'live',
    lastSeenAt: new Date().toISOString(),
    enrolledAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    current: false
  },
  {
    id: 'd2',
    label: 'MacBook Air · Helsinki',
    platform: 'web',
    status: 'live',
    lastSeenAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    current: true
  },
  {
    id: 'd3',
    label: 'Old MacBook · Brooklyn',
    platform: 'web',
    status: 'stale',
    lastSeenAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    enrolledAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    current: false
  }
]

export const registry = {
  notificationSettings: () => ({
    notificationSettings: settings,
    notificationDevices: devices
  }),
  updateNotificationSettings: (variables = {}) => {
    Object.assign(settings, variables.input ?? {})
    return { updateNotificationSettings: { ...settings } }
  },
  updateNotificationPreference: (variables = {}) => {
    const input = variables.input ?? {}
    const pref = settings.preferences.find(p => p.categoryId === input.categoryId)
    if (pref) Object.assign(pref, input)
    return {
      updateNotificationPreference: pref ?? {
        id: input.categoryId ?? 'unknown',
        categoryId: input.categoryId ?? 'unknown',
        push: !!input.push,
        email: !!input.email,
        inApp: !!input.inApp
      }
    }
  },
  registerDevice: (variables = {}) => ({
    registerDevice: {
      id: 'd' + Date.now(),
      label: variables.label ?? 'Device',
      platform: variables.platform ?? 'web'
    }
  }),
  revokeDevice: () => ({ revokeDevice: true })
}
