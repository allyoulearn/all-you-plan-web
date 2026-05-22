import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { CHORES_QUERY, COMPLETE_CHORE } from '@/api/operations'

export const useChoresStore = defineStore('chores', () => {
  const chores = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: CHORES_QUERY,
        fetchPolicy: 'network-only'
      })
      chores.value = data.chores
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function completeChore(id) {
    await apolloClient.mutate({ mutation: COMPLETE_CHORE, variables: { id } })
    await load()
  }

  return { chores, loading, error, load, completeChore }
})
