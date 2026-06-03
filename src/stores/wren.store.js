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
 *
 * Stream watchdog (token refresh mid-stream guard):
 *   apolloClient's errorLink calls resetWsConnection() after a successful
 *   token refresh (so the next subscribe uses the new bearer). graphql-ws
 *   will retry-reconnect on the next subscribe, but any partial reply that
 *   was streaming when the refresh happened is lost — the server-side
 *   subscription was torn down. To keep the UI honest we run a per-message
 *   watchdog: every WrenTokenDelta / WrenActionStarted / WrenActionEvent /
 *   WrenPendingConfirmationEvent / WrenConfirmationResolvedEvent resets a
 *   WREN_STREAM_TIMEOUT_MS timer keyed by messageId. If no event arrives
 *   for that long we flip the placeholder to status: 'interrupted', set
 *   error.value, and toast. WrenComplete / WrenError clear the timer.
 *   Watchdogs live in a module-level Map (not Pinia state) — they are
 *   timers, not UI state — and reset() / teardown() clear them all.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  WREN_MESSAGES_QUERY,
  WREN_CONVERSATION_QUERY,
  WREN_CONVERSATIONS_QUERY,
  WREN_CONVERSATION_MESSAGES_QUERY,
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

/**
 * How long a streaming message may go without any incremental event before
 * the watchdog flips it to 'interrupted'. Kept at the module scope so tests
 * can advance fake timers past the threshold without needing to plumb the
 * value through the store API.
 */
const WREN_STREAM_TIMEOUT_MS = 30_000

/**
 * Active per-message watchdog timer ids, keyed by messageId. Lives outside
 * Pinia state intentionally — these are setTimeout handles, not UI state,
 * and Vue reactivity has no need to track them.
 */
const streamWatchdogs = new Map()

