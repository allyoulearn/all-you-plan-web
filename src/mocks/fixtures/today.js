/** Mock fixtures for the Today screen. */

const tasks = [
  {
    id: 't1',
    title: 'Review the quarterly goals',
    note: 'Focus on the three that slipped last cycle',
    scheduledTime: '09:30',
    done: false,
    completedAt: null,
    effortMinutes: 45,
    tag: 'work',
    projectId: 'p1',
    order: 0
  },
  {
    id: 't2',
    title: 'Morning walk',
    note: null,
    scheduledTime: '07:00',
    done: true,
    completedAt: '2026-05-22T07:35:00.000Z',
    effortMinutes: 30,
    tag: 'health',
    projectId: null,
    order: 1
  },
  {
    id: 't3',
    title: 'Write weekly update',
    note: 'Include blockers and wins',
    scheduledTime: '11:00',
    done: false,
    completedAt: null,
    effortMinutes: 20,
    tag: 'work',
    projectId: 'p1',
    order: 2
  },
  {
    id: 't4',
    title: 'Read 20 pages',
    note: null,
    scheduledTime: '21:00',
    done: false,
    completedAt: null,
    effortMinutes: 25,
    tag: 'learning',
    projectId: null,
    order: 3
  },
  {
    id: 't5',
    title: 'Call with mentor',
    note: 'Prepare two questions ahead of time',
    scheduledTime: '15:00',
    done: false,
    completedAt: null,
    effortMinutes: 60,
    tag: 'work',
    projectId: null,
    order: 4
  }
]

export const registry = {
  today: variables => ({
    today: {
      date: variables.date ?? '2026-05-22',
      sunrise: '05:42',
      sunset: '20:18',
      kpis: {
        streak: 6,
        todayDone: 1,
        todayTotal: 5,
        focusMinutes: 75,
        activeProjects: 3
      },
      tasks
    }
  }),
  completeTask: variables => ({
    completeTask: {
      id: variables.id,
      done: true,
      completedAt: '2026-05-22T12:00:00.000Z'
    }
  }),
  createTask: () => ({ createTask: { id: 'new-task' } }),
  rescheduleTask: variables => ({ rescheduleTask: { id: variables.id } }),
  moveUnfinishedToTomorrow: () => ({
    moveUnfinishedToTomorrow: [{ id: 't1' }, { id: 't3' }, { id: 't4' }, { id: 't5' }]
  })
}
