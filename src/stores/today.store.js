/**
 * Today store.
 * Manages the daily view (tasks, schedule, and metadata) for a given date.
 * Exposes actions to load the view, complete individual tasks, and move
 * unfinished tasks forward to the next day.
 *
 * Error-surfacing policy: load errors set error.value for inline display;
 * mutation errors additionally toast via useErrorToast.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { TODAY_QUERY, COMPLETE_TASK, MOVE_UNFINISHED, CREATE_TASK } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useTodayStore = defineStore('today', () => {
  // -- State --
  const view = ref(null)
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`). See WEB-W1-11.
  const saving = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch the daily view for the given date from the API.
   * @param {string|null} [date] - ISO date string (e.g. "2024-05-22"). Defaults to today when `null`.
   */
  async function load(date) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: TODAY_QUERY,
        variables: { date: date ?? null },
        fetchPolicy: 'network-only'
      })
      view.value = data.today
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a task as complete, then refresh the current daily view.
   * Captures the current date before awaiting so the reload uses the correct
   * date even if view is cleared during the async operation.
   * Resets `error.value` at the start so stale failures do not persist past a
   * successful mutation (WEB-W1-05 / WEB-W1-13).
   * @param {string} id - The task ID to complete
   * @throws Re-throws the API error after surfacing it via error + toast.
   */
  async function completeTask(id) {
    const { toastError } = useErrorToast()
    const currentDate = view.value?.date
    if (!currentDate) return
    error.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({ mutation: COMPLETE_TASK, variables: { id } })
      await load(currentDate)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to complete task')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Move all unfinished tasks from the current view's date to the next day,
   * then refresh the daily view.
   * Captures the current date before awaiting so the reload uses the correct
   * date even if view is cleared during the async operation.
   * Resets `error.value` at the start (WEB-W1-05 / WEB-W1-13).
   * @throws Re-throws the API error after surfacing it via error + toast.
   */
  async function moveUnfinished() {
    if (!view.value) return
    const { toastError } = useErrorToast()
    const currentDate = view.value.date
    error.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: MOVE_UNFINISHED,
        variables: { fromDate: currentDate }
      })
      await load(currentDate)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to move unfinished tasks')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Create a new task scheduled for the requested date.
   *
   * Date resolution (WEB-W1-20): prefers an explicit `input.scheduledDate`,
   * then the currently-viewed date, then today's local date — so a
   * "schedule for tomorrow" affordance can use this store action.
   *
   * After the mutation resolves, the today view is reloaded only when the
   * new task lands on the currently-viewed date (otherwise the reload would
   * not surface the new task and wastes a round-trip).
   *
   * Only fields with real values are sent — the server's zod schema rejects
   * `null` for optional fields, so omitting them is the safe shape.
   * Resets `error.value` at the start (WEB-W1-05 / WEB-W1-13).
   * @param {{ title: string, scheduledDate?: string, scheduledTime?: string, note?: string, effortMinutes?: number, tag?: string }} input
   * @returns {Promise<object>} Created task
   */
  async function createTask(input) {
    const { toastError } = useErrorToast()
    const today = new Date()
    const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const date = input.scheduledDate ?? view.value?.date ?? localDateString
    const taskInput = { title: input.title, scheduledDate: date }
    if (input.scheduledTime) taskInput.scheduledTime = input.scheduledTime
    if (input.note) taskInput.note = input.note
    if (input.effortMinutes != null) taskInput.effortMinutes = input.effortMinutes
    if (input.tag) taskInput.tag = input.tag
    error.value = ''
    saving.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_TASK,
        variables: { input: taskInput }
      })
      // Only reload when the new task lands on the currently-viewed date.
      if (view.value?.date === date) {
        await load(date)
      }
      return data.createTask
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to add task')
      throw e
    } finally {
      saving.value = false
    }
  }

  return { view, loading, saving, error, load, completeTask, moveUnfinished, createTask }
})
