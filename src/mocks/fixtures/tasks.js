/**
 * Mock fixtures for the Tasks workspace.
 *
 * Owns its own rich task list (category / urgency / kind / dueDate) mirroring
 * the design's data.jsx — a realistic plate spanning every category and
 * urgency, with overdue / today / future deadlines and project-linked work.
 *
 * The `due` block is derived at read time from `dueDate` relative to the
 * current date so day-deltas stay sensible even when the app's mock "today"
 * shifts. The summary counts are computed the same way.
 *
 * Mutation note: `createTask` / `completeTask` / `updateTask` / `deleteTask`
 * are root fields the Today and Projects fixtures also register. This module
 * is merged LAST in the registry, so these unified handlers supersede them:
 * each one updates this workspace list AND falls through to the shared Today
 * list (imported), so every task surface keeps resolving with zero network.
 */
import { tasks as todayTasks } from './today.js'

/** Project lookups so project-linked tasks can render a real name. */
const PROJECTS = {
  myapp: { id: 'myapp', name: 'MyApp v2 — search & filters' },
  studio: { id: 'studio', name: 'Build out the home studio' },
  site: { id: 'site', name: 'Portfolio site redesign' }
}

/**
 * The workspace's task list. `dueOffset` is the number of days from "today"
 * the task is due (negative = overdue, 0 = today, null = no date). The
 * resolved `due` block is built from it on every read.
 */
let workspaceTasks = [
  // ---- Critical: overdue or due now ----
  {
    id: 'tw-expense',
    title: 'Submit Q1 expense report',
    note: 'Finance closes the quarter Friday — needs receipts attached.',
    category: 'admin',
    urgency: 'critical',
    kind: 'deadline',
    dueOffset: 0,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-acct',
    title: 'Reply to accountant about tax documents',
    note: "They're waiting on the 1099 and the studio-equipment list.",
    category: 'admin',
    urgency: 'critical',
    kind: 'deadline',
    dueOffset: -2,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-invoice',
    title: 'Send invoice to client (April retainer)',
    note: 'Net-30; the longer it waits the later it pays.',
    category: 'dev',
    urgency: 'critical',
    kind: 'deadline',
    dueOffset: 1,
    project: 'site',
    tag: null,
    done: false
  },
  // ---- High: important, this week ----
  {
    id: 'tw-passport',
    title: 'Renew passport',
    note: 'Expires before the September trip. Needs new photo + form DS-82.',
    category: 'admin',
    urgency: 'high',
    kind: 'deadline',
    dueOffset: 40,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-insurance',
    title: 'Renew car insurance',
    note: 'Auto-renew is off — quote three providers first.',
    category: 'admin',
    urgency: 'high',
    kind: 'deadline',
    dueOffset: 7,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-tap',
    title: 'Fix the leaking studio sink tap',
    note: 'Dripping onto the pedalboard shelf. Needs a new cartridge.',
    category: 'studio',
    urgency: 'high',
    kind: 'once',
    dueOffset: null,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-dentist',
    title: 'Book the overdue dentist cleaning',
    note: 'Six months late. The clinic opens bookings at 9am.',
    category: 'health',
    urgency: 'high',
    kind: 'once',
    dueOffset: null,
    project: null,
    tag: null,
    done: false
  },
  // ---- Medium: do soon ----
  {
    id: 'tw-tidy',
    title: 'Tidy up the guitar studio',
    note: 'Cables everywhere. Clear the desk before the next session.',
    category: 'studio',
    urgency: 'medium',
    kind: 'once',
    dueOffset: null,
    project: 'studio',
    tag: null,
    done: false
  },
  {
    id: 'tw-restring',
    title: 'Restring & set up the Telecaster',
    note: 'Intonation is off on the high E. New 10–46 set.',
    category: 'music',
    urgency: 'medium',
    kind: 'once',
    dueOffset: null,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-roadmap',
    title: 'Draft Q3 roadmap for MyApp',
    note: 'Decide what ships after the v2 beta.',
    category: 'dev',
    urgency: 'medium',
    kind: 'once',
    dueOffset: null,
    project: 'myapp',
    tag: null,
    done: false
  },
  // ---- Low: someday / backlog ----
  {
    id: 'tw-backup',
    title: 'Back up the old photo library',
    note: '~400GB on the failing external drive. Move to the NAS.',
    category: 'tech',
    urgency: 'low',
    kind: 'once',
    dueOffset: null,
    project: null,
    tag: null,
    done: false
  },
  {
    id: 'tw-acoustic',
    title: 'Acoustic-treat the studio walls',
    note: 'Bass traps in the corners, panels at first reflections.',
    category: 'studio',
    urgency: 'low',
    kind: 'once',
    dueOffset: null,
    project: 'studio',
    tag: null,
    done: false
  },
  {
    id: 'tw-strings',
    title: 'Change guitar strings',
    note: 'Weekly ritual before the Sunday session.',
    category: 'music',
    urgency: 'low',
    kind: 'recurring',
    dueOffset: 3,
    project: null,
    tag: null,
    done: false
  },
  // ---- Done (recently cleared) ----
  {
    id: 'tw-rent',
    title: 'Pay rent + studio space',
    note: '',
    category: 'admin',
    urgency: 'high',
    kind: 'deadline',
    dueOffset: -20,
    project: null,
    tag: null,
    done: true
  },
  {
    id: 'tw-strings-buy',
    title: 'Buy 3 sets of strings',
    note: '',
    category: 'music',
    urgency: 'low',
    kind: 'once',
    dueOffset: null,
    project: null,
    tag: null,
    done: true
  }
]

/** Format a date as a short "Jun 30" style label. */
function shortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** YYYY-MM-DD for a date offset from today by `offset` days. */
function isoFromOffset(offset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return { iso: `${y}-${m}-${day}`, date: d }
}

