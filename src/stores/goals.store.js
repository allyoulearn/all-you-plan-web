/**
 * Goals store. CRUD + rollup metadata for top-level goals.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { GOALS_QUERY, CREATE_GOAL, UPDATE_GOAL, ARCHIVE_GOAL } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref([])
  const loading = ref(false)
  const error = ref('')

  /** Fetch all goals from the API and replace the local list. */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: GOALS_QUERY,
        fetchPolicy: 'network-only'
      })

      goals.value = data.goals
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new goal and append it to the local list.
   * @param {object} input - Goal create payload accepted by CREATE_GOAL.
   * @returns {Promise<object>} The created goal.
   */
  async function create(input) {
    const { toastError } = useErrorToast()

    try {
      const { data } = await apolloClient.mutate({ mutation: CREATE_GOAL, variables: { input } })
      goals.value = [...goals.value, data.createGoal]
      return data.createGoal
    } catch (e) {
      toastError(e, 'Failed to create goal')
      throw e
    }
  }

  /**
   * Update an existing goal and replace it in the local list.
   * @param {string} id
   * @param {object} input
   * @returns {Promise<object>} The updated goal.
   */
  async function update(id, input) {
    const { toastError } = useErrorToast()

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_GOAL,
        variables: { id, input }
      })

      goals.value = goals.value.map(g => (g.id === id ? data.updateGoal : g))
      return data.updateGoal
    } catch (e) {
      toastError(e, 'Failed to update goal')
      throw e
    }
  }

  /**
   * Archive a goal (server-side) and remove it from the local list.
   * @param {string} id
   */
  async function archive(id) {
    const { toastError } = useErrorToast()

    try {
      await apolloClient.mutate({ mutation: ARCHIVE_GOAL, variables: { id } })
      goals.value = goals.value.filter(g => g.id !== id)
    } catch (e) {
      toastError(e, 'Failed to archive goal')
      throw e
    }
  }

  return { goals, loading, error, load, create, update, archive }
})
