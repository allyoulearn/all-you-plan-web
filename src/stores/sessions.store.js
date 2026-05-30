/**
 * Sessions store. List active sign-in sessions; revoke individually or all but
 * the current device.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { SESSIONS_QUERY, REVOKE_SESSION, REVOKE_OTHER_SESSIONS } from '@/api/operations/index.js'

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref([])
  const loading = ref(false)

  /** Fetch all active sign-in sessions for the current user. */
  async function load() {
    loading.value = true

    try {
      const { data } = await apolloClient.query({
        query: SESSIONS_QUERY,
        fetchPolicy: 'network-only'
      })

      sessions.value = data.sessions
    } finally {
      loading.value = false
    }
  }

  /**
   * Revoke a specific session and remove it from the local list.
   * @param {string} id
   */
  async function revoke(id) {
    await apolloClient.mutate({ mutation: REVOKE_SESSION, variables: { id } })
    sessions.value = sessions.value.filter(s => s.id !== id)
  }

  /** Revoke all sessions except the current device's. */
  async function revokeOthers() {
    await apolloClient.mutate({ mutation: REVOKE_OTHER_SESSIONS })
    sessions.value = sessions.value.filter(s => s.current)
  }

  return { sessions, loading, load, revoke, revokeOthers }
})
