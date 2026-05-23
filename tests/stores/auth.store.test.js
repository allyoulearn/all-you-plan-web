import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    mutate: vi.fn()
  },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn()
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
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

    it('has null user when localStorage is empty', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('falls back to null and clears entry when ayp_user is corrupted (WEB-W1-04)', () => {
      // A truncated / hand-edited JSON string would normally throw at parse time
      // and crash the store factory before any route resolves.
      localStorage.setItem('ayp_user', '{"id":"u1",') // invalid JSON
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(localStorage.getItem('ayp_user')).toBeNull()
    })

    it('does not crash when ayp_user is the literal string "undefined"', () => {
      localStorage.setItem('ayp_user', 'undefined')
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('isAuthenticated is false before login', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('loading is false initially', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
    })

    it('error is empty string initially', () => {
      const store = useAuthStore()
      expect(store.error).toBe('')
    })
  })

  describe('setAuth()', () => {
    it('sets accessToken, user, and calls setAccessToken', () => {
      const store = useAuthStore()
      store.setAuth({ accessToken: fakeToken, user: fakeUser })
      expect(store.accessToken).toBe(fakeToken)
      expect(store.user).toEqual(fakeUser)
      expect(setAccessToken).toHaveBeenCalledWith(fakeToken)
      expect(JSON.parse(localStorage.getItem('ayp_user'))).toEqual(fakeUser)
    })
  })

  describe('clearAuth()', () => {
    it('clears accessToken, user, localStorage, and calls setAccessToken(null)', () => {
      const store = useAuthStore()
      store.setAuth({ accessToken: fakeToken, user: fakeUser })
      store.clearAuth()
      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(localStorage.getItem('ayp_user')).toBeNull()
      expect(setAccessToken).toHaveBeenLastCalledWith(null)
    })
  })

  describe('login()', () => {
    it('sets auth state on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')

      expect(store.accessToken).toBe(fakeToken)
      expect(store.user).toEqual(fakeUser)
      expect(store.isAuthenticated).toBe(true)
      expect(setAccessToken).toHaveBeenCalledWith(fakeToken)
      expect(JSON.parse(localStorage.getItem('ayp_user'))).toEqual(fakeUser)
    })

    it('returns the auth payload', async () => {
      const payload = { accessToken: fakeToken, user: fakeUser }
      apolloClient.mutate.mockResolvedValueOnce({ data: { login: payload } })
      const store = useAuthStore()
      const result = await store.login('ada@example.com', 'password')
      expect(result).toEqual(payload)
    })

    it('resets loading to false even on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      expect(store.loading).toBe(false)
    })

    it('sets error.value and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('bad credentials'))
      const store = useAuthStore()

      await expect(store.login('ada@example.com', 'bad')).rejects.toThrow('bad credentials')
      expect(store.error).toBe('bad credentials')
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('bad credentials'))
      const store = useAuthStore()
      await store.login('ada@example.com', 'bad').catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('clears error before each attempt', async () => {
      apolloClient.mutate
        .mockRejectedValueOnce(new Error('first error'))
        .mockResolvedValueOnce({ data: { login: { accessToken: fakeToken, user: fakeUser } } })
      const store = useAuthStore()
      await store.login('ada@example.com', 'bad').catch(() => {})
      expect(store.error).toBe('first error')
      await store.login('ada@example.com', 'good')
      expect(store.error).toBe('')
    })

    it('sends the correct variables to the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'secret')
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { email: 'ada@example.com', password: 'secret' } })
      )
    })
  })

  describe('register()', () => {
    it('sets auth state on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { register: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.register('ada@example.com', 'password', 'Ada')

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(fakeUser)
    })

    it('returns the auth payload', async () => {
      const payload = { accessToken: fakeToken, user: fakeUser }
      apolloClient.mutate.mockResolvedValueOnce({ data: { register: payload } })
      const store = useAuthStore()
      const result = await store.register('ada@example.com', 'password', 'Ada')
      expect(result).toEqual(payload)
    })

    it('sets error.value and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('email taken'))
      const store = useAuthStore()

      await expect(store.register('ada@example.com', 'password', 'Ada')).rejects.toThrow(
        'email taken'
      )
      expect(store.error).toBe('email taken')
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('email taken'))
      const store = useAuthStore()
      await store.register('ada@example.com', 'password', 'Ada').catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('clears error before each attempt', async () => {
      apolloClient.mutate
        .mockRejectedValueOnce(new Error('email taken'))
        .mockResolvedValueOnce({ data: { register: { accessToken: fakeToken, user: fakeUser } } })
      const store = useAuthStore()
      await store.register('ada@example.com', 'password', 'Ada').catch(() => {})
      expect(store.error).toBe('email taken')
      await store.register('new@example.com', 'password', 'New')
      expect(store.error).toBe('')
    })

    it('sends the correct variables to the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { register: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.register('ada@example.com', 'secret', 'Ada')
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { email: 'ada@example.com', password: 'secret', name: 'Ada' }
        })
      )
    })
  })

  describe('logout()', () => {
    it('clears auth state', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } }
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

    it('logs the mutation failure in dev (WEB-W1-10)', async () => {
      vi.stubEnv('DEV', true)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      apolloClient.mutate
        .mockResolvedValueOnce({ data: { login: { accessToken: fakeToken, user: fakeUser } } })
        .mockRejectedValueOnce(new Error('logout failed'))

      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      await store.logout()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[auth] server-side logout failed'),
        'logout failed'
      )
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('does not log mutation failure in production (WEB-W1-10)', async () => {
      vi.stubEnv('DEV', false)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      apolloClient.mutate
        .mockResolvedValueOnce({ data: { login: { accessToken: fakeToken, user: fakeUser } } })
        .mockRejectedValueOnce(new Error('logout failed'))

      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      await store.logout()

      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
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

    it('logs the failure in dev (WEB-W1-09)', async () => {
      vi.stubEnv('DEV', true)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      refreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'))
      const store = useAuthStore()
      await store.tryRestoreSession()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[auth] session restore failed'),
        'Refresh failed'
      )
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('does not log the failure in production (WEB-W1-09)', async () => {
      vi.stubEnv('DEV', false)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      refreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'))
      const store = useAuthStore()
      await store.tryRestoreSession()

      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
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

    it('sets error.value and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('not found'))
      const store = useAuthStore()

      await expect(store.forgotPassword('unknown@example.com')).rejects.toThrow('not found')
      expect(store.error).toBe('not found')
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('not found'))
      const store = useAuthStore()
      await store.forgotPassword('unknown@example.com').catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('clears error before each attempt', async () => {
      apolloClient.mutate
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({ data: { forgotPassword: true } })
      const store = useAuthStore()
      await store.forgotPassword('bad@example.com').catch(() => {})
      expect(store.error).toBe('not found')
      await store.forgotPassword('ada@example.com')
      expect(store.error).toBe('')
    })
  })

  describe('resetPassword()', () => {
    it('sets auth state after a successful reset', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { resetPassword: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.resetPassword('reset-token', 'newpass')

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(fakeUser)
    })

    it('returns the auth payload', async () => {
      const payload = { accessToken: fakeToken, user: fakeUser }
      apolloClient.mutate.mockResolvedValueOnce({ data: { resetPassword: payload } })
      const store = useAuthStore()
      const result = await store.resetPassword('reset-token', 'newpass')
      expect(result).toEqual(payload)
    })

    it('resets loading to false on completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { resetPassword: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.resetPassword('reset-token', 'newpass')
      expect(store.loading).toBe(false)
    })

    it('sets error.value and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('token expired'))
      const store = useAuthStore()

      await expect(store.resetPassword('bad-token', 'newpass')).rejects.toThrow('token expired')
      expect(store.error).toBe('token expired')
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('token expired'))
      const store = useAuthStore()
      await store.resetPassword('bad-token', 'newpass').catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('clears error before each attempt', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('token expired')).mockResolvedValueOnce({
        data: { resetPassword: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.resetPassword('bad-token', 'newpass').catch(() => {})
      expect(store.error).toBe('token expired')
      await store.resetPassword('good-token', 'newpass')
      expect(store.error).toBe('')
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
          variables: { settings: { theme: 'ink', mode: 'light' } }
        })
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
          variables: { settings: { theme: 'ink' } }
        })
      )
    })

    it('persists the updated user to localStorage', async () => {
      const updatedUser = { ...fakeUser, settings: { theme: 'ink' } }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateProfile: updatedUser } })
      const store = useAuthStore()
      store.user = fakeUser

      await store.updateSettings({ theme: 'ink' })

      expect(JSON.parse(localStorage.getItem('ayp_user'))).toEqual(updatedUser)
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

  describe('devLogin()', () => {
    it('is a no-op when DEV is false', () => {
      vi.stubEnv('DEV', false)
      vi.stubEnv('VITE_USE_MOCKS', 'true')
      const store = useAuthStore()
      store.devLogin()
      expect(store.isAuthenticated).toBe(false)
      expect(setAccessToken).not.toHaveBeenCalled()
      vi.unstubAllEnvs()
    })

    it('is a no-op when DEV is true but VITE_USE_MOCKS is not "true" (WEB-W1-22)', () => {
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_USE_MOCKS', 'false')
      const store = useAuthStore()
      store.devLogin()
      expect(store.isAuthenticated).toBe(false)
      expect(setAccessToken).not.toHaveBeenCalled()
      vi.unstubAllEnvs()
    })

    it('sets a dev session with expected user fields when DEV+VITE_USE_MOCKS are true', () => {
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_USE_MOCKS', 'true')
      const store = useAuthStore()
      store.devLogin()
      expect(store.user).toMatchObject({
        id: 'dev-user',
        name: 'Dev Tester',
        email: 'dev@allyouplan.test'
      })
      // WEB-W1-16: mock user mirrors the LOGIN UserFields shape.
      expect(store.user.timezone).toBeTypeOf('string')
      expect(store.user.streak).toEqual({ current: 0, best: 0, lastCompletionDate: null })
      expect(store.user.settings).toMatchObject({
        theme: 'default',
        mode: 'auto',
        density: 'comfortable',
        coachPersonality: 'gentle',
        stalledNudgeDays: 7,
        journalVisibility: 'private'
      })
      expect(Array.isArray(store.user.settings.checkIns)).toBe(true)
      expect(store.accessToken).toBe('dev-mock-token')
      expect(store.isAuthenticated).toBe(true)
      vi.unstubAllEnvs()
    })
  })

  describe('userName computed', () => {
    it('returns empty string when user is null', () => {
      const store = useAuthStore()
      expect(store.userName).toBe('')
    })

    it('returns the name from the user object', async () => {
      apolloClient.mutate.mockResolvedValueOnce({
        data: { login: { accessToken: fakeToken, user: fakeUser } }
      })
      const store = useAuthStore()
      await store.login('ada@example.com', 'password')
      expect(store.userName).toBe('Ada')
    })
  })
})
