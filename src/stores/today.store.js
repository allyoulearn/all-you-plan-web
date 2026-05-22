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
import { TODAY_QUERY, COMPLETE_TASK, MOVE_UNFINISHED } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useTodayStore = defineStore('today', () => {
  // -- State --
  const view = ref(null)
  const loading = ref(false)
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
   * @param {string} id - The task ID to complete
   */
  async function completeTask(id) {
    const { toastError } = useErrorToast()
    const currentDate = view.value?.date
    if (!currentDate) return
    try {
      await apolloClient.mutate({ mutation: COMPLETE_TASK, variables: { id } })
      await load(currentDate)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to complete task')
    }
  }

  /**
   * Move all unfinished tasks from the current view's date to the next day,
   * then refresh the daily view.
   * Captures the current date before awaiting so the reload uses the correct
   * date even if view is cleared during the async operation.
   */
  async function moveUnfinished() {
    if (!view.value) return
    const { toastError } = useErrorToast()
    const currentDate = view.value.date
    try {
      await apolloClient.mutate({
        mutation: MOVE_UNFINISHED,
        variables: { fromDate: currentDate }
      })
      await load(currentDate)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to move unfinished tasks')
    }
  }

  return { view, loading, error, load, completeTask, moveUnfinished }
})
