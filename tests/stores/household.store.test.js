import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHouseholdStore } from '@/stores/household.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  HOUSEHOLD_QUERY: 'HOUSEHOLD_QUERY',
  CREATE_HOUSEHOLD: 'CREATE_HOUSEHOLD',
  INVITE_TO_HOUSEHOLD: 'INVITE_TO_HOUSEHOLD',
  CANCEL_HOUSEHOLD_INVITATION: 'CANCEL_HOUSEHOLD_INVITATION',
  ACCEPT_HOUSEHOLD_INVITATION: 'ACCEPT_HOUSEHOLD_INVITATION',
  DECLINE_HOUSEHOLD_INVITATION: 'DECLINE_HOUSEHOLD_INVITATION',
  LEAVE_HOUSEHOLD: 'LEAVE_HOUSEHOLD',
  REMOVE_FROM_HOUSEHOLD: 'REMOVE_FROM_HOUSEHOLD'
}))

const mockToastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const you = {
  userId: 'me',
  name: 'Sam',
  initial: 'M',
  joinedAt: '2026-04-04T10:00:00Z',
  isYou: true
}

const partner = {
  userId: 'u2',
  name: 'Jordan',
  initial: 'A',
  joinedAt: '2026-04-12T09:30:00Z',
  isYou: false
}

function envelope({ household = null, invitations = [], activity = [] }) {
  return {
    data: {
      household,
      householdInvitations: invitations,
      householdActivity: activity
    }
  }
}

