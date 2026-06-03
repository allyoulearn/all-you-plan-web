/**
 * Tasks workspace store.
 *
 * Owns the unified "plate" of every loose task — one-offs, hard deadlines, and
 * project-linked work — plus the summary counters the urgency strip reads.
 * Grouping (by urgency / category / due date) and category-pill filtering all
 * happen client-side from the flat `tasks` list, exactly as the design
 * prototype does; the API just returns the list + counts.
 *
 * Error-surfacing policy mirrors the other stores: load() catches its own
 * errors into `error` for inline display; mutations additionally toast via
 * useErrorToast and re-throw so callers can keep a dialog open on failure.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  TASK_WORKSPACE_QUERY,
  CREATE_WORKSPACE_TASK,
  UPDATE_WORKSPACE_TASK,
  COMPLETE_WORKSPACE_TASK,
  DELETE_WORKSPACE_TASK
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

/** Fixed urgency order — drives both grouping and within-group sort rank. */
export const URGENCY_ORDER = ['critical', 'high', 'medium', 'low']

/** Ordered category ids; the workspace shows a group/pill per present category. */
export const CATEGORY_ORDER = ['admin', 'music', 'studio', 'health', 'tech', 'home', 'dev']

/** Rank lookup so a task with no urgency still sorts last instead of NaN. */
const URGENCY_RANK = Object.fromEntries(URGENCY_ORDER.map((u, i) => [u, i]))

/** daysLeft sentinel for undated tasks so they sort after every dated one. */
const NO_DATE = 9999

/** daysLeft for a task, defaulting undated tasks to the far-future sentinel. */
function daysLeftOf(task) {
  return task.due ? task.due.daysLeft : NO_DATE
}

/** Sort by urgency rank, then by soonest deadline. Pure; returns a new array. */
function sortByUrgencyThenDue(list) {
  return [...list].sort((a, b) => {
    const ru = (URGENCY_RANK[a.urgency] ?? 99) - (URGENCY_RANK[b.urgency] ?? 99)
    if (ru !== 0) return ru
    return daysLeftOf(a) - daysLeftOf(b)
  })
}

