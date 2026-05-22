import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { DAILY_REVIEW_QUERY, SAVE_DAILY_REVIEW } from '@/api/operations'

export const useReviewStore = defineStore('review', () => {
  const review = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

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

  async function save(date, mood, responses) {
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
    } finally {
      saving.value = false
    }
  }

  return { review, loading, saving, error, load, save }
})
