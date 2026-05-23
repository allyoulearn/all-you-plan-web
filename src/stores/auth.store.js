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
  UPDATE_PROFILE,
  FORGOT_PASSWORD,
  RESET_PASSWORD
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

/**
 * Safely read the persisted user object from localStorage.
 * Returns `null` if the entry is missing, corrupted, or in any unexpected
 * shape — clearing the bad entry so the next persist starts clean.
 *
 * The store factory runs at first use (typically inside the router guard
 * before any route resolves). A JSON.parse throw here would crash the app
 * with a blank screen and no in-app recovery (WEB-W1-04).
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
   * Wipe all auth state from memory and localStorage.
   */
  function clearAuth() {
    accessToken.value = null
    setAccessToken(null)
    user.value = null
    localStorage.removeItem('ayp_user')
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
   * (WEB-W1-10).
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
   * expected expired-token return does not pollute the console (WEB-W1-09).
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
   * Merge partial settings into the user's current settings object.
   * @param {object} partial - Key/value pairs to merge into `user.settings`
   * @throws Re-throws the API error after showing an error toast
   */
  async function updateSettings(partial) {
    error.value = ''
    const current = user.value?.settings ?? {}
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: { settings: { ...current, ...partial } }
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
   * Development-only sign-in. Establishes a mock authenticated session with
   * no API call, so the authenticated app can be reached without a running
   * backend. Pinned to dev-with-mocks only — staging/preview builds that
   * happen to have import.meta.env.DEV true will not expose this entrypoint
   * (WEB-W1-22).
   *
   * The mock user mirrors the shape of the LOGIN payload's UserFields fragment
   * (timezone, streak, full default settings) so any view that reads them sees
   * realistic values rather than undefined (WEB-W1-16).
   */
  function devLogin() {
    if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') return
    let timezone = 'UTC'
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      // Older environments without Intl support — fall back to UTC.
    }
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
    devLogin
  }
})