export const useTasksStore = defineStore('tasks', () => {
  // -- State --
  const tasks = ref([])
  const summary = ref(null)
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`).
  const saving = ref(false)
  const error = ref('')
  // When true the workspace also pulls recently-done tasks and reveals them.
  const showDone = ref(false)
  // Active grouping mode: 'urgency' | 'category' | 'due'.
  const groupBy = ref('urgency')
  // Active category-pill filter (a category id) or null for "All".
  const categoryFilter = ref(null)

  // -- Actions --

  /**
   * Fetch the workspace from the API and replace the local list + summary.
   * Passes `includeDone` so the "Show done" toggle controls what the server
   * returns rather than filtering a partial set client-side.
   */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: TASK_WORKSPACE_QUERY,
        variables: { includeDone: showDone.value },
        fetchPolicy: 'network-only'
      })

      tasks.value = data.taskWorkspace.tasks
      summary.value = data.taskWorkspace.summary
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /** Switch the grouping mode. Pure state write; no fetch needed. */
  function setGroupBy(mode) {
    groupBy.value = mode
  }

  /** Set (or clear, with null) the active category-pill filter. */
  function setCategoryFilter(category) {
    categoryFilter.value = category
  }

  /**
   * Flip the "Show done" toggle and reload so the server includes/excludes
   * recently-done tasks. Reloading (rather than client filtering) keeps the
   * summary's doneRecently count honest.
   */
  async function toggleShowDone() {
    showDone.value = !showDone.value
    await load()
  }

  /**
   * Create a task from the workspace composer. Only fields with real values
   * are sent — the API's zod schema rejects null for optional fields, so
   * omitting them is the safe shape. Reloads on success.
   * @param {{ title: string, note?: string, category?: string, urgency?: string, kind?: string, dueDate?: string, projectId?: string, tag?: string }} input
   * @returns {Promise<object>} Created task ref ({ id })
   */
  async function createTask(input) {
    const { toastError } = useErrorToast()
    const taskInput = { title: input.title }
    if (input.note) taskInput.note = input.note
    if (input.category) taskInput.category = input.category
    if (input.urgency) taskInput.urgency = input.urgency
    if (input.kind) taskInput.kind = input.kind
    if (input.dueDate) taskInput.dueDate = input.dueDate
    if (input.projectId) taskInput.projectId = input.projectId
    if (input.tag) taskInput.tag = input.tag
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_WORKSPACE_TASK,
        variables: { input: taskInput }
      })

      await load()
      return data.createTask
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to create task')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Update a task's workspace fields, then reload.
   * @param {string} id
   * @param {object} input - Subset of UpdateTaskInput fields.
   */
  async function updateTask(id, input) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_WORKSPACE_TASK,
        variables: { id, input }
      })

      await load()
      return data.updateTask
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to update task')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Toggle a task's done state, then reload. Re-throws after toasting so the
   * row can roll back its optimistic check if it ever adds one.
   * @param {string} id
   */
  async function completeTask(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: COMPLETE_WORKSPACE_TASK, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to update task')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Delete a task by id, then reload. */
  async function deleteTask(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DELETE_WORKSPACE_TASK, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to delete task')
      throw e
    } finally {
      saving.value = false
    }
  }

  // -- Getters --

  /**
   * The tasks actually shown: hide done unless `showDone`, then apply the
   * active category filter. Done visibility is enforced here too (not only via
   * the server flag) so the list stays correct between a toggle and its reload.
   */
  const visibleTasks = computed(() => {
    let list = tasks.value
    if (!showDone.value) list = list.filter(t => !t.done)
    if (categoryFilter.value) list = list.filter(t => t.category === categoryFilter.value)
    return list
  })

  /**
   * Grouped task lists for the active `groupBy` mode. Each group is
   * `{ key, label, urgency?, count, tasks }`. Empty groups are dropped.
   *
   * - urgency: fixed critical→high→medium→low order, sorted within by
   *   soonest deadline (undated last).
   * - category: one group per present category, tasks sorted by urgency rank
   *   then soonest deadline.
   * - due: two groups — "With a deadline" (dated, soonest first) and
   *   "No date — by urgency" (undated, sorted by urgency).
   */
  const groups = computed(() => {
    const list = visibleTasks.value

    if (groupBy.value === 'category') {
      return CATEGORY_ORDER.map(cat => {
        const items = sortByUrgencyThenDue(list.filter(t => t.category === cat))
        return { key: cat, label: CATEGORY_LABELS[cat] ?? cat, count: items.length, tasks: items }
      }).filter(g => g.count > 0)
    }

    if (groupBy.value === 'due') {
      const dated = list.filter(t => t.due).sort((a, b) => a.due.daysLeft - b.due.daysLeft)
      const undated = sortByUrgencyThenDue(list.filter(t => !t.due))
      return [
        { key: 'dated', label: 'With a deadline', count: dated.length, tasks: dated },
        { key: 'undated', label: 'No date — by urgency', count: undated.length, tasks: undated }
      ].filter(g => g.count > 0)
    }

    // urgency (default)
    return URGENCY_ORDER.map(u => {
      const items = list.filter(t => t.urgency === u).sort((a, b) => daysLeftOf(a) - daysLeftOf(b))

      return { key: u, label: URGENCY_LABELS[u], urgency: u, count: items.length, tasks: items }
    }).filter(g => g.count > 0)
  })

  /**
   * Categories present among the currently-open (or shown) tasks, with counts.
   * Drives the category filter pills. Counts respect `showDone` but ignore the
   * active category filter so every pill stays clickable.
   */
  const categoriesPresent = computed(() => {
    const pool = showDone.value ? tasks.value : tasks.value.filter(t => !t.done)
    return CATEGORY_ORDER.map(cat => ({
      id: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      count: pool.filter(t => t.category === cat).length
    })).filter(c => c.count > 0)
  })

  return {
    // state
    tasks,
    summary,
    loading,
    saving,
    error,
    showDone,
    groupBy,
    categoryFilter,
    // actions
    load,
    setGroupBy,
    setCategoryFilter,
    toggleShowDone,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    // getters
    visibleTasks,
    groups,
    categoriesPresent
  }
})

/** Display labels for the urgency scale (English; no i18n in this map). */
export const URGENCY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
}

/** Display labels for the category buckets. */
export const CATEGORY_LABELS = {
  admin: 'Admin',
  music: 'Music',
  studio: 'Studio',
  health: 'Health',
  tech: 'Tech',
  home: 'Home',
  dev: 'Dev'
}
