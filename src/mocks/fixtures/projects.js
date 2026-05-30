/** Mock fixtures for the Projects screen and board. */

import { tasks as todayTasks } from './today.js'

let projectList = [
  {
    id: 'p1',
    name: 'Launch personal site',
    tag: 'work',
    status: 'on_track',
    blurb: 'Portfolio and writing hub',
    nudge: null,
    startedOn: '2026-04-01',
    targetOn: '2026-06-01',
    order: 0,
    archived: false,
    progress: { done: 4, total: 10, percent: 40 }
  },
  {
    id: 'p2',
    name: 'Fitness baseline',
    tag: 'health',
    status: 'on_track',
    blurb: 'Build a sustainable movement habit',
    nudge: null,
    startedOn: '2026-03-15',
    targetOn: '2026-07-15',
    order: 1,
    archived: false,
    progress: { done: 6, total: 8, percent: 75 }
  },
  {
    id: 'p3',
    name: 'Read 12 books this year',
    tag: 'learning',
    status: 'on_track',
    blurb: 'One book per month minimum',
    nudge: 'Pick the next book',
    startedOn: '2026-01-01',
    targetOn: '2026-12-31',
    order: 2,
    archived: false,
    progress: { done: 4, total: 12, percent: 33 }
  },
  {
    id: 'p4',
    name: 'Home deep clean',
    tag: 'personal',
    // Status enum is on_track | hot | stalled | idle. A finished
    // project surfaces via `archived: true` once it is wrapped up; the status
    // itself stays `idle` until then.
    status: 'idle',
    blurb: 'Spring cleaning top to bottom',
    nudge: null,
    startedOn: '2026-04-10',
    targetOn: '2026-04-30',
    order: 3,
    archived: false,
    progress: { done: 8, total: 8, percent: 100 }
  }
]

/** Seeded default columns shared across mock projects. */
const boardColumns = [
  { id: 'col-bl', label: 'Backlog', order: 0 },
  { id: 'col-tw', label: 'This week', order: 1 },
  { id: 'col-do', label: 'Doing', order: 2 },
  { id: 'col-dn', label: 'Done', order: 3 }
]

const boardTasks = [
  {
    id: 'bt1',
    title: 'Write about-me page copy',
    note: null,
    tag: 'work',
    done: false,
    columnId: 'col-bl',
    order: 0,
    priority: 'normal',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: 45,
    subtasks: []
  },
  {
    id: 'bt2',
    title: 'Design mobile breakpoints',
    note: 'Test on iPhone 14 and Pixel 7',
    tag: 'work',
    done: false,
    columnId: 'col-bl',
    order: 1,
    priority: 'high',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: null,
    subtasks: [
      { id: 'st1', text: 'Audit existing components', done: true },
      { id: 'st2', text: 'Pick breakpoint values', done: false }
    ]
  },
  {
    id: 'bt3',
    title: 'Set up Cloudflare Pages deploy',
    note: null,
    tag: 'work',
    done: false,
    columnId: 'col-tw',
    order: 0,
    priority: 'urgent',
    scheduledDate: '2026-05-26',
    scheduledTime: null,
    effortMinutes: 30,
    subtasks: []
  },
  {
    id: 'bt4',
    title: 'Write first blog post draft',
    note: 'Topic: building in public',
    tag: 'work',
    done: false,
    columnId: 'col-tw',
    order: 1,
    priority: 'normal',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: 90,
    subtasks: []
  },
  {
    id: 'bt5',
    title: 'Build project index page',
    note: null,
    tag: 'work',
    done: false,
    columnId: 'col-do',
    order: 0,
    priority: 'high',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: null,
    subtasks: []
  },
  {
    id: 'bt6',
    title: 'Register domain name',
    note: null,
    tag: 'work',
    done: true,
    columnId: 'col-dn',
    order: 0,
    priority: 'normal',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: null,
    subtasks: []
  },
  {
    id: 'bt7',
    title: 'Choose tech stack',
    note: null,
    tag: 'work',
    done: true,
    columnId: 'col-dn',
    order: 1,
    priority: 'low',
    scheduledDate: null,
    scheduledTime: null,
    effortMinutes: null,
    subtasks: []
  }
]

/**
 * Group `boardTasks` into per-column buckets matching the projectBoard
 * shape consumed by the projects store.
 * @returns {Array<{ columnId: string, tasks: object[] }>}
 */
function bucketTasks() {
  return boardColumns.map(col => ({
    columnId: col.id,
    tasks: boardTasks.filter(t => t.columnId === col.id)
  }))
}

