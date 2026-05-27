/**
 * Review store.
 * Manages the daily review record for a given date, including mood and
 * reflection responses. Exposes actions to load and save the review.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { DAILY_REVIEW_QUERY, SAVE_DAILY_REVIEW } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { diffLeftovers } from '@/components/review/leftoverDiff.js'

export const useReviewStore = defineStore('review', () => {
  // -- State --
  const review = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch the daily review record for the given date from the API.
   * @param {string} date - ISO date string (e.g. "2024-05-22")
   */
  async function load(date) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: DAILY_REVIEW_QUERY,
        variables: { date },
        fetchPolicy: 'network-only'
      })

      review.value = data.dailyReview
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Persist the daily review for the given date.
   * @param {string} date - ISO date string (e.g. "2024-05-22")
   * @param {string} mood - Mood rating or label for the day
   * @param {object[]} responses - Array of reflection question/answer pairs
   */
  async function save(date, mood, responses) {
    const { toastError } = useErrorToast()
    saving.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: SAVE_DAILY_REVIEW,
        variables: { date, mood, responses }
      })

      review.value = data.saveDailyReview
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to save review')
      throw e
    } finally {
      saving.value = false
    }
  }

  // Re-exposed for tests; consumers (e.g. ReviewView) import `diffLeftovers`
  // directly from `@/components/review/leftoverDiff.js` so they don't go
  // through Pinia's action-mocking layer.
  return { review, loading, saving, error, load, save, diffLeftovers }
})
