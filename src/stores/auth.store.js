/**
 * Authentication store.
 * Manages the in-memory access token, the persisted user object, and all
 * auth-related API calls: login, register, logout, session restore, profile
 * updates, and password-reset flows.
 *
 * The access token is kept in memory only (never localStorage) to reduce XSS
 * exposure. The user object is persisted to localStorage under `ayp_user` for
 * UX continuity across page refreshes.
 *
 * Error-surfacing policy (WEB-T09-003 / WEB-T09-004):
 * - login, register, forgotPassword, resetPassword: catch the error into
 *   error.value and re-throw. The calling view renders an inline error
 *   paragraph (preferred for auth forms — gives precise placement near the
 *   submit button). No toast is shown for these flows.
 * - updateProfile, updateSettings: call toastError() and re-throw (these are
 *   triggered from settings controls where no inline error paragraph exists).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient, setAccessToken, refreshAccessToken } from '@/api/apollo.js'
import {
  LOGIN,
  REGISTER,
  LOGOUT,
  ME,
  UPDATE_PROFILE,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  CHANGE_PASSWORD,
  DELETE_ACCOUNT
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { useWrenStore } from '@/stores/wren.store.js'
import { localTimezone } from '@/utils/date.js'

/**
 * Safely read the persisted user object from localStorage.
 * Returns `null` if the entry is missing, corrupted, or in any unexpected
 * shape — clearing the bad entry so the next persist starts clean.
 *
 * The store factory runs at first use (typically inside the router guard
 * before any route resolves). A JSON.parse throw here would crash the app
 * with a blank screen and no in-app recovery.
 * @returns {object|null}
 */