describe('household.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts solo and empty', () => {
      const store = useHouseholdStore()
      expect(store.household).toBeNull()
      expect(store.invitations).toEqual([])
      expect(store.activity).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.saving).toBe(false)
      expect(store.error).toBe('')
      expect(store.state).toBe('solo')
    })
  })

  describe('load()', () => {
    it('populates household, invitations, and activity', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({
          household: { id: 'hh1', name: 'Sam & Jordan', members: [you, partner] },
          invitations: [{ id: 'i1', status: 'pending', invitedBy: 'you' }],
          activity: [{ id: 'a1', actorName: 'Jordan', verb: 'completed', subject: 'x' }]
        })
      )

      const store = useHouseholdStore()
      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.household.name).toBe('Sam & Jordan')
      expect(store.invitations).toHaveLength(1)
      expect(store.activity).toHaveLength(1)
      expect(store.error).toBe('')
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce(envelope({}))
      const store = useHouseholdStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useHouseholdStore()
      await store.load()
      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })

    it('defaults missing fields to empty', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { household: null } })
      const store = useHouseholdStore()
      await store.load()
      expect(store.invitations).toEqual([])
      expect(store.activity).toEqual([])
    })
  })

  describe('state derivation', () => {
    it('is solo with no household and no invitations', async () => {
      apolloClient.query.mockResolvedValueOnce(envelope({}))
      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('solo')
    })

    it('is sent with an outbound pending invitation and no household', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ invitations: [{ id: 'i1', status: 'pending', invitedBy: 'you' }] })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('sent')
    })

    it('is sent when invitedBy is absent (lone outbound invite never strands)', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ invitations: [{ id: 'i1', status: 'pending' }] })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('sent')
    })

    it('is received with an inbound pending invitation and no household', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ invitations: [{ id: 'i1', status: 'pending', invitedBy: 'Jordan' }] })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('received')
    })

    it('is active with a household of two members', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ household: { id: 'hh1', name: 'Sam & Jordan', members: [you, partner] } })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('active')
    })

    it('is partnerLeft when only you remain in the household', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ household: { id: 'hh1', name: 'Sam', members: [you] } })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('partnerLeft')
    })

    it('prefers active over a stray pending invitation', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({
          household: { id: 'hh1', name: 'Sam & Jordan', members: [you, partner] },
          invitations: [{ id: 'i1', status: 'pending', invitedBy: 'someone' }]
        })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('active')
    })

    it('ignores non-pending invitations when deriving state', async () => {
      apolloClient.query.mockResolvedValueOnce(
        envelope({ invitations: [{ id: 'i1', status: 'declined', invitedBy: 'Jordan' }] })
      )

      const store = useHouseholdStore()
      await store.load()
      expect(store.state).toBe('solo')
    })
  })

  describe('createHousehold()', () => {
    it('returns the created household and refreshes', async () => {
      const created = { id: 'hh-new', name: 'Home', members: [you] }
      apolloClient.mutate.mockResolvedValueOnce({ data: { createHousehold: created } })

      apolloClient.query.mockResolvedValueOnce(envelope({ household: created }))

      const store = useHouseholdStore()
      const result = await store.createHousehold('Home')
      expect(result).toEqual(created)
      expect(apolloClient.query).toHaveBeenCalled()
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useHouseholdStore()
      await expect(store.createHousehold('Home')).rejects.toThrow('create failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('invite()', () => {
    it('appends the new invitation on success', async () => {
      const invitation = { id: 'i2', email: 'a@b.com', status: 'pending', invitedBy: 'you' }
      apolloClient.mutate.mockResolvedValueOnce({ data: { inviteToHousehold: invitation } })
      const store = useHouseholdStore()
      store.invitations = []
      const result = await store.invite('a@b.com')
      expect(result).toEqual(invitation)
      expect(store.invitations).toHaveLength(1)
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('invite failed'))
      const store = useHouseholdStore()
      await expect(store.invite('a@b.com')).rejects.toThrow('invite failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('cancelInvitation()', () => {
    it('removes the invitation on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { cancelHouseholdInvitation: true } })
      const store = useHouseholdStore()
      store.invitations = [{ id: 'i1' }, { id: 'i2' }]
      await store.cancelInvitation('i1')
      expect(store.invitations.map(i => i.id)).toEqual(['i2'])
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('cancel failed'))
      const store = useHouseholdStore()
      await expect(store.cancelInvitation('i1')).rejects.toThrow('cancel failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('acceptInvitation()', () => {
    it('returns the joined household and refreshes', async () => {
      const joined = { id: 'hh1', name: 'Sam & Jordan', members: [you, partner] }
      apolloClient.mutate.mockResolvedValueOnce({ data: { acceptHouseholdInvitation: joined } })
      apolloClient.query.mockResolvedValueOnce(envelope({ household: joined }))
      const store = useHouseholdStore()
      const result = await store.acceptInvitation('i1')
      expect(result).toEqual(joined)
      expect(apolloClient.query).toHaveBeenCalled()
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('accept failed'))
      const store = useHouseholdStore()
      await expect(store.acceptInvitation('i1')).rejects.toThrow('accept failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('declineInvitation()', () => {
    it('removes the invitation on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { declineHouseholdInvitation: true } })
      const store = useHouseholdStore()
      store.invitations = [{ id: 'i1' }, { id: 'i2' }]
      await store.declineInvitation('i2')
      expect(store.invitations.map(i => i.id)).toEqual(['i1'])
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('decline failed'))
      const store = useHouseholdStore()
      await expect(store.declineInvitation('i1')).rejects.toThrow('decline failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('leave()', () => {
    it('clears local state on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { leaveHousehold: true } })
      const store = useHouseholdStore()
      store.household = { id: 'hh1', name: 'x', members: [you, partner] }
      store.invitations = [{ id: 'i1' }]
      store.activity = [{ id: 'a1' }]
      await store.leave()
      expect(store.household).toBeNull()
      expect(store.invitations).toEqual([])
      expect(store.activity).toEqual([])
      expect(store.state).toBe('solo')
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('leave failed'))
      const store = useHouseholdStore()
      await expect(store.leave()).rejects.toThrow('leave failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('removeMember()', () => {
    it('filters the removed member out of the local list', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { removeFromHousehold: true } })
      const store = useHouseholdStore()
      store.household = { id: 'hh1', name: 'x', members: [you, partner] }
      await store.removeMember('u2')
      expect(store.household.members.map(m => m.userId)).toEqual(['me'])
    })

    it('re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('remove failed'))
      const store = useHouseholdStore()
      store.household = { id: 'hh1', name: 'x', members: [you, partner] }
      await expect(store.removeMember('u2')).rejects.toThrow('remove failed')
      expect(mockToastError).toHaveBeenCalled()
    })
  })
})
