/** Mock fixtures for active sessions. */

let sessions = [
  {
    id: 's1',
    device: 'MacBook Air · Safari 18',
    ipAddress: '81.197.x.x',
    city: 'Helsinki',
    lastSeenAt: new Date().toISOString(),
    current: true
  },
  {
    id: 's2',
    device: "Mara's iPhone 15",
    ipAddress: '81.197.x.x',
    city: 'Helsinki',
    lastSeenAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    current: false
  },
  {
    id: 's3',
    device: 'Old MacBook · Firefox',
    ipAddress: '74.125.x.x',
    city: 'Brooklyn',
    lastSeenAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    current: false
  }
]

export const registry = {
  sessions: () => ({ sessions: [...sessions] }),
  revokeSession: (variables = {}) => {
    sessions = sessions.filter(s => s.id !== variables.id || s.current)
    return { revokeSession: true }
  },
  revokeOtherSessions: () => {
    const removed = sessions.filter(s => !s.current).length
    sessions = sessions.filter(s => s.current)
    return { revokeOtherSessions: removed }
  }
}
