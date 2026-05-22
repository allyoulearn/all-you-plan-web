import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'
import { useWrenStore } from '@/stores/wren.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}))

vi.mock('@/api/operations', () => ({
  WREN_MESSAGES_QUERY: 'WREN_MESSAGES_QUERY',
  SEND_WREN_MESSAGE: 'SEND_WREN_MESSAGE'
}))

describe('useWrenChat', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  it('exports four quick-prompt strings', () => {
    expect(QUICK_PROMPTS).toHaveLength(4)
    expect(QUICK_PROMPTS[0]).toBe('What should I focus on?')
  })

  it('draft starts as an empty string', () => {
    const bodyRef = ref(null)
    const { draft } = useWrenChat(bodyRef)
    expect(draft.value).toBe('')
  })

  it('fillFromChip sets the draft to the given prompt', () => {
    const bodyRef = ref(null)
    const { draft, fillFromChip } = useWrenChat(bodyRef)
    fillFromChip('Plan tomorrow')
    expect(draft.value).toBe('Plan tomorrow')
  })

  it('sendMessage trims and delegates to store.send, then clears draft', async () => {
    const bodyRef = ref(null)
    const { draft, sendMessage } = useWrenChat(bodyRef)
    const store = useWrenStore()
    store.send = vi.fn().mockResolvedValue(undefined)

    draft.value = '  Hello  '
    await sendMessage()

    expect(store.send).toHaveBeenCalledWith('Hello')
    expect(draft.value).toBe('')
  })

  it('sendMessage is a no-op when draft is blank', async () => {
    const bodyRef = ref(null)
    const { draft, sendMessage } = useWrenChat(bodyRef)
    const store = useWrenStore()

    draft.value = '   '
    await sendMessage()

    expect(store.send).not.toHaveBeenCalled()
  })

  it('sendMessage is a no-op while store.sending is true', async () => {
    const bodyRef = ref(null)
    const { draft, sendMessage } = useWrenChat(bodyRef)
    const store = useWrenStore()
    store.sending = true
    store.send = vi.fn()

    draft.value = 'Hello'
    await sendMessage()

    expect(store.send).not.toHaveBeenCalled()
  })

  describe('handleKeydown()', () => {
    it('calls sendMessage on Enter without Shift', async () => {
      const bodyRef = ref(null)
      const { draft, handleKeydown } = useWrenChat(bodyRef)
      const store = useWrenStore()
      store.send = vi.fn().mockResolvedValue(undefined)

      draft.value = 'Test message'
      const event = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('does NOT call sendMessage on Shift+Enter', async () => {
      const bodyRef = ref(null)
      const { draft, handleKeydown } = useWrenChat(bodyRef)
      const store = useWrenStore()
      store.send = vi.fn()

      draft.value = 'Test message'
      const event = { key: 'Enter', shiftKey: true, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(store.send).not.toHaveBeenCalled()
    })

    it('ignores non-Enter keys', async () => {
      const bodyRef = ref(null)
      const { handleKeydown } = useWrenChat(bodyRef)
      const store = useWrenStore()
      store.send = vi.fn()

      const event = { key: 'a', shiftKey: false, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(store.send).not.toHaveBeenCalled()
    })
  })
})
