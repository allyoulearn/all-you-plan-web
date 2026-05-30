/**
 * Onboarding store. Tracks wizard step, mode pick, tone, and completion.
 * Auth store reads onboardedAt off `me` to decide whether to surface the wizard.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  ONBOARDING_STATE_QUERY,
  UPDATE_ONBOARDING,
  COMPLETE_ONBOARDING,
  RESTART_ONBOARDING
} from '@/api/operations/index.js'

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref(null)
  const loading = ref(false)

  const step = computed(() => state.value?.step ?? 1)
  const tone = computed(() => state.value?.tone ?? 'warm')
  const mode = computed(() => state.value?.mode ?? null)
  const done = computed(() => !!state.value?.onboardedAt)

  /** Fetch the current onboarding state from the API. */
  async function load() {
    loading.value = true

    try {
      const { data } = await apolloClient.query({
        query: ONBOARDING_STATE_QUERY,
        fetchPolicy: 'network-only'
      })

      state.value = data.onboardingState
    } finally {
      loading.value = false
    }
  }

  /**
   * Patch the current onboarding state (step, mode, tone, etc.).
   * @param {object} input
   */
  async function update(input) {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_ONBOARDING,
      variables: { input }
    })

    state.value = data.updateOnboarding
  }

  /** Mark onboarding as complete server-side and update local state. */
  async function complete() {
    const { data } = await apolloClient.mutate({ mutation: COMPLETE_ONBOARDING })
    state.value = data.completeOnboarding
  }

  /** Restart onboarding so the wizard surfaces again. */
  async function restart() {
    await apolloClient.mutate({ mutation: RESTART_ONBOARDING })
    state.value = { ...(state.value ?? {}), onboardedAt: null, step: 1 }
  }

  return { state, loading, step, tone, mode, done, load, update, complete, restart }
})
