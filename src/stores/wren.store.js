/**
 * Wren store.
 * Manages the AI coaching conversation with Wren: history, sending state,
 * streaming subscription handling for the LLM agent, and undo/confirm/cancel
 * mutations for write actions.
 *
 * Streaming flow:
 *   send(text) → optimistic user message → sendWrenMessage returns placeholder
 *   coach message (status: 'streaming') → subscription publishes token deltas,
 *   action events, pending-confirmation events, complete, error → applyStreamEvent
 *   reconciles in place on the placeholder.
 *
 * Backwards compat:
 *   If sendWrenMessage returns status: 'complete' (legacy path with
 *   WREN_LLM_ENABLED=false), no subscription is needed — the reply is final.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  WREN_MESSAGES_QUERY,
  WREN_CONVERSATION_QUERY,
  SEND_WREN_MESSAGE,
  WREN_STREAM_SUBSCRIPTION,
  UNDO_WREN_ACTION,
  CONFIRM_WREN_ACTION,
  CANCEL_WREN_ACTION,
  WREN_SETTINGS_QUERY,
  UPDATE_WREN_SETTINGS,
  EXPORT_WREN_CONVERSATION
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useWrenStore = defineStore('wren', () => {
  const messages = ref([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  const settings = ref(null)
  const conversationId = ref(null)
  let activeSubscription = null

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: WREN_MESSAGES_QUERY,
        fetchPolicy: 'network-only'
      })
      messages.value = data.wrenMessages
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function ensureConversation() {
    if (conversationId.value) return conversationId.value
    try {
      const { data } = await apolloClient.query({
        query: WREN_CONVERSATION_QUERY,
        fetchPolicy: 'network-only'
      })
      conversationId.value = data.wrenConversation.id
      return conversationId.value
    } catch (e) {
      error.value = e.message
      return null
    }
  }

  async function send(text) {
    const trimmed = text?.trim()
    if (!trimmed || sending.value) return
    sending.value = true
    error.value = ''

    const optimisticId = `optimistic-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        id: optimisticId,
        sender: 'user',
        text: trimmed,
        actions: [],
        status: 'complete',
        createdAt: new Date().toISOString()
      }
    ]

    try {
      // ensure subscription is up before mutation, so first events aren't lost
      const cid = await ensureConversation()
      if (cid && !activeSubscription) {
        activeSubscription = apolloClient
          .subscribe({ query: WREN_STREAM_SUBSCRIPTION, variables: { conversationId: cid } })
          .subscribe({
            next: ({ data }) => data?.wrenStream && applyStreamEvent(data.wrenStream),
            error: err => {
              error.value = err.message
            }
          })
      }

      const { data } = await apolloClient.mutate({
        mutation: SEND_WREN_MESSAGE,
        variables: { text: trimmed }
      })
      messages.value = [...messages.value, data.sendWrenMessage]
    } catch (e) {
      error.value = e.message
      messages.value = messages.value.filter(m => m.id !== optimisticId)
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to send message')
    } finally {
      sending.value = false
    }
  }

  function teardown() {
    if (activeSubscription) {
      try {
        activeSubscription.unsubscribe()
      } catch {
        /* no-op */
      }
      activeSubscription = null
    }
  }

  function applyStreamEvent(evt) {
    const messageId = evt.messageId ?? evt.message?.id
    const idx = messageId ? messages.value.findIndex(m => m.id === messageId) : -1
    if (idx < 0 && evt.__typename !== 'WrenError') return
    const msg = idx >= 0 ? { ...messages.value[idx] } : null

    switch (evt.__typename) {
      case 'WrenTokenDelta':
        msg.text = (msg.text ?? '') + evt.text
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      case 'WrenActionStarted':
        msg.actions = [
          ...(msg.actions ?? []),
          {
            __typename: 'WrenAppliedAction',
            kind: evt.kind,
            summary: evt.summary,
            tempId: evt.tempId,
            pending: true
          }
        ]
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      case 'WrenActionEvent': {
        const actions = [...(msg.actions ?? [])]
        const j = evt.tempId ? actions.findIndex(a => a.tempId === evt.tempId) : -1
        const newAction = { ...evt.action, __typename: 'WrenAppliedAction' }
        if (j >= 0) actions[j] = newAction
        else actions.push(newAction)
        msg.actions = actions
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      }
      case 'WrenPendingConfirmationEvent':
        msg.actions = [
          ...(msg.actions ?? []),
          {
            __typename: 'WrenPendingConfirmation',
            confirmToken: evt.confirmToken,
            tool: evt.tool,
            summary: evt.summary,
            refType: evt.refType,
            refId: evt.refId,
            expiresAt: evt.expiresAt
          }
        ]
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      case 'WrenConfirmationResolvedEvent': {
        const actions = [...(msg.actions ?? [])]
        const j = actions.findIndex(a => a.confirmToken === evt.confirmToken)
        if (j >= 0) {
          if (evt.resolution === 'confirmed' && evt.action) {
            actions[j] = { ...evt.action, __typename: 'WrenAppliedAction' }
          } else {
            actions[j] = { ...actions[j], resolution: evt.resolution, pending: false }
          }
        }
        msg.actions = actions
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      }
      case 'WrenComplete': {
        const finalMsg = evt.message
        messages.value = messages.value.map(m => (m.id === finalMsg.id ? { ...finalMsg } : m))
        break
      }
      case 'WrenError':
        if (msg) {
          msg.status = 'failed'
          messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        }
        error.value = evt.code ? `${evt.code}: ${evt.message}` : evt.message
        break
    }
  }

  async function undo(undoToken) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UNDO_WREN_ACTION,
        variables: { undoToken }
      })
      return data?.undoWrenAction === true
    } catch (e) {
      const { toastError } = useErrorToast()
      toastError(e, 'Undo failed')
      return false
    }
  }

  async function confirm(confirmToken) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CONFIRM_WREN_ACTION,
        variables: { confirmToken }
      })
      return data?.confirmWrenAction ?? null
    } catch (e) {
      const { toastError } = useErrorToast()
      toastError(e, 'Confirmation failed')
      return null
    }
  }

  async function cancel(confirmToken) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CANCEL_WREN_ACTION,
        variables: { confirmToken }
      })
      return data?.cancelWrenAction === true
    } catch (e) {
      const { toastError } = useErrorToast()
      toastError(e, 'Cancel failed')
      return false
    }
  }

  async function loadSettings() {
    try {
      const { data } = await apolloClient.query({
        query: WREN_SETTINGS_QUERY,
        fetchPolicy: 'network-only'
      })
      settings.value = data.wrenSettings
    } catch (e) {
      error.value = e.message
    }
  }

  async function updateSettings(patch) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_WREN_SETTINGS,
        variables: patch
      })
      settings.value = data.updateWrenSettings
      return settings.value
    } catch (e) {
      error.value = e.message
      return null
    }
  }

  async function exportConversation(format) {
    const { data } = await apolloClient.query({
      query: EXPORT_WREN_CONVERSATION,
      variables: { format },
      fetchPolicy: 'network-only'
    })
    return data.exportWrenConversation
  }

  return {
    messages,
    loading,
    sending,
    error,
    settings,
    conversationId,
    load,
    send,
    applyStreamEvent,
    undo,
    confirm,
    cancel,
    loadSettings,
    updateSettings,
    exportConversation,
    teardown,
    ensureConversation
  }
})
