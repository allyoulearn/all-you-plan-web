/**
 * Onboarding store. Tracks wizard step, mode pick, tone, and completion.
 * Auth store reads onboardedAt off `me` to decide whether to surface the wizard.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import {
  ONBOARDING_STATE_QUERY,
  UPDATE_ONBOARDING,
  COMPLETE_ONBOARDING,
  RESTART_ONBOARDING
} from '@/api/operations/index.js'

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref(null)
  const loading = ref(false)
  const error = ref('')

  const step = computed(() => state.value?.step ?? 1)
  const tone = computed(() => state.value?.tone ?? 'warm')
  const mode = computed(() => state.value?.mode ?? null)
  const done = computed(() => !!state.value?.onboardedAt)

  /**
   * Fetch the current onboarding state from the API. A failed initial load is
   * surfaced inline via `error` (per the WEB-T09-003 convention for passive
   * loads) rather than thrown, so the wizard degrades to a retryable error
   * card instead of a blank screen.
   */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: ONBOARDING_STATE_QUERY,
        fetchPolicy: 'network-only'
      })

      state.value = data.onboardingState
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Patch the current onboarding state (step, mode, tone, etc.). On failure a
   * toast is shown and the error re-thrown so the caller can avoid advancing.
   * @param {object} input
   */
  async function update(input) {
    const { toastError } = useErrorToast()
    loading.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ONBOARDING,
        variables: { input }
      })

      state.value = data.updateOnboarding
    } catch (e) {
      toastError(e, "Couldn't save your progress — please try again.")
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark onboarding as complete server-side and update local state. On failure
   * a toast is shown and the error re-thrown so the caller does not redirect.
   */
  async function complete() {
    const { toastError } = useErrorToast()
    loading.value = true

    try {
      const { data } = await apolloClient.mutate({ mutation: COMPLETE_ONBOARDING })
      state.value = data.completeOnboarding
    } catch (e) {
      toastError(e, "Couldn't finish setup — please try again.")
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Restart onboarding so the wizard surfaces again. */
  async function restart() {
    await apolloClient.mutate({ mutation: RESTART_ONBOARDING })
    state.value = { ...(state.value ?? {}), onboardedAt: null, step: 1 }
  }

  return { state, loading, error, step, tone, mode, done, load, update, complete, restart }
})
