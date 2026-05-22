import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { WREN_MESSAGES_QUERY, SEND_WREN_MESSAGE } from '@/api/operations'

export const useWrenStore = defineStore('wren', () => {
  const messages = ref([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: WREN_MESSAGES_QUERY,
        fetchPolicy: 'network-only'
      })
      messages.value = data.wrenMessages
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function send(text) {
    if (!text || sending.value) return
    sending.value = true

    // Optimistically append the user message
    const optimisticId = `optimistic-${Date.now()}`
    messages.value = [
      ...messages.value,
      { id: optimisticId, sender: 'user', text, actions: [], createdAt: new Date().toISOString() }
    ]

    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_WREN_MESSAGE,
        variables: { text }
      })
      // Append the returned coach message
      messages.value = [...messages.value, data.sendWrenMessage]
    } catch (e) {
      error.value = e.message
      // Remove the optimistic message on failure
      messages.value = messages.value.filter(m => m.id !== optimisticId)
    } finally {
      sending.value = false
    }
  }

  return { messages, loading, sending, error, load, send }
})
