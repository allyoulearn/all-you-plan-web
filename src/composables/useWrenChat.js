/**
 * Wren chat composable.
 * Shared logic for the Wren chat UI used by both WrenPanel and WrenView.
 * Handles draft state, auto-scroll, send, keydown, and quick-prompt chips.
 */
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWrenStore } from '@/stores/wren.store.js'

// -- Constants --

/** Pre-defined prompts displayed as quick-action chips in the chat UI. */
export const QUICK_PROMPTS = [
  'What should I focus on?',
  "I'm feeling overwhelmed.",
  'Plan tomorrow',
  'I need a rest.'
]

// -- Composable --

/**
 * Composable that wires the Wren chat panel to the wren store.
 *
 * Must be called from a component's `setup()` so Vue can auto-clean up the
 * internal `watch` on unmount. Calling it from outside a component scope
 * (e.g., from a Pinia store) would leak the watcher.
 *
 * @param {import('vue').Ref<HTMLElement|null>} bodyRef - Scrollable message container ref
 * @returns {{ store: object, draft: import('vue').Ref<string>, sendMessage: () => Promise<void>, handleKeydown: (e: KeyboardEvent) => void, fillFromChip: (prompt: string) => void }}
 */
export function useWrenChat(bodyRef) {
  const store = useWrenStore()
  const { t } = useI18n()
  const draft = ref('')

  // Assertive screen-reader announcement string. The view renders this into a
  // dedicated visually-hidden `role="status"` node near the composer. We set
  // it when a coach reply finalises (or is interrupted) so completion is
  // announced even though the message log uses polite `aria-live` that may
  // coalesce rapid streaming token updates. Purely additive — this only reads
  // message status, it does not touch the streaming pipeline.
  const announce = ref('')

  // Per-message status we last announced, so we only fire on a genuine
  // streaming → finalized transition and never re-announce on unrelated
  // re-renders.
  const announcedStatusById = new Map()

  onMounted(() => {
    store.load().catch(err => {
      // store.error is already set by the store; log for diagnostics
      console.error('[useWrenChat] load failed', err)
    })
  })

  // Tear down the long-lived Wren stream subscription so the WS listener does
  // not outlive the consuming view (WrenPanel / WrenView). Without this the
  // subscription survives navigation and accumulates one listener per mount.
  onBeforeUnmount(() => {
    store.teardown()
  })

  // -- Scroll --

  /**
   * Scroll the message container to the bottom after the next DOM tick.
   */
  function scrollToBottom() {
    nextTick(() => {
      if (bodyRef.value) {
        bodyRef.value.scrollTop = bodyRef.value.scrollHeight
      }
    })
  }

  // Deep-watch the array itself so we also re-scroll on in-place edits
  // (optimistic-replace patterns that leave the array length unchanged)
  //.
  watch(() => store.messages, scrollToBottom, { deep: true })

  // Watch coach message statuses and announce when a streaming reply settles.
  // Reads only — the store still owns the streaming lifecycle.
  watch(
    () => store.messages,
    messages => {
      if (!Array.isArray(messages)) return

      for (const m of messages) {
        if (!m || m.sender !== 'coach') continue
        const prev = announcedStatusById.get(m.id)
        if (prev === m.status) continue
        announcedStatusById.set(m.id, m.status)

        // Only announce the terminal states, and only once we've already seen
        // this message (so a fully-formed history load doesn't fire a burst).
        if (prev === undefined) continue

        if (m.status === 'complete') {
          announce.value = t('wren.replyReadyAnnouncement')
        } else if (m.status === 'interrupted') {
          announce.value = t('wren.streamInterruptedAnnouncement')
        }
      }
    },
    { deep: true }
  )

  // -- Actions --

  /**
   * Send the current draft text as a message. Clears the draft on success.
   * No-op when the draft is empty or the store is already sending.
   * @returns {Promise<void>}
   */
  async function sendMessage() {
    const text = draft.value.trim()
    if (!text || store.sending) return

    try {
      await store.send(text)
      draft.value = ''
    } catch {
      // draft is preserved for retry; the store surfaces the error
    }
  }

  /**
   * Handle textarea keydown. Submits on Enter (without Shift).
   * @param {KeyboardEvent} e
   */
  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /**
   * Populate the draft with a quick-prompt chip value.
   * @param {string} prompt - The prompt text from the chip
   */
  function fillFromChip(prompt) {
    draft.value = prompt
  }

  return { store, draft, announce, sendMessage, handleKeydown, fillFromChip }
}
