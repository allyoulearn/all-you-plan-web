import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo'
import { GET_NUDGES, MARK_NUDGE_READ, MARK_ALL_NUDGES_READ } from '@/api/operations'

export const useNudgesStore = defineStore('nudges', () => {
  const nudges = ref([])
  const loading = ref(false)

  const unreadCount = computed(() => nudges.value.filter(n => !n.read).length)

  async function fetchNudges(unreadOnly = false) {
    loading.value = true
    try {
      const { data } = await apolloClient.query({
        query: GET_NUDGES,
        variables: { unreadOnly },
        fetchPolicy: 'network-only',
      })
      nudges.value = data.nudges
    } finally {
      loading.value = false
    }
  }

  async function markRead(id) {
    const { data } = await apolloClient.mutate({
      mutation: MARK_NUDGE_READ,
      variables: { id },
    })
    const index = nudges.value.findIndex(n => n.id === id)
    if (index !== -1) {
      nudges.value[index] = data.markNudgeRead
    }
    return data.markNudgeRead
  }

  async function markAllRead() {
    await apolloClient.mutate({ mutation: MARK_ALL_NUDGES_READ })
    nudges.value = nudges.value.map(n => ({ ...n, read: true }))
  }

  return {
    nudges,
    loading,
    unreadCount,
    fetchNudges,
    markRead,
    markAllRead,
  }
})
