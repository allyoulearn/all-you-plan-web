import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient, setAccessToken, refreshAccessToken } from '@/api/apollo'
import {
  LOGIN,
  REGISTER,
  LOGOUT,
  UPDATE_PROFILE,
  FORGOT_PASSWORD,
  RESET_PASSWORD
} from '@/api/operations'
import { useErrorToast } from '@/composables/useErrorToast'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('ayp_user') || 'null'))
  const accessToken = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!accessToken.value)
  const userName = computed(() => user.value?.name || '')

  function setAuth(payload) {
    accessToken.value = payload.accessToken
    setAccessToken(payload.accessToken)
    user.value = payload.user
    localStorage.setItem('ayp_user', JSON.stringify(payload.user))
  }

  function clearAuth() {
    accessToken.value = null
    setAccessToken(null)
    user.value = null
    localStorage.removeItem('ayp_user')
  }

  async function login(email, password) {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { email, password }
      })
      setAuth(data.login)
      return data.login
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, name) {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER,
        variables: { email, password, name }
      })
      setAuth(data.register)
      return data.register
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await apolloClient.mutate({ mutation: LOGOUT })
    } catch {
      // Ignore errors on logout
    }
    clearAuth()
  }

  async function tryRestoreSession() {
    try {
      const result = await refreshAccessToken()
      setAuth(result)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

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

  async function forgotPassword(email) {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: FORGOT_PASSWORD,
        variables: { email }
      })
      return data.forgotPassword
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(token, newPassword) {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: RESET_PASSWORD,
        variables: { token, newPassword }
      })
      setAuth(data.resetPassword)
      return data.resetPassword
    } finally {
      loading.value = false
    }
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
    resetPassword
  }
})
