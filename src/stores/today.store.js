/**
 * Today store.
 * Manages the daily view (tasks, schedule, and metadata) for a given date.
 * Exposes actions to load the view, complete individual tasks, and move
 * unfinished tasks forward to the next day.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { TODAY_QUERY, COMPLETE_TASK, MOVE_UNFINISHED } from '@/api/operations'

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
   * @param {string} id - The task ID to complete
   */
  async function completeTask(id) {
    await apolloClient.mutate({ mutation: COMPLETE_TASK, variables: { id } })
    await load(view.value?.date)
  }

  /**
   * Move all unfinished tasks from the current view's date to the next day,
   * then refresh the daily view.
   */
  async function moveUnfinished() {
    if (!view.value) return
    await apolloClient.mutate({
      mutation: MOVE_UNFINISHED,
      variables: { fromDate: view.value.date }
    })
    await load(view.value.date)
  }

  return { view, loading, error, load, completeTask, moveUnfinished }
})
