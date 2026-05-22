/**
 * Wren chat composable.
 * Shared logic for the Wren chat UI used by both WrenPanel and WrenView.
 * Handles draft state, auto-scroll, send, keydown, and quick-prompt chips.
 */
import { ref, watch, nextTick, onMounted } from 'vue'
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
 * @param {import('vue').Ref<HTMLElement|null>} bodyRef - Scrollable message container ref
 * @returns {{ store: object, draft: import('vue').Ref<string>, sendMessage: () => Promise<void>, handleKeydown: (e: KeyboardEvent) => void, fillFromChip: (prompt: string) => void }}
 */
export function useWrenChat(bodyRef) {
  const store = useWrenStore()
  const draft = ref('')

  onMounted(() => {
    store.load().catch(err => {
      // store.error is already set by the store; log for diagnostics
      console.error('[useWrenChat] load failed', err)
    })
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

  watch(() => store.messages.length, scrollToBottom)

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

  return { store, draft, sendMessage, handleKeydown, fillFromChip }
}
