/** Mock fixtures for the Projects screen and board. */

const projectList = [
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
    // Status enum is on_track | hot | stalled | idle (WEB-W2-26). A finished
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
    order: 0
  },
  {
    id: 'bt2',
    title: 'Design mobile breakpoints',
    note: 'Test on iPhone 14 and Pixel 7',
    tag: 'work',
    done: false,
    columnId: 'col-bl',
    order: 1
  },
  {
    id: 'bt3',
    title: 'Set up Cloudflare Pages deploy',
    note: null,
    tag: 'work',
    done: false,
    columnId: 'col-tw',
    order: 0
  },
  {
    id: 'bt4',
    title: 'Write first blog post draft',
    note: 'Topic: building in public',
    tag: 'work',
    done: false,
    columnId: 'col-tw',
    order: 1
  },
  {
    id: 'bt5',
    title: 'Build project index page',
    note: null,
    tag: 'work',
    done: false,
    columnId: 'col-do',
    order: 0
  },
  {
    id: 'bt6',
    title: 'Register domain name',
    note: null,
    tag: 'work',
    done: true,
    columnId: 'col-dn',
    order: 0
  },
  {
    id: 'bt7',
    title: 'Choose tech stack',
    note: null,
    tag: 'work',
    done: true,
    columnId: 'col-dn',
    order: 1
  }
]

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
    // is exercisable in mock mode (WEB-W2-25). Previously the fixture fell
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
  updateTask: variables => ({
    updateTask: {
      id: variables.id,
      columnId: variables.input?.columnId ?? null
    }
  })
}