/**
 * Build the resolved `{ dueDate, due }` pair from a `dueOffset`. Returns
 * `{ dueDate: null, due: null }` for undated tasks. The label mirrors the
 * design: "Due today" (0), "Due tomorrow" (1), "N days overdue" (<0), else a
 * short date.
 */
function resolveDue(offset) {
  if (offset == null) return { dueDate: null, due: null }
  const { iso, date } = isoFromOffset(offset)
  let label
  if (offset < 0) label = `${Math.abs(offset)} day${Math.abs(offset) === 1 ? '' : 's'} overdue`
  else if (offset === 0) label = 'Due today'
  else if (offset === 1) label = 'Due tomorrow'
  else label = shortDate(date)
  return { dueDate: iso, due: { label, daysLeft: offset } }
}

/** Map an internal task to the GraphQL Task shape the workspace query reads. */
function toGraphTask(t) {
  const { dueDate, due } = resolveDue(t.dueOffset)
  const project = t.project ? (PROJECTS[t.project] ?? { id: t.project, name: t.project }) : null
  return {
    id: t.id,
    title: t.title,
    note: t.note || null,
    urgency: t.urgency,
    category: t.category ?? null,
    kind: t.kind,
    dueDate,
    due,
    done: t.done,
    tag: t.tag ?? null,
    priority: t.priority ?? 'normal',
    order: 0,
    projectId: project ? project.id : null,
    project
  }
}

/** Compute the summary counters from the open (and, for done, all) tasks. */
function buildSummary() {
  const open = workspaceTasks.filter(t => !t.done)
  const dated = open.filter(t => t.dueOffset != null)
  return {
    total: open.length,
    overdue: open.filter(t => t.dueOffset != null && t.dueOffset < 0).length,
    dated: dated.length,
    critical: open.filter(t => t.urgency === 'critical').length,
    high: open.filter(t => t.urgency === 'high').length,
    doneRecently: workspaceTasks.filter(t => t.done).length
  }
}

export const registry = {
  taskWorkspace: (variables = {}) => {
    const includeDone = variables.includeDone ?? false
    const list = includeDone ? workspaceTasks : workspaceTasks.filter(t => !t.done)
    return {
      taskWorkspace: {
        tasks: list.map(toGraphTask),
        summary: buildSummary()
      }
    }
  },
  createTask: (variables = {}) => {
    const input = variables.input ?? {}
    const dueOffset = input.dueDate ? daysUntil(input.dueDate) : null

    const newTask = {
      id: `tw-new-${Date.now()}`,
      title: input.title ?? 'New task',
      note: input.note ?? '',
      category: input.category ?? null,
      urgency: input.urgency ?? 'medium',
      kind: input.kind ?? (input.dueDate ? 'deadline' : 'once'),
      dueOffset,
      project: input.projectId ?? null,
      tag: input.tag ?? null,
      done: false
    }

    workspaceTasks = [...workspaceTasks, newTask]

    // Mirror into the shared Today list so Today/Projects mocks stay coherent.
    todayTasks.push({
      id: newTask.id,
      title: newTask.title,
      note: newTask.note || null,
      scheduledDate: input.dueDate ?? null,
      scheduledTime: null,
      done: false,
      completedAt: null,
      effortMinutes: null,
      tag: newTask.tag,
      projectId: newTask.project,
      order: todayTasks.length,
      columnId: null,
      priority: 'normal',
      subtasks: []
    })

    return { createTask: { id: newTask.id } }
  },
  completeTask: (variables = {}) => {
    // Toggle, matching the API's completeTaskById semantics.
    const task = workspaceTasks.find(t => t.id === variables.id)
    const todayTask = todayTasks.find(t => t.id === variables.id)
    const nowDone = task ? !task.done : todayTask ? !todayTask.done : true
    if (task) task.done = nowDone

    if (todayTask) {
      todayTask.done = nowDone
      todayTask.completedAt = nowDone ? new Date().toISOString() : null
    }

    return { completeTask: { id: variables.id, done: nowDone, completedAt: null } }
  },
  updateTask: (variables = {}) => {
    const input = variables.input ?? {}
    const task = workspaceTasks.find(t => t.id === variables.id)

    if (task) {
      if (input.title != null) task.title = input.title
      if (input.note !== undefined) task.note = input.note ?? ''
      if (input.category !== undefined) task.category = input.category
      if (input.urgency != null) task.urgency = input.urgency
      if (input.kind != null) task.kind = input.kind
      if (input.dueDate !== undefined)
        task.dueOffset = input.dueDate ? daysUntil(input.dueDate) : null
      if (input.projectId !== undefined) task.project = input.projectId
      if (input.tag !== undefined) task.tag = input.tag
    }

    // Fall through to the shared Today/board list so its updateTask consumers
    // (project board, today edits) still see the patch in mock mode.
    const todayTask = todayTasks.find(t => t.id === variables.id)

    if (todayTask) {
      for (const [k, v] of Object.entries(input)) {
        if (k === 'effortMinutes' && v != null && v !== '') todayTask[k] = Number(v)
        else todayTask[k] = v
      }
    }

    return { updateTask: task ? { id: task.id } : { id: variables.id } }
  },
  deleteTask: (variables = {}) => {
    const before = workspaceTasks.length
    workspaceTasks = workspaceTasks.filter(t => t.id !== variables.id)
    const idx = todayTasks.findIndex(t => t.id === variables.id)
    if (idx >= 0) todayTasks.splice(idx, 1)
    return { deleteTask: workspaceTasks.length < before || idx >= 0 }
  }
}

/** Whole-day delta from today to an ISO date (YYYY-MM-DD); negative = past. */
function daysUntil(iso) {
  const target = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
