/**
 * Wren store.
 * Manages the AI coaching conversation with Wren: the message history,
 * loading/sending state, and an optimistic-update pattern so the user's
 * message appears immediately while the API request is in flight.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { WREN_MESSAGES_QUERY, SEND_WREN_MESSAGE } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useWrenStore = defineStore('wren', () => {
  // -- State --
  const messages = ref([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch the full Wren message history from the API and replace the local list.
   */
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

  /**
   * Send a message to Wren. The user's message is appended optimistically
   * before the request completes. On success the returned coach message is
   * appended. On failure the optimistic message is removed.
   * Resets `error.value` at the start (WEB-W1-05 / WEB-W1-13).
   * Trims whitespace from the text and rejects whitespace-only strings so an
   * untrimmed caller (or a direct store call) cannot produce a noise message
   * (WEB-W1-18).
   * @param {string} text - The user's message text
   */
  async function send(text) {
    const trimmed = text?.trim()
    if (!trimmed || sending.value) return
    sending.value = true
    error.value = ''

    // Optimistically append the user message
    const optimisticId = `optimistic-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        id: optimisticId,
        sender: 'user',
        text: trimmed,
        actions: [],
        createdAt: new Date().toISOString()
      }
    ]

    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_WREN_MESSAGE,
        variables: { text: trimmed }
      })
      // Append the returned coach message
      messages.value = [...messages.value, data.sendWrenMessage]
    } catch (e) {
      error.value = e.message
      // Remove the optimistic message on failure
      messages.value = messages.value.filter(m => m.id !== optimisticId)
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to send message')
    } finally {
      sending.value = false
    }
  }

  return { messages, loading, sending, error, load, send }
})
