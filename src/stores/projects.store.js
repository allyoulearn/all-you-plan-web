/**
 * Projects store.
 * Manages the list of projects and the active project board (custom columns).
 * Exposes actions to load projects, load a project board, complete tasks
 * (decoupled from columns), and CRUD/reorder columns and tasks via drag.
 *
 * Error-surfacing policy: load errors set their respective error ref for
 * inline display; mutation errors additionally toast via useErrorToast.
 *
 * Board shape:
 *   board.value = {
 *     project: { ... },
 *     columns: [ { id, label, order } ],
 *     tasksByColumn: [ { columnId, tasks: [ { id, columnId, done, ... } ] } ],
 *   }
 * The two arrays are kept in the order returned by the server; consumers can
 * iterate `columns` and use the helper `tasksFor(columnId)` to read tasks.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  PROJECTS_QUERY,
  PROJECT_BOARD_QUERY,
  COMPLETE_PROJECT_TASK,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  CREATE_TASK,
  CREATE_COLUMN,
  UPDATE_COLUMN,
  REORDER_COLUMNS,
  DELETE_COLUMN,
  MOVE_TASK,
  REORDER_TASKS_IN_COLUMN
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useProjectsStore = defineStore('projects', () => {
  // -- State --
  const projects = ref([])
  const board = ref(null)
  const loadingProjects = ref(false)
  const loadingBoard = ref(false)
  const saving = ref(false)
  const errorProjects = ref('')
  const errorBoard = ref('')

  // -- Helpers --

  /** Build a fresh `tasksByColumn` array preserving column order. */
  function buildTasksByColumn(columns, tasks) {
    const byColumn = new Map(columns.map(col => [col.id, []]))
    for (const task of tasks) {
      const colId = task.columnId
      if (colId && byColumn.has(colId)) byColumn.get(colId).push(task)
    }
    return columns.map(col => ({ columnId: col.id, tasks: byColumn.get(col.id) ?? [] }))
  }

  /**
   * Read the tasks array for `columnId` from board state, or [] when unknown.
   * Views typically render `v-for col in board.columns` then call this for each.
   */
  function tasksFor(columnId) {
    if (!board.value) return []
    const entry = board.value.tasksByColumn?.find(t => t.columnId === columnId)
    return entry?.tasks ?? []
  }

  /** Find a task by id across every column. Returns { task, columnId } or null. */
  function findTask(id) {
    if (!board.value) return null
    for (const { columnId, tasks } of board.value.tasksByColumn ?? []) {
      const task = tasks.find(t => t.id === id)
      if (task) return { task, columnId }
    }
    return null
  }

  // -- Actions --

  async function loadProjects() {
    loadingProjects.value = true
    errorProjects.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECTS_QUERY,
        variables: { includeArchived: false },
        fetchPolicy: 'network-only'
      })
      projects.value = data.projects
    } catch (e) {
      errorProjects.value = e.message
    } finally {
      loadingProjects.value = false
    }
  }

  async function loadBoard(id) {
    loadingBoard.value = true
    errorBoard.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECT_BOARD_QUERY,
        variables: { id },
        fetchPolicy: 'network-only'
      })
      board.value = data.projectBoard
    } catch (e) {
      errorBoard.value = e.message
    } finally {
      loadingBoard.value = false
    }
  }

  /**
   * Toggle a task's `done` flag with an optimistic local update. Decoupled
   * from columns — the task stays in whichever column it was in. Progress
   * counts are recomputed for the project header.
   *
   * No-ops when the board is null, the task id is not present, or the task
   * is already done (idempotent — protects against double clicks while the
   * mutation is in flight).
   * @param {string} id - The task id to complete
   * @throws Re-throws the API error after surfacing it via errorBoard + toast.
   */
  async function completeTask(id) {
    if (!board.value) return
    const found = findTask(id)
    if (!found || found.task.done) return

    const { toastError } = useErrorToast()
    const snapshot = board.value

    const nextTasksByColumn = board.value.tasksByColumn.map(entry => ({
      columnId: entry.columnId,
      tasks: entry.tasks.map(t => (t.id === id ? { ...t, done: true } : t))
    }))
    const next = { ...board.value, tasksByColumn: nextTasksByColumn }
    if (board.value.project?.progress) {
      const total = board.value.project.progress.total ?? 0
      const done = (board.value.project.progress.done ?? 0) + 1
      next.project = {
        ...board.value.project,
        progress: {
          ...board.value.project.progress,
          done,
          percent: total > 0 ? Math.round((done / total) * 100) : 0
        }
      }
    }
    board.value = next

    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to complete task')
      throw e
    } finally {
      saving.value = false
    }
  }

  async function createProject(input) {
    const { toastError } = useErrorToast()
    errorProjects.value = ''
    saving.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PROJECT,
        variables: { name: input.name, tag: input.tag ?? null, blurb: input.blurb ?? null }
      })
      await loadProjects()
      return data.createProject
    } catch (e) {
      errorProjects.value = e.message
      toastError(e, 'Failed to create project')
      throw e
    } finally {
      saving.value = false
    }
  }

  const LIST_VISIBLE_FIELDS = ['name', 'tag', 'status', 'archived', 'blurb']

  async function updateProject(id, input) {
    const { toastError } = useErrorToast()
    errorBoard.value = ''
    errorProjects.value = ''
    saving.value = true
    const boardLoadedForThisProject = board.value?.project?.id === id
    const touchedListField = Object.keys(input ?? {}).some(k => LIST_VISIBLE_FIELDS.includes(k))
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROJECT,
        variables: { id, ...input }
      })
      if (boardLoadedForThisProject) {
        await loadBoard(id)
      }
      if (touchedListField) {
        await loadProjects()
      }
      return data.updateProject
    } catch (e) {
      if (boardLoadedForThisProject) {
        errorBoard.value = e.message
      } else {
        errorProjects.value = e.message
      }
      toastError(e, 'Failed to update project')
      throw e
    } finally {
      saving.value = false
    }
  }

  async function archiveProject(id) {
    return updateProject(id, { archived: true })
  }

  async function deleteProject(id) {
    const { toastError } = useErrorToast()
    errorProjects.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({ mutation: DELETE_PROJECT, variables: { id } })
      if (board.value?.project?.id === id) {
        board.value = null
        errorBoard.value = ''
        loadingBoard.value = false
      }
      await loadProjects()
    } catch (e) {
      errorProjects.value = e.message
      toastError(e, 'Failed to delete project')
      throw e
    } finally {
      saving.value = false
    }
  }

  async function createTask(input) {
    const { toastError } = useErrorToast()
    errorBoard.value = ''
    errorProjects.value = ''
    saving.value = true
    const boardLoadedForThisProject = board.value?.project?.id === input.projectId
    const taskInput = {
      title: input.title,
      projectId: input.projectId
    }
    if (input.note) taskInput.note = input.note
    if (input.tag) taskInput.tag = input.tag
    if (input.scheduledDate) taskInput.scheduledDate = input.scheduledDate
    if (input.columnId) taskInput.columnId = input.columnId
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_TASK,
        variables: { input: taskInput }
      })
      if (boardLoadedForThisProject) {
        await loadBoard(input.projectId)
      }
      return data.createTask
    } catch (e) {
      if (boardLoadedForThisProject) {
        errorBoard.value = e.message
      } else {
        errorProjects.value = e.message
      }
      toastError(e, 'Failed to create task')
      throw e
    } finally {
      saving.value = false
    }
  }

  // -- Column actions --

  /** Append a new column to the active board. */
  async function createColumn(projectId, label) {
    const { toastError } = useErrorToast()
    if (!board.value) return null
    errorBoard.value = ''
    saving.value = true
    const snapshot = board.value
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_COLUMN,
        variables: { projectId, label }
      })
      const col = data.createColumn
      board.value = {
        ...board.value,
        columns: [...board.value.columns, col],
        tasksByColumn: [...board.value.tasksByColumn, { columnId: col.id, tasks: [] }]
      }
      return col
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to create column')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Rename a column. Optimistic. */
  async function renameColumn(id, label) {
    const { toastError } = useErrorToast()
    if (!board.value) return
    const snapshot = board.value
    board.value = {
      ...board.value,
      columns: board.value.columns.map(c => (c.id === id ? { ...c, label } : c))
    }
    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({ mutation: UPDATE_COLUMN, variables: { id, label } })
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to rename column')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Reorder columns by passing a new ordered id list. Used after drag-end on
   * the outer kanban (column-level) Sortable.
   */
  async function reorderColumns(projectId, columnIds) {
    const { toastError } = useErrorToast()
    if (!board.value) return
    const snapshot = board.value
    const byId = new Map(board.value.columns.map(c => [c.id, c]))
    const nextColumns = columnIds.map(id => byId.get(id)).filter(Boolean)
    const tasksMap = new Map(board.value.tasksByColumn.map(t => [t.columnId, t]))
    const nextTasksByColumn = columnIds
      .map(id => tasksMap.get(id) ?? { columnId: id, tasks: [] })
      .filter(Boolean)
    board.value = { ...board.value, columns: nextColumns, tasksByColumn: nextTasksByColumn }
    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: REORDER_COLUMNS,
        variables: { projectId, columnIds }
      })
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to reorder columns')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete a column, with `mode` either 'move' (tasks land in another column)
   * or 'delete' (tasks are removed too). On success, the board reloads so
   * progress + columns + tasks all reflect server state.
   */
  async function deleteColumn(id, mode, moveToColumnId) {
    const { toastError } = useErrorToast()
    if (!board.value) return
    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: DELETE_COLUMN,
        variables: { id, mode, moveToColumnId: moveToColumnId ?? null }
      })
      if (board.value?.project?.id) {
        await loadBoard(board.value.project.id)
      }
    } catch (e) {
      errorBoard.value = e.message
      toastError(e, 'Failed to delete column')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Move a task between columns (or within the same column at a new position).
   * The caller passes the post-drag `nextTasksByColumn`; we persist it and
   * roll back on error. When the move crosses columns, both source and
   * destination get their order list flushed so neighbours collapse cleanly.
   */
  async function moveTask(taskId, fromColumnId, toColumnId, toIndex, nextTasksByColumn) {
    const { toastError } = useErrorToast()
    if (!board.value) return
    const snapshot = board.value
    board.value = { ...board.value, tasksByColumn: nextTasksByColumn }
    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: MOVE_TASK,
        variables: { id: taskId, columnId: toColumnId, order: toIndex }
      })
      if (fromColumnId !== toColumnId) {
        const srcEntry = nextTasksByColumn.find(t => t.columnId === fromColumnId)
        if (srcEntry && srcEntry.tasks.length > 0) {
          await apolloClient.mutate({
            mutation: REORDER_TASKS_IN_COLUMN,
            variables: {
              columnId: fromColumnId,
              taskIds: srcEntry.tasks.map(t => t.id)
            }
          })
        }
      }
      const tgtEntry = nextTasksByColumn.find(t => t.columnId === toColumnId)
      if (tgtEntry && tgtEntry.tasks.length > 1) {
        await apolloClient.mutate({
          mutation: REORDER_TASKS_IN_COLUMN,
          variables: {
            columnId: toColumnId,
            taskIds: tgtEntry.tasks.map(t => t.id)
          }
        })
      }
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to move task')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Persist a within-column reorder. */
  async function reorderTasksInColumn(columnId, taskIds, nextTasksByColumn) {
    const { toastError } = useErrorToast()
    if (!board.value) return
    const snapshot = board.value
    board.value = { ...board.value, tasksByColumn: nextTasksByColumn }
    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: REORDER_TASKS_IN_COLUMN,
        variables: { columnId, taskIds }
      })
    } catch (e) {
      board.value = snapshot
      errorBoard.value = e.message
      toastError(e, 'Failed to reorder tasks')
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    projects,
    board,
    loadingProjects,
    loadingBoard,
    saving,
    errorProjects,
    errorBoard,
    loadProjects,
    loadBoard,
    completeTask,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    createTask,
    createColumn,
    renameColumn,
    reorderColumns,
    deleteColumn,
    moveTask,
    reorderTasksInColumn,
    tasksFor,
    findTask,
    buildTasksByColumn
  }
})