export const useWrenStore = defineStore('wren', () => {
  const messages = ref([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  const settings = ref(null)
  const conversationId = ref(null)
  // Multi-conversation rail state. Conversations live as summaries here; the
  // active conversation's full message history lives in `messages`. Messages
  // for inactive conversations are cached in `conversationMessages` so a
  // switch is instant (no re-fetch) within a single session.
  const conversations = ref([])
  const activeConversationId = ref(null)
  const conversationMessages = ref({})
  // Set of `${refType}:${refId}` strings for entities Wren has applied an
  // action to. Read by WrenOriginBadge.vue to render the "by Wren" mark on
  // rows/cards. Rebuilt on every change so Vue reactivity picks it up.
  const originRefs = ref(new Set())
  // Bumps every time an applied action lands. useWrenSync watches this and
  // refreshes the matching domain store so the affected view picks up the
  // change without requiring the user to reload.
  const lastAction = ref(null)
  let activeSubscription = null

  /**
   * Register an applied action's ref so the matching item is marked as
   * Wren-originated and the relevant store is refreshed. `refType` and `refId`
   * are both required — actions without either (purely advisory chips) are
   * skipped. `kind` is forwarded to the sync layer so it can route by domain
   * verb (e.g. `task.deleted` vs `task.created`).
   */
  function registerActionRef(action) {
    if (!action || !action.refType || !action.refId) return
    const key = `${action.refType}:${action.refId}`

    if (!originRefs.value.has(key)) {
      originRefs.value = new Set([...originRefs.value, key])
    }

    lastAction.value = {
      refType: action.refType,
      refId: action.refId,
      kind: action.kind ?? null,
      at: Date.now()
    }
  }

  /** Register every applied action carried by a message (used after load). */
  function registerActionsFromMessage(message) {
    if (!message?.actions) return

    for (const a of message.actions) {
      if (a?.__typename === 'WrenAppliedAction' || a?.refType) registerActionRef(a)
    }
  }

  /**
   * True when Wren has applied an action to the given entity this session.
   * Reads through `originRefs.value.has(...)` so consumers picked up by Vue's
   * reactivity will re-render whenever the set is replaced.
   */
  function isWrenOrigin(refType, refId) {
    if (!refType || !refId) return false
    return originRefs.value.has(`${refType}:${refId}`)
  }

  /**
   * Load the persisted conversation history and seed the originRefs set from
   * actions on historical messages so badges survive a page reload.
   *
   * Also fetches the conversations list (used by the WrenView left rail) in
   * parallel — a failure on that secondary query is logged but never blocks
   * the main message load.
   */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: WREN_MESSAGES_QUERY,
        fetchPolicy: 'network-only'
      })

      messages.value = data.wrenMessages
      // Seed the origin set from historical messages so a fresh page load
      // still shows the "by Wren" badge on items Wren created in a prior turn.
      for (const m of messages.value ?? []) registerActionsFromMessage(m)

      // Best-effort load of the conversation rail. Cache the active
      // conversation's messages so a switch-back-and-forth is instant.
      // TODO(multi-conversation): wrenConversations / wrenConversationMessages
      // queries are NOT implemented on the API yet — this catch swallows the
      // schema error and the rail shows a single conversation. Product call
      // pending: ship multi-conversation (add API resolvers) or sunset the
      // rail. See audit-2026-05-27/all-you-plan-FIX-NOTES.md for the full
      // list of files affected.
      loadConversations().catch(err => {
        console.warn('[wren] conversations list unavailable', err?.message)
      })

      if (activeConversationId.value) {
        conversationMessages.value = {
          ...conversationMessages.value,
          [activeConversationId.value]: messages.value
        }
      }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Load the list of conversations for the rail. Best-effort: the API may not
   * yet implement multi-conversation; on failure we leave the rail empty and
   * the WrenView falls back to a single-conversation experience.
   *
   * TODO(multi-conversation): WREN_CONVERSATIONS_QUERY targets a
   * `wrenConversations` field that does not exist in the API schema yet.
   * Currently fails silently via the catch in `load()`. Product decision
   * pending — see audit-2026-05-27/all-you-plan-FIX-NOTES.md.
   */
  async function loadConversations() {
    try {
      const { data } = await apolloClient.query({
        query: WREN_CONVERSATIONS_QUERY,
        fetchPolicy: 'network-only'
      })

      conversations.value = data.wrenConversations ?? []

      // Pick a default active conversation if none is set yet. The first
      // entry from the API is the most recent so that's the natural default.
      if (!activeConversationId.value && conversations.value.length > 0) {
        activeConversationId.value = conversations.value[0].id
      }

      // The initial wrenMessages load returns the messages of the currently-
      // active conversation. Cache them under the now-known active id so a
      // round-trip switch (active → other → active) does not refetch.
      if (activeConversationId.value && messages.value.length) {
        conversationMessages.value = {
          ...conversationMessages.value,
          [activeConversationId.value]: messages.value
        }
      }
    } catch (e) {
      conversations.value = []
      throw e
    }
  }

  /**
   * Switch the active conversation. Saves the currently-rendered messages
   * back into the per-conversation cache (so unsent in-flight UI state stays
   * coherent on switch-back) and then either restores the target's cached
   * messages or fetches them.
   *
   * TODO(multi-conversation): WREN_CONVERSATION_MESSAGES_QUERY targets a
   * `wrenConversationMessages` field that does not exist in the API schema
   * yet. Pending product decision on multi-conversation — see
   * audit-2026-05-27/all-you-plan-FIX-NOTES.md.
   */
  async function switchConversation(id) {
    if (!id || id === activeConversationId.value) return

    // Cache current conversation's messages before swapping.
    if (activeConversationId.value) {
      conversationMessages.value = {
        ...conversationMessages.value,
        [activeConversationId.value]: messages.value
      }
    }

    activeConversationId.value = id

    if (conversationMessages.value[id]) {
      messages.value = conversationMessages.value[id]
      return
    }

    loading.value = true

    try {
      const { data } = await apolloClient.query({
        query: WREN_CONVERSATION_MESSAGES_QUERY,
        variables: { conversationId: id },
        fetchPolicy: 'network-only'
      })

      const list = data.wrenConversationMessages ?? []
      conversationMessages.value = { ...conversationMessages.value, [id]: list }
      messages.value = list
      for (const m of list) registerActionsFromMessage(m)
    } catch (e) {
      error.value = e.message
      messages.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new local conversation. The new entry becomes active and starts
   * empty — the first send() call will populate it. This is intentionally
   * client-only for now: the multi-conversation API surface is in design,
   * and seeding here lets the UI prove out without blocking on the server.
   *
   * If an empty conversation already exists (no messages on the server AND
   * no locally-typed messages cached), activate it instead of spawning a
   * duplicate. This stops the rail filling up with "New conversation"
   * entries when the user clicks the + button repeatedly.
   */
  function createConversation(title) {
    const emptyExisting = conversations.value.find(c => {
      if ((c.messageCount ?? 0) > 0) return false
      const cached = conversationMessages.value[c.id]
      return !cached || cached.length === 0
    })

    if (emptyExisting) {
      if (emptyExisting.id !== activeConversationId.value) {
        if (activeConversationId.value) {
          conversationMessages.value = {
            ...conversationMessages.value,
            [activeConversationId.value]: messages.value
          }
        }

        activeConversationId.value = emptyExisting.id
        messages.value = conversationMessages.value[emptyExisting.id] ?? []
      }

      return emptyExisting.id
    }

    const id = `local-${Date.now()}`

    const entry = {
      __typename: 'WrenConversationSummary',
      id,
      title: title || 'New conversation',
      preview: '',
      updatedAt: new Date().toISOString(),
      messageCount: 0
    }

    conversations.value = [entry, ...conversations.value]

    // Cache the active conversation's current messages before clearing.
    if (activeConversationId.value) {
      conversationMessages.value = {
        ...conversationMessages.value,
        [activeConversationId.value]: messages.value
      }
    }

    activeConversationId.value = id
    conversationMessages.value = { ...conversationMessages.value, [id]: [] }
    messages.value = []
    return id
  }

  /**
   * Resolve the conversation id, fetching it from the API the first time.
   * Caches in `conversationId` for subsequent calls within the session.
   * @returns {Promise<string|null>}
   */
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

  /**
   * Send a user turn into the conversation.
   *
   * 1. Trims and short-circuits empty / in-flight sends.
   * 2. Appends an optimistic user bubble immediately.
   * 3. Opens (or reuses) the long-lived WrenStream subscription. The
   *    subscription is shared across turns within a single conversation; it
   *    is torn down only by reset() (logout) or teardown() (component
   *    unmount). Subscribing BEFORE the mutation reduces the chance that
   *    early stream events arrive with no listener — see applyStreamEvent
   *    for how the WrenComplete race is handled.
   * 4. Awaits the sendWrenMessage mutation; on success the returned
   *    placeholder coach message is appended (status: 'streaming' for the
   *    LLM path, 'complete' for the legacy scripted path).
   * 5. On any failure, removes the optimistic bubble and toasts the user.
   *    The in-flight subscription is intentionally NOT torn down — it is
   *    reusable for subsequent retries within the same conversation.
   *
   * @param {string} text - Raw user input; trimmed before sending.
   * @returns {Promise<void>}
   */
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

  /**
   * Tear down the active streaming subscription and clear all watchdog timers.
   * Called on component unmount; reset() also delegates here.
   */
  function teardown() {
    if (activeSubscription) {
      try {
        activeSubscription.unsubscribe()
      } catch {
        /* no-op */
      }

      activeSubscription = null
    }

    clearAllWatchdogs()
  }

  /**
   * Clear a single per-message watchdog timer (no-op if none registered).
   * Called from applyStreamEvent on every incremental event (so the next
   * tick starts a fresh window) and on terminal events (WrenComplete /
   * WrenError) so a completed stream cannot later flip to 'interrupted'.
   */
  function clearWatchdog(messageId) {
    if (!messageId) return
    const id = streamWatchdogs.get(messageId)

    if (id !== undefined) {
      clearTimeout(id)
      streamWatchdogs.delete(messageId)
    }
  }

  /** Clear every active per-message watchdog. Used by reset() / teardown(). */
  function clearAllWatchdogs() {
    for (const id of streamWatchdogs.values()) clearTimeout(id)
    streamWatchdogs.clear()
  }

  /**
   * Schedule (or reschedule) the per-message watchdog. After
   * WREN_STREAM_TIMEOUT_MS without an incremental event, mark the still-
   * streaming placeholder 'interrupted', surface a friendly error, and toast.
   * Safe to call on every event — clearWatchdog() first so we always run on
   * a fresh window. Skipped for messages with no id (defensive).
   */
  function armWatchdog(messageId) {
    if (!messageId) return
    clearWatchdog(messageId)

    const id = setTimeout(() => {
      streamWatchdogs.delete(messageId)
      const idx = messages.value.findIndex(m => m.id === messageId)
      if (idx < 0) return
      const msg = messages.value[idx]
      if (msg.status !== 'streaming') return

      messages.value = messages.value.map((m, i) =>
        i === idx ? { ...m, status: 'interrupted' } : m
      )

      const text = 'Wren stream interrupted. Please send your message again.'
      error.value = text
      const { toastError } = useErrorToast()
      toastError(new Error(text), 'Wren stream interrupted')
    }, WREN_STREAM_TIMEOUT_MS)

    streamWatchdogs.set(messageId, id)
  }

  /**
   * Wipe all per-conversation state. Called from the auth store on logout so
   * a subsequent login does not reuse the previous user's conversation id,
   * message history, settings, or in-flight subscription.
   */
  function reset() {
    teardown()
    messages.value = []
    settings.value = null
    conversationId.value = null
    error.value = ''
    loading.value = false
    sending.value = false
    originRefs.value = new Set()
    lastAction.value = null
    conversations.value = []
    activeConversationId.value = null
    conversationMessages.value = {}
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
    // append it so the reply is never dropped. Either way the stream is over,
    // so cancel any pending watchdog for this message id.
    if (evt.__typename === 'WrenComplete') {
      const finalMsg = evt.message
      clearWatchdog(finalMsg?.id ?? messageId)

      if (idx >= 0) {
        messages.value = messages.value.map(m => (m.id === finalMsg.id ? { ...finalMsg } : m))
      } else {
        messages.value = [...messages.value, { ...finalMsg }]
      }

      registerActionsFromMessage(finalMsg)
      return
    }

    // Other events need a matching placeholder. Bail without touching state
    // when none is found — WrenError still falls through below to surface the
    // error.value, even without a message attachment.
    if (idx < 0 && evt.__typename !== 'WrenError') return
    const msg = idx >= 0 ? { ...messages.value[idx] } : null

    // For any incremental event on a still-streaming placeholder, restart the
    // watchdog window. Skipped for WrenError (terminal, cleared below) and
    // for placeholders that already moved off 'streaming' (someone else
    // already finalised the message — don't resurrect the timer). The arm
    // happens before the switch so an event arriving for a freshly-streaming
    // message immediately starts a window.
    if (idx >= 0 && msg && msg.status === 'streaming' && evt.__typename !== 'WrenError') {
      armWatchdog(messageId)
    }

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
        registerActionRef(newAction)
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
        if (evt.resolution === 'confirmed' && evt.action) registerActionRef(evt.action)
        break
      }

      case 'WrenError': {
        // Surface error message + mark the placeholder failed (when present).
        // Also toast so the user sees it — no view renders store.error.
        // Terminal event: cancel the watchdog so a late-firing timer cannot
        // overwrite the 'failed' status with 'interrupted'.
        clearWatchdog(messageId)

        if (msg) {
          msg.status = 'failed'
          messages.value = messages.value.map((m, i) => (i === idx ? msg : m))
        }

        // The wire field is `errorMessage` (renamed from `message` to avoid
        // colliding with `WrenComplete.message: WrenMessage!`). Fall back to
        // `message` so older payloads / tests written before the rename
        // still resolve to a string.
        const errText = evt.errorMessage ?? evt.message ?? ''
        const text = evt.code ? `${evt.code}: ${errText}` : errText
        error.value = text
        const { toastError } = useErrorToast()
        toastError(new Error(text), 'Wren stream error')
        break
      }
    }
  }

  /**
   * Reverse a previously-applied write action.
   * @param {string} undoToken - One-shot token from the action's undoToken field
   * @returns {Promise<boolean>} true on success; false if the mutation failed
   */
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

  /**
   * Confirm a destructive action awaiting user approval.
   * @param {string} confirmToken - Token from a WrenPendingConfirmationEvent
   * @returns {Promise<object|null>} The resulting WrenAppliedAction, or null on failure
   */
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

  /**
   * Cancel a destructive action awaiting user approval.
   * @param {string} confirmToken - Token from a WrenPendingConfirmationEvent
   * @returns {Promise<boolean>} true on success; false if the mutation failed
   */
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

  /** Load the current user's WrenSettings into the store. */
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

  /**
   * Persist a settings patch.
   *
   * Semantics: every key present in `patch` is forwarded to the API as a
   * variable. Per the GraphQL schema, an explicit `null` clears the field
   * (e.g. `{ displayName: null }` resets the coach name); omit a field to
   * leave it unchanged. The API resolver mirrors this — see
   * all-you-plan-api/src/domains/wren/resolvers.ts updateWrenSettings.
   *
   * @param {object} patch - Subset of { displayName, tone, enabled, dailyTurnCap }
   * @returns {Promise<object|null>} The updated WrenSettings, or null on failure
   */
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

  /**
   * Fetch a serialised export of the conversation. The caller is responsible
   * for turning the payload into a Blob and triggering a download (see
   * WrenPanel.vue onExport for the canonical flow).
   *
   * Errors propagate to the caller — there is no toast here because the
   * single consumer wraps the call in try/catch and updates store.error.
   *
   * @param {'markdown'|'json'} format - The desired serialization format
   * @returns {Promise<{ format: string, filename: string, content: string }>}
   */
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
    originRefs,
    lastAction,
    conversations,
    activeConversationId,
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
    ensureConversation,
    isWrenOrigin,
    loadConversations,
    switchConversation,
    createConversation
  }
})