export const registry = {
  projects: () => ({ projects: projectList }),
  projectBoard: variables => {
    // Return null for unknown ids so the view's "Project not found" branch
    // is exercisable in mock mode. Previously the fixture fell
    // back to projectList[0] which masked the 404 path entirely.
    const project = projectList.find(p => p.id === variables?.id) ?? null
    if (!project) return { projectBoard: null }
    return {
      projectBoard: {
        project,
        columns: boardColumns,
        tasksByColumn: bucketTasks()
      }
    }
  },
  // Column mutations — return shapes matching the new API contract.
  createColumn: variables => ({
    createColumn: {
      id: `col-new-${Date.now()}`,
      label: variables.label,
      order: boardColumns.length
    }
  }),
  updateColumn: variables => ({
    updateColumn: {
      id: variables.id,
      label: variables.label ?? 'Column',
      order: 0
    }
  }),
  reorderColumns: () => ({ reorderColumns: boardColumns }),
  deleteColumn: () => ({ deleteColumn: true }),
  moveTask: variables => ({
    moveTask: {
      id: variables.id,
      columnId: variables.columnId,
      order: variables.order
    }
  }),
  reorderTasksInColumn: () => ({ reorderTasksInColumn: [] }),
  updateTask: variables => {
    // Patch the task in whichever in-memory list owns it. The today mock
    // exports its tasks for this reason — both the projects board and the
    // today view need to see the same edits in mock mode.
    const input = variables.input ?? {}
    const id = variables.id
    const target = boardTasks.find(t => t.id === id) || todayTasks.find(t => t.id === id)

    if (target) {
      for (const [k, v] of Object.entries(input)) {
        // Coerce numeric fields so the form's string inputs land typed.
        if (k === 'effortMinutes' && v != null && v !== '') target[k] = Number(v)
        else target[k] = v
      }
    }

    return {
      updateTask: target ? { ...target } : { id, columnId: input.columnId ?? null }
    }
  },
  addSubtask: variables => {
    const task = boardTasks.find(t => t.id === variables.taskId)
    const subtasks = task ? [...task.subtasks] : []
    const newSubtask = { id: `st-new-${Date.now()}`, text: variables.text ?? '', done: false }
    subtasks.push(newSubtask)
    if (task) task.subtasks = subtasks
    return {
      addSubtask: {
        id: variables.taskId,
        subtasks
      }
    }
  },
  updateSubtask: variables => {
    const task = boardTasks.find(t => t.id === variables.taskId)

    if (task) {
      const subtask = task.subtasks.find(s => s.id === variables.subtaskId)

      if (subtask) {
        if (variables.text !== undefined && variables.text !== null) subtask.text = variables.text
        if (variables.done !== undefined && variables.done !== null) subtask.done = variables.done
      }
    }

    return {
      updateSubtask: {
        id: variables.taskId,
        subtasks: task ? task.subtasks : []
      }
    }
  },
  deleteSubtask: variables => {
    const task = boardTasks.find(t => t.id === variables.taskId)
    if (task) task.subtasks = task.subtasks.filter(s => s.id !== variables.subtaskId)
    return {
      deleteSubtask: {
        id: variables.taskId,
        subtasks: task ? task.subtasks : []
      }
    }
  },
  deleteTask: variables => {
    const id = variables?.id
    const idx = todayTasks.findIndex(t => t.id === id)
    if (idx >= 0) todayTasks.splice(idx, 1)
    return { deleteTask: true }
  },
  createProject: (variables = {}) => {
    const newProject = {
      id: `p-new-${Date.now()}`,
      name: variables.name ?? 'New project',
      tag: variables.tag ?? null,
      status: 'on_track',
      blurb: variables.blurb ?? null,
      nudge: null,
      startedOn: new Date().toISOString().slice(0, 10),
      targetOn: null,
      order: projectList.length,
      archived: false,
      progress: { done: 0, total: 0, percent: 0 }
    }

    projectList = [...projectList, newProject]
    return { createProject: newProject }
  },
  updateProject: (variables = {}) => {
    const project = projectList.find(p => p.id === variables.id)
    if (!project) return { updateProject: null }

    for (const key of [
      'name',
      'tag',
      'status',
      'blurb',
      'nudge',
      'startedOn',
      'targetOn',
      'archived'
    ]) {
      if (variables[key] !== undefined && variables[key] !== null) project[key] = variables[key]
    }

    return {
      updateProject: {
        id: project.id,
        name: project.name,
        tag: project.tag,
        status: project.status,
        blurb: project.blurb,
        nudge: project.nudge,
        startedOn: project.startedOn,
        targetOn: project.targetOn,
        archived: project.archived
      }
    }
  },
  deleteProject: (variables = {}) => {
    const before = projectList.length
    projectList = projectList.filter(p => p.id !== variables.id)
    return { deleteProject: projectList.length < before }
  }
}