function readPersistedUser() {
  try {
    return JSON.parse(localStorage.getItem('ayp_user') || 'null')
  } catch {
    try {
      localStorage.removeItem('ayp_user')
    } catch {
      // Storage unavailable (private mode, quota) — nothing to clean up.
    }

    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // -- State --
  const user = ref(readPersistedUser())
  const accessToken = ref(null)
  const loading = ref(false)
  const error = ref('')

  // -- Getters --

  /** @returns {boolean} Whether the user holds a valid in-memory access token */
  const isAuthenticated = computed(() => !!accessToken.value)

  /** @returns {string} The user's display name, or an empty string when not signed in */
  const userName = computed(() => user.value?.name || '')

  // -- Actions --

  /**
   * Persist a new session. Stores the access token in memory and writes the
   * user object to localStorage.
   * @param {{ accessToken: string, user: object }} payload
   */
  function setAuth(payload) {
    accessToken.value = payload.accessToken
    setAccessToken(payload.accessToken)
    user.value = payload.user
    localStorage.setItem('ayp_user', JSON.stringify(payload.user))
  }

  /**
   * Wipe all auth state from memory and localStorage. Also resets the wren
   * store so a re-login does not inherit the previous user's cached
   * conversation id, message history, or in-flight stream subscription
   *. Pinia stores are imported lazily here to avoid a
   * module-level circular dependency between auth and wren.
   */
  function clearAuth() {
    accessToken.value = null
    setAccessToken(null)
    user.value = null
    localStorage.removeItem('ayp_user')
    // Drop cached query data so a re-login or a returning visitor never paints
    // the previous user's data on the next navigation. clearStore() can throw
    // when in-flight queries are aborted — swallow because local logout must
    // not be blocked by a cache hiccup.
    apolloClient.clearStore().catch(() => {})

    useWrenStore().reset()
  }

  /**
   * Authenticate with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} The auth payload (accessToken + user)
   */
  async function login(email, password) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { email, password }
      })

      setAuth(data.login)
      return data.login
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Register a new user account.
   * @param {string} email
   * @param {string} password
   * @param {string} name - Display name
   * @returns {Promise<Object>} The auth payload (user is auto-logged in)
   */
  async function register(email, password, name) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER,
        variables: { email, password, name }
      })

      setAuth(data.register)
      return data.register
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Log out the current user.
   * Fires the server-side LOGOUT mutation to invalidate the refresh cookie,
   * then wipes local state. Mutation failures do not prevent local logout so
   * the user is never stuck — but they are logged in dev so the
   * "appears-logged-out-while-still-valid-server-side" case is diagnosable
   *.
   */
  async function logout() {
    try {
      await apolloClient.mutate({ mutation: LOGOUT })
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[auth] server-side logout failed:', e?.message)
      }
    }

    clearAuth()
  }

  /**
   * Attempt to restore a previous session using the stored refresh token.
   * Failures are logged in dev so legitimate breakage (server down, refresh
   * endpoint schema drift) is diagnosable — silent in production so an
   * expected expired-token return does not pollute the console.
   * @returns {Promise<boolean>} `true` when the session was restored, `false` otherwise
   */
  async function tryRestoreSession() {
    try {
      const result = await refreshAccessToken()
      setAuth(result)
      return true
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[auth] session restore failed:', e?.message)
      }

      clearAuth()
      return false
    }
  }

  /**
   * Update the current user's profile fields.
   * @param {object} updates - Partial profile fields to persist
   * @throws Re-throws the API error after showing an error toast
   */
  async function updateProfile(updates) {
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: updates
      })

      user.value = data.updateProfile
      localStorage.setItem('ayp_user', JSON.stringify(data.updateProfile))
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to update profile')
      throw e
    }
  }

  /**
   * Persist a partial settings update. Only the supplied keys are sent — the
   * backend resolver applies them with dotted `$set` paths, so re-sending the
   * current snapshot would be both redundant and harmful: Apollo decorates
   * cached results with `__typename`, and forwarding that into
   * `UpdateSettingsInput` fails GraphQL validation with a 400.
   * @param {object} partial - Key/value pairs to update in `user.settings`
   * @throws Re-throws the API error after showing an error toast
   */
  async function updateSettings(partial) {
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: { settings: partial }
      })

      user.value = data.updateProfile
      localStorage.setItem('ayp_user', JSON.stringify(data.updateProfile))
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to update settings')
      throw e
    }
  }

  /**
   * Request a password-reset email for the given address.
   * @param {string} email
   * @returns {Promise<Object>} API response (success flag / message)
   */
  async function forgotPassword(email) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: FORGOT_PASSWORD,
        variables: { email }
      })

      return data.forgotPassword
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Change the current user's password.
   * Server-side mutation only — no local state mutation is needed because the
   * password itself is never stored client-side. Surfaces errors inline (the
   * SettingsView renders the error string near the submit button), matching
   * the policy used for login/reset/forgot password flows.
   * @param {string} currentPassword - The user's existing password
   * @param {string} newPassword - The replacement password
   * @returns {Promise<boolean>} True on success
   */
  async function changePassword(currentPassword, newPassword) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: CHANGE_PASSWORD,
        variables: { currentPassword, newPassword }
      })

      return data.changePassword
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Set a new password using a reset token received by email.
   * @param {string} token - One-time token from the reset email
   * @param {string} newPassword - The new password to set
   * @returns {Promise<Object>} The auth payload (user is auto-logged in)
   */
  async function resetPassword(token, newPassword) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: RESET_PASSWORD,
        variables: { token, newPassword }
      })

      setAuth(data.resetPassword)
      return data.resetPassword
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Permanently delete the signed-in user's account. The server requires the
   * caller to re-type their email as a guard against accidental clicks; we
   * forward the value as-is. On success we wipe local auth (so the SPA
   * navigates to the login screen with a clean slate) and let the caller
   * route. Errors are re-thrown so the view can show its own toast — no
   * second toast from the store, matching the policy used for login/register.
   * @param {string} emailConfirmation - Email the user typed in the confirm box
   * @returns {Promise<boolean>} Server result (true on success)
   */
  async function deleteAccount(emailConfirmation) {
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_ACCOUNT,
        variables: { emailConfirmation }
      })

      clearAuth()
      return data?.deleteAccount ?? true
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  /**
   * Re-fetch the current user from the server and update the persisted store.
   * Used by BillingSuccessView to poll for the Stripe webhook landing the new
   * subscription tier on the User doc. Network/auth blips are swallowed so a
   * caller's polling loop can retry — the boolean return tells the caller
   * whether the refresh actually populated `user`.
   * @returns {Promise<boolean>} True when `user` was refreshed from the server
   */
  async function refreshMe() {
    try {
      const { data } = await apolloClient.query({
        query: ME,
        fetchPolicy: 'network-only'
      })

      if (!data?.me) return false
      user.value = data.me

      try {
        localStorage.setItem('ayp_user', JSON.stringify(data.me))
      } catch {
        // Storage unavailable; non-fatal — server state is the truth.
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Development-only sign-in. Establishes a mock authenticated session with
   * no API call, so the authenticated app can be reached without a running
   * backend. Pinned to dev-with-mocks only — staging/preview builds that
   * happen to have import.meta.env.DEV true will not expose this entrypoint
   *.
   *
   * The mock user mirrors the shape of the LOGIN payload's UserFields fragment
   * (timezone, streak, full default settings) so any view that reads them sees
   * realistic values rather than undefined.
   */
  function devLogin() {
    if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') return
    const timezone = localTimezone('UTC')

    setAuth({
      accessToken: 'dev-mock-token',
      user: {
        id: 'dev-user',
        name: 'Dev Tester',
        email: 'dev@allyouplan.test',
        timezone,
        streak: { current: 0, best: 0, lastCompletionDate: null },
        settings: {
          theme: 'default',
          mode: 'auto',
          density: 'comfortable',
          coachPersonality: 'gentle',
          checkIns: ['morning'],
          stalledNudgeDays: 7,
          journalVisibility: 'private'
        }
      }
    })
  }

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    userName,
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    tryRestoreSession,
    updateProfile,
    updateSettings,
    forgotPassword,
    resetPassword,
    changePassword,
    deleteAccount,
    refreshMe,
    devLogin
  }
})
