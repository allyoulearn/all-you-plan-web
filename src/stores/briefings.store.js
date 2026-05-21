import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { GET_TODAY_BRIEFING, GET_BRIEFING, GENERATE_BRIEFING } from '@/api/operations'

export const useBriefingsStore = defineStore('briefings', () => {
  const todayBriefing = ref(null)
  const loading = ref(false)

  async function fetchTodayBriefing() {
    loading.value = true
    try {
      const { data } = await apolloClient.query({
        query: GET_TODAY_BRIEFING,
        fetchPolicy: 'network-only',
      })
      todayBriefing.value = data.todayBriefing
      return data.todayBriefing
    } finally {
      loading.value = false
    }
  }

  async function fetchBriefing(date) {
    const { data } = await apolloClient.query({
      query: GET_BRIEFING,
      variables: { date },
    })
    return data.briefing
  }

  async function generateBriefing() {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERATE_BRIEFING,
      })
      todayBriefing.value = data.generateBriefing
      return data.generateBriefing
    } finally {
      loading.value = false
    }
  }

  return {
    todayBriefing,
    loading,
    fetchTodayBriefing,
    fetchBriefing,
    generateBriefing,
  }
})
