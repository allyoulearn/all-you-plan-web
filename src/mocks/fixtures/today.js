/** Mock fixtures for the Today screen. */

import { localISOToday } from '@/utils/date.js'

/**
 * The today mock's task list. Exported as a `let` binding so the projects
 * mock can pick up an `updateTask` mutation and apply the patch here too —
 * in mock mode the two domains share one task list, mirroring the real
 * backend where today is just a view over the tasks collection.
 */
export let tasks = [
  {
    id: 't1',
    title: 'Review the quarterly goals',
    note: 'Focus on the three that slipped last cycle',
    scheduledDate: '2026-05-22',
    scheduledTime: '09:30',
    done: false,
    completedAt: null,
    effortMinutes: 45,
    tag: 'work',
    projectId: 'p1',
    order: 0,
    columnId: null,
    priority: 'high',
    subtasks: []
  },
  {
    id: 't2',
    title: 'Morning walk',
    note: null,
    scheduledDate: '2026-05-22',
    scheduledTime: '07:00',
    done: true,
    completedAt: '2026-05-22T07:35:00.000Z',
    effortMinutes: 30,
    tag: 'health',
    projectId: null,
    order: 1,
    columnId: null,
    priority: 'normal',
    subtasks: []
  },
  {
    id: 't3',
    title: 'Write weekly update',
    note: 'Include blockers and wins',
    scheduledDate: '2026-05-22',
    scheduledTime: '11:00',
    done: false,
    completedAt: null,
    effortMinutes: 20,
    tag: 'work',
    projectId: 'p1',
    order: 2,
    columnId: null,
    priority: 'normal',
    subtasks: []
  },
  {
    id: 't4',
    title: 'Read 20 pages',
    note: null,
    scheduledDate: '2026-05-22',
    scheduledTime: '21:00',
    done: false,
    completedAt: null,
    effortMinutes: 25,
    tag: 'learning',
    projectId: null,
    order: 3,
    columnId: null,
    priority: 'low',
    subtasks: []
  },
  {
    id: 't5',
    title: 'Call with mentor',
    note: 'Prepare two questions ahead of time',
    scheduledDate: '2026-05-22',
    scheduledTime: '15:00',
    done: false,
    completedAt: null,
    effortMinutes: 60,
    tag: 'work',
    projectId: null,
    order: 4,
    columnId: null,
    priority: 'high',
    subtasks: []
  }
]

/** Add `days` to an ISO date string (YYYY-MM-DD), returning the same shape. */
function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const registry = {
  today: variables => {
    const date = variables.date ?? '2026-05-22'
    return {
      today: {
        date,
        sunrise: '05:42',
        sunset: '20:18',
        kpis: {
          streak: 6,
          todayDone: tasks.filter(t => t.scheduledDate === date && t.done).length,
          todayTotal: tasks.filter(t => t.scheduledDate === date).length,
          focusMinutes: 75,
          activeProjects: 3
        },
        tasks: tasks.filter(t => t.scheduledDate === date).map(t => ({ ...t }))
      }
    }
  },
  completeTask: variables => {
    // Mirrors the API's completeTaskById, which toggles done state rather
    // than only setting it true — so clicking a completed task uncompletes it.
    const task = tasks.find(t => t.id === variables.id)
    const nowDone = task ? !task.done : true
    const completedAt = nowDone ? new Date().toISOString() : null

    if (task) {
      task.done = nowDone
      task.completedAt = completedAt
    }

    return {
      completeTask: {
        id: variables.id,
        done: nowDone,
        completedAt
      }
    }
  },
  createTask: (variables = {}) => {
    const input = variables.input ?? {}

    const newTask = {
      id: `t-new-${Date.now()}`,
      title: input.title ?? 'New task',
      note: input.note ?? null,
      scheduledDate: input.scheduledDate ?? localISOToday(),
      scheduledTime: input.scheduledTime ?? null,
      done: false,
      completedAt: null,
      effortMinutes: input.effortMinutes ?? null,
      tag: input.tag ?? null,
      projectId: input.projectId ?? null,
      order: tasks.length,
      columnId: null,
      priority: 'normal',
      subtasks: []
    }

    tasks = [...tasks, newTask]
    return { createTask: { id: newTask.id } }
  },
  rescheduleTask: variables => {
    const task = tasks.find(t => t.id === variables.id)

    if (task) {
      if (variables.scheduledDate !== undefined) task.scheduledDate = variables.scheduledDate
      if (variables.scheduledTime !== undefined) task.scheduledTime = variables.scheduledTime
    }

    return { rescheduleTask: { id: variables.id } }
  },
  moveUnfinishedToTomorrow: (variables = {}) => {
    const fromDate = variables.fromDate ?? localISOToday()
    const toDate = addDays(fromDate, 1)
    const moved = tasks.filter(t => t.scheduledDate === fromDate && !t.done)

    moved.forEach(t => {
      t.scheduledDate = toDate
    })

    return {
      moveUnfinishedToTomorrow: moved.map(t => ({ id: t.id }))
    }
  }
}
