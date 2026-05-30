/**
 * Notifications store. Holds the matrix of category-x-channel toggles, quiet
 * hours, devices, and permission state.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  NOTIFICATION_SETTINGS_QUERY,
  UPDATE_NOTIFICATION_SETTINGS,
  UPDATE_NOTIFICATION_PREFERENCE,
  REVOKE_DEVICE
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const settings = ref(null)
  const devices = ref([])
  const loading = ref(false)
  const error = ref('')

  /** Fetch notification settings + registered devices from the API. */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: NOTIFICATION_SETTINGS_QUERY,
        fetchPolicy: 'network-only'
      })

      settings.value = data.notificationSettings
      devices.value = data.notificationDevices
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Patch top-level notification settings (quiet hours, channels, etc.).
   * @param {object} input
   */
  async function updateSettings(input) {
    const { toastError } = useErrorToast()

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_NOTIFICATION_SETTINGS,
        variables: { input }
      })

      if (settings.value) Object.assign(settings.value, data.updateNotificationSettings)
    } catch (e) {
      toastError(e, 'Failed to save')
      throw e
    }
  }

  /**
   * Toggle a single category preference (e.g. enabling 'reminders' over push).
   * @param {string} categoryId
   * @param {object} patch - Partial preference fields to merge.
   */
  async function updatePreference(categoryId, patch) {
    const { toastError } = useErrorToast()

    try {
      await apolloClient.mutate({
        mutation: UPDATE_NOTIFICATION_PREFERENCE,
        variables: { input: { categoryId, ...patch } }
      })

      if (settings.value) {
        settings.value.preferences = settings.value.preferences.map(p =>
          p.categoryId === categoryId ? { ...p, ...patch } : p
        )
      }
    } catch (e) {
      toastError(e, 'Failed to save toggle')
      throw e
    }
  }

  /**
   * Revoke a registered device and remove it from the local list.
   * @param {string} id
   */
  async function revokeDevice(id) {
    await apolloClient.mutate({ mutation: REVOKE_DEVICE, variables: { id } })
    devices.value = devices.value.filter(d => d.id !== id)
  }

  return { settings, devices, loading, error, load, updateSettings, updatePreference, revokeDevice }
})
