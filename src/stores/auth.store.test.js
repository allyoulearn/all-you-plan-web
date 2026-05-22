import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    mutate: vi.fn(),
  },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

import { apolloClient, setAccessToken, refreshAccessToken } from '@/api/apollo'

const fakeUser = { id: 'u1', name: 'Ada', email: 'ada@example.com', settings: { theme: 'warm' } }
const fakeToken = 'fake-jwt-token'

describe('auth.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('reads user from localStorage if present', () => {
      localStorage.setItem('ayp_user', JSON.stringify(fakeUser))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.user).toEqual(fakeUser)
    })

    it('isAuthenticated is false before login', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login()', () => {
    it('sets auth state on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')

      expect(store.accessToken).toBe(fakeToken)
      expect(store.user).toEqual(fakeUser)
      expect(store.isAuthenticated).toBe(true)
      expect(setAccessToken).toHaveBeenCalledWith(fakeToken)
      expect(JSON.parse(localStorage.getItem('ayp_user'))).toEqual(fakeUser)
    })

    it('resets loading to false even on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      expect(store.loading).toBe(false)
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('bad credentials'))
      const store = useAuthStore()
      await store.login('ada@example.com', 'bad').catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('logout()', () => {
    it('clears auth state', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')

      apolloClient.mutate.mockResolvedValueOnce({})
      await store.logout()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('ayp_user')).toBeNull()
      expect(setAccessToken).toHaveBeenLastCalledWith(null)
    })

    it('still clears auth even if the logout mutation throws', async () => {
      apolloClient.mutate
        .mockResolvedValueOnce({ data: { login: { accessToken: fakeToken, user: fakeUser } } })
        .mockRejectedValueOnce(new Error('network error'))

      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      await store.logout()

      expect(store.user).toBeNull()
    })
  })

  describe('tryRestoreSession()', () => {
    it('sets auth state and returns true on success', async () => {
      refreshAccessToken.mockResolvedValueOnce({ accessToken: fakeToken, user: fakeUser })
      const store = useAuthStore()
      const result = await store.tryRestoreSession()

      expect(result).toBe(true)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(fakeUser)
    })

    it('clears auth state and returns false on failure', async () => {
      refreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'))
      const store = useAuthStore()
      const result = await store.tryRestoreSession()

      expect(result).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('updateSettings()', () => {
    it('merges partial settings with current settings', async () => {
      const existingUser = { ...fakeUser, settings: { theme: 'warm', mode: 'light' } }
      const updatedUser = { ...existingUser, settings: { theme: 'ink', mode: 'light' } }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProfile: updatedUser } })

      const store = useAuthStore()
      store.user = existingUser

      await store.updateSettings({ theme: 'ink' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { settings: { theme: 'ink', mode: 'light' } },
        }),
      )
      expect(store.user).toEqual(updatedUser)
    })

    it('handles users with no existing settings (defaults to empty object)', async () => {
      const userNoSettings = { ...fakeUser, settings: null }
      const updatedUser = { ...fakeUser, settings: { theme: 'ink' } }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProfile: updatedUser } })

      const store = useAuthStore()
      store.user = userNoSettings

      await store.updateSettings({ theme: 'ink' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { settings: { theme: 'ink' } },
        }),
      )
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useAuthStore()
      store.user = fakeUser

      await expect(store.updateSettings({ theme: 'ink' })).rejects.toThrow('update failed')
      expect(store.error).toBe('update failed')
    })
  })

  describe('updateProfile()', () => {
    it('updates user in state and localStorage', async () => {
      const updatedUser = { ...fakeUser, name: 'Ada Lovelace' }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProfile: updatedUser } })
      const store = useAuthStore()
      store.user = fakeUser
      await store.updateProfile({ name: 'Ada Lovelace' })

      expect(store.user).toEqual(updatedUser)
      expect(JSON.parse(localStorage.getItem('ayp_user'))).toEqual(updatedUser)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('profile update failed'))
      const store = useAuthStore()
      store.user = fakeUser

      await expect(store.updateProfile({ name: 'Bad' })).rejects.toThrow('profile update failed')
      expect(store.error).toBe('profile update failed')
    })
  })

  describe('forgotPassword()', () => {
    it('returns the mutation result', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { forgotPassword: true } })
      const store = useAuthStore()
      const result = await store.forgotPassword('ada@example.com')
      expect(result).toBe(true)
    })

    it('resets loading to false on completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { forgotPassword: true } })
      const store = useAuthStore()
      await store.forgotPassword('ada@example.com')
      expect(store.loading).toBe(false)
    })
  })

  describe('resetPassword()', () => {
    it('sets auth state after a successful reset', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { resetPassword: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.resetPassword('reset-token', 'newpass')

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(fakeUser)
    })

    it('resets loading to false on completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { resetPassword: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.resetPassword('reset-token', 'newpass')
      expect(store.loading).toBe(false)
    })
  })

  describe('userName computed', () => {
    it('returns empty string when user is null', () => {
      const store = useAuthStore()
      expect(store.userName).toBe('')
    })

    it('returns the name from the user object', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } },
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      expect(store.userName).toBe('Ada')
    })
  })
})
