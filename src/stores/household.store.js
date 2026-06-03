/**
 * Household store.
 * Loads the current household, its pending invitations, and the activity feed,
 * and exposes the full mutation surface (create / invite / cancel / accept /
 * decline / leave / remove). Mirrors the mobile store
 * (`all-you-plan-mobile/src/stores/household.store.ts`) — including its
 * 5-state derivation — adapted to the web's Pinia + Composition API
 * conventions (see chores.store.js).
 *
 * The derived `state` (solo | sent | received | active | partnerLeft) drives
 * which block HouseholdView renders. Permissions are flat: there is no role
 * field on a member, so any member can remove another (you never remove
 * yourself — you leave instead).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  HOUSEHOLD_QUERY,
  CREATE_HOUSEHOLD,
  INVITE_TO_HOUSEHOLD,
  CANCEL_HOUSEHOLD_INVITATION,
  ACCEPT_HOUSEHOLD_INVITATION,
  DECLINE_HOUSEHOLD_INVITATION,
  LEAVE_HOUSEHOLD,
  REMOVE_FROM_HOUSEHOLD
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

/** Invitation statuses that are still "live" (not resolved/closed). */
const PENDING = 'pending'

export const useHouseholdStore = defineStore('household', () => {
  // -- State --
  const household = ref(null)
  const invitations = ref([])
  const activity = ref([])
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`).
  const saving = ref(false)
  const error = ref('')

  // -- Getters --

  /** The current user's member record, if they belong to a household. */
  const youMember = computed(() => household.value?.members?.find(m => m.isYou) ?? null)

  /** Pending invitations only (the API may return resolved ones too). */
  const pendingInvitations = computed(() => invitations.value.filter(inv => inv.status === PENDING))

  /**
   * Derived screen state, in priority order:
   *  - active:      you're in a household with at least one other member.
   *  - partnerLeft: you're in a household but you're the only member left
   *                 (your partner left; shared items reverted to private).
   *  - received:    a pending invitation is addressed to you (someone else
   *                 sent it) and you have no household.
   *  - sent:        you sent a pending invitation and have no household.
   *  - solo:        none of the above — you're flying solo.
   * @returns {'solo'|'sent'|'received'|'active'|'partnerLeft'}
   */
  const state = computed(() => {
    const members = household.value?.members ?? []

    if (household.value && members.length > 1) return 'active'
    if (household.value && youMember.value && members.length === 1) return 'partnerLeft'

    const pending = pendingInvitations.value
    // An invitation you received has `invitedBy` naming someone other than you;
    // one you sent is flagged `invitedBy === 'you'` by the API. Treat a missing
    // flag as "sent" so a lone outbound invite never strands the screen.
    const received = pending.find(inv => inv.invitedBy && inv.invitedBy !== 'you')
    if (received) return 'received'
    if (pending.length > 0) return 'sent'

    return 'solo'
  })

  // -- Actions --

  /**
   * Fetch the household, its pending invitations, and the activity feed in a
   * single query and replace local state.
   */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: HOUSEHOLD_QUERY,
        fetchPolicy: 'network-only'
      })

      household.value = data.household ?? null
      invitations.value = data.householdInvitations ?? []
      activity.value = data.householdActivity ?? []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a household with the given name, then refresh so members/activity
   * reflect the new household.
   * @param {string} name
   * @returns {Promise<object>} The created household.
   * @throws Re-throws the API error after showing an error toast.
   */
  async function createHousehold(name) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_HOUSEHOLD,
        variables: { name }
      })

      await load()
      return data.createHousehold
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to create household')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Invite a person by email and append the new pending invitation to the
   * local list.
   * @param {string} email
   * @returns {Promise<object>} The created invitation.
   * @throws Re-throws the API error after showing an error toast.
   */
  async function invite(email) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: INVITE_TO_HOUSEHOLD,
        variables: { email }
      })

      if (data?.inviteToHousehold) {
        invitations.value = [...invitations.value, data.inviteToHousehold]
      }

      return data?.inviteToHousehold ?? null
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to send invitation')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Cancel a pending invitation you sent and drop it from the local list.
   * @param {string} id
   * @throws Re-throws the API error after showing an error toast.
   */
  async function cancelInvitation(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: CANCEL_HOUSEHOLD_INVITATION, variables: { id } })
      invitations.value = invitations.value.filter(inv => inv.id !== id)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to cancel invitation')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Accept an invitation addressed to you, then refresh so the joined
   * household, members, and activity load.
   * @param {string} id
   * @returns {Promise<object>} The joined household.
   * @throws Re-throws the API error after showing an error toast.
   */
  async function acceptInvitation(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: ACCEPT_HOUSEHOLD_INVITATION,
        variables: { id }
      })

      await load()
      return data?.acceptHouseholdInvitation ?? null
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to accept invitation')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Decline an invitation addressed to you and drop it from the local list.
   * @param {string} id
   * @throws Re-throws the API error after showing an error toast.
   */
  async function declineInvitation(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DECLINE_HOUSEHOLD_INVITATION, variables: { id } })
      invitations.value = invitations.value.filter(inv => inv.id !== id)
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to decline invitation')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Leave the household. On success clears local household/invitations/activity
   * so the screen falls back to the solo state.
   * @throws Re-throws the API error after showing an error toast.
   */
  async function leave() {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: LEAVE_HOUSEHOLD })
      household.value = null
      invitations.value = []
      activity.value = []
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to leave household')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Remove another member by userId and filter them out of the local member
   * list.
   * @param {string} userId
   * @throws Re-throws the API error after showing an error toast.
   */
  async function removeMember(userId) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({
        mutation: REMOVE_FROM_HOUSEHOLD,
        variables: { userId }
      })

      if (household.value) {
        household.value = {
          ...household.value,
          members: household.value.members.filter(m => m.userId !== userId)
        }
      }
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to remove member')
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    household,
    invitations,
    activity,
    loading,
    saving,
    error,
    youMember,
    pendingInvitations,
    state,
    load,
    createHousehold,
    invite,
    cancelInvitation,
    acceptInvitation,
    declineInvitation,
    leave,
    removeMember
  }
})
