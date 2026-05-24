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

  /**
   * Wipe all per-conversation state. Called from the auth store on logout so
   * a subsequent login does not reuse the previous user's conversation id,
   * message history, settings, or in-flight subscription (WEB-W4-26).
   */
  function reset() {
    teardown()
    messages.value = []
    settings.value = null
    conversationId.value = null
    error.value = ''
    loading.value = false
    sending.value = false
  }

  /**
   * Apply a single WrenStreamEvent payload to the message list in place.
   *
   * Each case mutates a cloned copy of the matching placeholder message so
   * Vue's reactivity picks up the change via array replacement. Events for
   * unknown messages are dropped silently — except WrenComplete (which
   * carries the final message and is appended if missing, covering the
   * subscription-emits-before-mutation-resolves race) and WrenError
   * (which still surfaces error.value even when no message exists).
   *
   * @param {object} evt - One of the WrenStreamEvent union members
   *   (WrenTokenDelta | WrenActionStarted | WrenActionEvent |
   *    WrenPendingConfirmationEvent | WrenConfirmationResolvedEvent |
   *    WrenComplete | WrenError), each tagged with __typename.
   */
  function applyStreamEvent(evt) {
    const messageId = evt.messageId ?? evt.message?.id
    const idx = messageId ? messages.value.findIndex(m => m.id === messageId) : -1

    // WrenComplete carries the canonical final message. If the placeholder is
    // not yet in the array (subscription emitted before the mutation resolved),
    // append it so the reply is never dropped.
    if (evt.__typename === 'WrenComplete') {
      const finalMsg = evt.message
      if (idx >= 0) {
        messages.value = messages.value.map(m => (m.id === finalMsg.id ? { ...finalMsg } : m))
      } else {
        messages.value = [...messages.value, { ...finalMsg }]
      }
      return
    }

    // Other events need a matching placeholder. Bail without touching state
    // when none is found — WrenError still falls through below to surface the
    // error.value, even without a message attachment.
    if (idx < 0 && evt.__typename !== 'WrenError') return
    const msg = idx >= 0 ? { ...messages.value[idx] } : null

    switch (evt.__typename) {
      case 'WrenTokenDelta':
        // Append the next chunk of streamed coach text to the placeholder.
        msg.text = (msg.text ?? '') + evt.text
        messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        break
      case 'WrenActionStarted':
        // Server signalled it is about to perform a write action — insert an
        // optimistic chip keyed by tempId so the user sees immediate feedback.
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
        // Reconcile the optimistic chip (matched by tempId) with the real
        // applied action. Append as a new chip when no tempId matches — covers
        // server-initiated actions that never had a "starting" event.
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
        // Destructive action awaiting user confirmation — render a confirm chip.
        // __typename here is the client-side persistent shape (distinct from
        // the wire WrenPendingConfirmationEvent) so WrenBubble.classify can
        // route it to WrenConfirmChip.
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
        // User confirmed or cancelled — swap the pending chip in place. On
        // confirm with an action payload, upgrade to a full WrenAppliedAction;
        // otherwise mark the existing chip resolved so it grays out.
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
      case 'WrenError':
        // Surface error message + mark the placeholder failed (when present).
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
    reset,
    ensureConversation
  }
})
