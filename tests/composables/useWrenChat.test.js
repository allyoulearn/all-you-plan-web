import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'
import { useWrenStore } from '@/stores/wren.store'

vi.mock('@/api/apollo.js', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}))

vi.mock('@/api/operations/index.js', () => ({
  WREN_MESSAGES_QUERY: 'WREN_MESSAGES_QUERY',
  SEND_WREN_MESSAGE: 'SEND_WREN_MESSAGE'
}))

vi.mock('@/composables/useErrorToast.js', () => ({
  useErrorToast: () => ({ toastError: vi.fn() })
}))

/**
 * Mount a minimal wrapper component so that onMounted lifecycle hook fires
 * correctly, avoiding the "onMounted called outside component instance" warning.
 * Ensures store.load() returns a Promise so .catch() works in the composable.
 */
function mountComposable(bodyRefValue = null) {
  const bodyRef = ref(bodyRefValue)
  let result

  // Ensure store.load() is a function returning a resolved Promise before mount
  const store = useWrenStore()
  if (!store.load || typeof store.load.mockResolvedValue !== 'function') {
    store.load = vi.fn().mockResolvedValue(undefined)
  } else {
    store.load.mockResolvedValue(undefined)
  }

  mount({
    setup() {
      result = useWrenChat(bodyRef)
      return {}
    },
    template: '<div />'
  })
  return { ...result, bodyRef }
}

describe('useWrenChat', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Constants --

  it('exports four quick-prompt strings', () => {
    expect(QUICK_PROMPTS).toHaveLength(4)
    expect(QUICK_PROMPTS[0]).toBe('What should I focus on?')
  })

  it('QUICK_PROMPTS contains the expected prompts', () => {
    expect(QUICK_PROMPTS).toEqual([
      'What should I focus on?',
      "I'm feeling overwhelmed.",
      'Plan tomorrow',
      'I need a rest.'
    ])
  })

  // -- Initial state --

  it('draft starts as an empty string', () => {
    const { draft } = mountComposable()
    expect(draft.value).toBe('')
  })

  it('calls store.load on mount', async () => {
    mountComposable()
    const store = useWrenStore()
    await nextTick()
    expect(store.load).toHaveBeenCalledOnce()
  })

  it('store.load error is caught and logged without throwing', async () => {
    // Set up the rejection BEFORE mounting so onMounted sees it
    const store = useWrenStore()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    store.load = vi.fn().mockRejectedValue(new Error('network fail'))

    mount({
      setup() {
        useWrenChat(ref(null))
        return {}
      },
      template: '<div />'
    })

    // Let the promise rejection propagate through the onMounted catch
    await nextTick()
    await nextTick()
    expect(errorSpy).toHaveBeenCalledWith('[useWrenChat] load failed', expect.any(Error))
    errorSpy.mockRestore()
  })

  // -- fillFromChip --

  it('fillFromChip sets the draft to the given prompt', () => {
    const { draft, fillFromChip } = mountComposable()
    fillFromChip('Plan tomorrow')
    expect(draft.value).toBe('Plan tomorrow')
  })

  it('fillFromChip overwrites any existing draft', () => {
    const { draft, fillFromChip } = mountComposable()
    draft.value = 'old content'
    fillFromChip('I need a rest.')
    expect(draft.value).toBe('I need a rest.')
  })

  // -- sendMessage — success path --

  it('sendMessage trims the draft text and delegates to store.send', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()
    store.send = vi.fn().mockResolvedValue(undefined)

    draft.value = '  Hello  '
    await sendMessage()

    expect(store.send).toHaveBeenCalledWith('Hello')
  })

  it('sendMessage clears the draft only after a successful send', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()
    store.send = vi.fn().mockResolvedValue(undefined)

    draft.value = 'Hello'
    await sendMessage()

    expect(draft.value).toBe('')
  })

  // -- sendMessage — failure path: draft is preserved --

  it('sendMessage preserves the draft when store.send throws', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()
    store.send = vi.fn().mockRejectedValue(new Error('send failed'))

    draft.value = 'Important message'
    await sendMessage()

    expect(draft.value).toBe('Important message')
  })

  // -- sendMessage — no-op branches --

  it('sendMessage is a no-op when draft is blank', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()

    draft.value = '   '
    await sendMessage()

    expect(store.send).not.toHaveBeenCalled()
  })

  it('sendMessage is a no-op when draft is empty string', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()

    draft.value = ''
    await sendMessage()

    expect(store.send).not.toHaveBeenCalled()
  })

  it('sendMessage is a no-op while store.sending is true', async () => {
    const { draft, sendMessage } = mountComposable()
    const store = useWrenStore()
    store.sending = true
    store.send = vi.fn()

    draft.value = 'Hello'
    await sendMessage()

    expect(store.send).not.toHaveBeenCalled()
  })

  // -- handleKeydown --

  describe('handleKeydown()', () => {
    it('calls sendMessage on Enter without Shift', () => {
      const { draft, handleKeydown } = mountComposable()
      const store = useWrenStore()
      store.send = vi.fn().mockResolvedValue(undefined)

      draft.value = 'Test message'
      const event = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('does NOT call sendMessage on Shift+Enter', () => {
      const { draft, handleKeydown } = mountComposable()
      const store = useWrenStore()
      store.send = vi.fn()

      draft.value = 'Test message'
      const event = { key: 'Enter', shiftKey: true, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(store.send).not.toHaveBeenCalled()
    })

    it('ignores non-Enter keys', () => {
      const { handleKeydown } = mountComposable()
      const store = useWrenStore()
      store.send = vi.fn()

      const event = { key: 'a', shiftKey: false, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(store.send).not.toHaveBeenCalled()
    })

    it('ignores Escape key', () => {
      const { handleKeydown } = mountComposable()
      const store = useWrenStore()
      store.send = vi.fn()

      const event = { key: 'Escape', shiftKey: false, preventDefault: vi.fn() }
      handleKeydown(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })

  // -- scroll behaviour --

  it('does not throw when bodyRef is null during scroll', async () => {
    mountComposable(null)
    // Simulate message count change to trigger the watch
    const store = useWrenStore()
    store.messages = [{ id: '1', text: 'hi' }]
    await nextTick()
    // No error thrown is the assertion
  })

  it('scrolls the bodyRef element to the bottom when messages change', async () => {
    const el = { scrollTop: 0, scrollHeight: 500 }
    mountComposable(el)
    const store = useWrenStore()
    store.messages = [{ id: '1', text: 'hi' }]
    await nextTick()
    await nextTick() // nextTick inside scrollToBottom
    expect(el.scrollTop).toBe(500)
  })

  // -- teardown --

  it('calls store.teardown on component unmount so the WS subscription unwinds', () => {
    const store = useWrenStore()
    store.load = vi.fn().mockResolvedValue(undefined)
    store.teardown = vi.fn()
    const wrapper = mount({
      setup() {
        useWrenChat(ref(null))
        return {}
      },
      template: '<div />'
    })
    expect(store.teardown).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(store.teardown).toHaveBeenCalledOnce()
  })
})
