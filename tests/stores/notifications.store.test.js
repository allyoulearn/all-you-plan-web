import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  NOTIFICATION_SETTINGS_QUERY: 'NOTIFICATION_SETTINGS_QUERY',
  UPDATE_NOTIFICATION_SETTINGS: 'UPDATE_NOTIFICATION_SETTINGS',
  UPDATE_NOTIFICATION_PREFERENCE: 'UPDATE_NOTIFICATION_PREFERENCE',
  REVOKE_DEVICE: 'REVOKE_DEVICE'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeSettings = {
  permission: 'granted',
  pushEnabled: true,
  emailEnabled: false,
  inAppEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  dailyBriefingTime: '07:00',
  preferences: [
    { categoryId: 'tasks.due', push: true, email: false, inApp: true },
    { categoryId: 'chores.due', push: false, email: false, inApp: true }
  ]
}

const fakeDevices = [
  {
    id: 'd1',
    label: 'Mac',
    platform: 'web',
    current: true,
    status: 'live',
    lastSeenAt: '2026-05-25'
  },
  {
    id: 'd2',
    label: 'iPhone',
    platform: 'ios',
    current: false,
    status: 'stale',
    lastSeenAt: '2026-05-20'
  }
]

describe('notifications.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts empty', () => {
      const store = useNotificationsStore()
      expect(store.settings).toBeNull()
      expect(store.devices).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates settings + devices on success', async () => {
      apolloClient.query.mockResolvedValueOnce({
        data: { notificationSettings: fakeSettings, notificationDevices: fakeDevices }
      })

      const store = useNotificationsStore()
      await store.load()
      expect(store.settings).toEqual(fakeSettings)
      expect(store.devices).toEqual(fakeDevices)
      expect(store.loading).toBe(false)
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useNotificationsStore()
      await store.load()
      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('updateSettings()', () => {
    it('merges the response into settings on success', async () => {
      const updated = { ...fakeSettings, pushEnabled: false }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateNotificationSettings: updated } })
      const store = useNotificationsStore()
      store.settings = { ...fakeSettings }
      await store.updateSettings({ pushEnabled: false })
      expect(store.settings.pushEnabled).toBe(false)
    })

    it('is a no-op when settings is null but does not throw', async () => {
      const updated = { ...fakeSettings, pushEnabled: false }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateNotificationSettings: updated } })
      const store = useNotificationsStore()
      await store.updateSettings({ pushEnabled: false })
      expect(store.settings).toBeNull()
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('update failed'))
      const store = useNotificationsStore()
      await expect(store.updateSettings({ pushEnabled: false })).rejects.toThrow('update failed')
    })
  })

  describe('updatePreference()', () => {
    it('patches the matching preference', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useNotificationsStore()
      store.settings = { ...fakeSettings, preferences: [...fakeSettings.preferences] }
      await store.updatePreference('tasks.due', { push: false })
      expect(store.settings.preferences.find(p => p.categoryId === 'tasks.due').push).toBe(false)
      expect(store.settings.preferences.find(p => p.categoryId === 'chores.due').push).toBe(false)
    })

    it('sends the right variables', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useNotificationsStore()
      store.settings = { ...fakeSettings, preferences: [...fakeSettings.preferences] }
      await store.updatePreference('tasks.due', { push: false })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { input: { categoryId: 'tasks.due', push: false } }
        })
      )
    })

    it('does not crash when settings is null', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useNotificationsStore()
      await store.updatePreference('tasks.due', { push: false })
      expect(store.settings).toBeNull()
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('pref failed'))
      const store = useNotificationsStore()

      await expect(store.updatePreference('tasks.due', { push: false })).rejects.toThrow(
        'pref failed'
      )
    })
  })

  describe('revokeDevice()', () => {
    it('removes the matching device', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useNotificationsStore()
      store.devices = [...fakeDevices]
      await store.revokeDevice('d2')
      expect(store.devices).toHaveLength(1)
      expect(store.devices[0].id).toBe('d1')
    })
  })
})
