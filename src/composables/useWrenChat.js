import { ref, watch, nextTick, onMounted } from 'vue'
import { useWrenStore } from '@/stores/wren.store'

export const QUICK_PROMPTS = [
  "What should I focus on?",
  "I'm feeling overwhelmed.",
  "Plan tomorrow",
  "I need a rest.",
]

/**
 * Shared logic for the Wren chat UI used by both WrenPanel and WrenView.
 * Handles draft state, auto-scroll, send, keydown, and quick-prompt chips.
 *
 * @param {import('vue').Ref<HTMLElement|null>} bodyRef - Scrollable message container ref
 */
export function useWrenChat(bodyRef) {
  const store = useWrenStore()
  const draft = ref('')

  onMounted(() => store.load())

  function scrollToBottom() {
    nextTick(() => {
      if (bodyRef.value) {
        bodyRef.value.scrollTop = bodyRef.value.scrollHeight
      }
    })
  }

  watch(() => store.messages.length, scrollToBottom)

  async function sendMessage() {
    const text = draft.value.trim()
    if (!text || store.sending) return
    draft.value = ''
    await store.send(text)
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function fillFromChip(prompt) {
    draft.value = prompt
  }

  return { store, draft, sendMessage, handleKeydown, fillFromChip }
}
