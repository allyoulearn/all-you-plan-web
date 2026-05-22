import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { TODAY_QUERY, COMPLETE_TASK, MOVE_UNFINISHED } from '@/api/operations'

export const useTodayStore = defineStore('today', () => {
  const view = ref(null)
  const loading = ref(false)
  const error = ref('')

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

  async function completeTask(id) {
    await apolloClient.mutate({ mutation: COMPLETE_TASK, variables: { id } })
    await load(view.value?.date)
  }

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
