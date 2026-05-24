import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import { nextTick, reactive, ref } from 'vue'
import WrenView from '@/views/WrenView.vue'
import en from '@/i18n/locales/en.json'

// ── Stubs ─────────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  ScreenHeading: true,
  WrenBubble: true,
  RouterLink: true
}

// ── Mock useWrenChat composable ───────────────────────────────────────────────
// We control fakeStore directly so the component's v-if branches fire correctly.

const mockSendMessage = vi.fn()
const mockHandleKeydown = vi.fn()
const mockFillFromChip = vi.fn()

const QUICK_PROMPTS_LIST = [
  'What should I focus on?',
  "I'm feeling overwhelmed.",
  'Plan tomorrow',
  'I need a rest.'
]

// fakeStore is an object that mimics the wren store surface exposed by the composable.
let fakeStore = {
  messages: [],
  loading: false,
  sending: false,
  error: '',
  load: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined)
}

let draftRef = ref('')

vi.mock('@/composables/useWrenChat.js', () => ({
  QUICK_PROMPTS: [
    'What should I focus on?',
    "I'm feeling overwhelmed.",
    'Plan tomorrow',
    'I need a rest.'
  ],
  useWrenChat: () => ({
    store: fakeStore,
    draft: draftRef,
    sendMessage: mockSendMessage,
    handleKeydown: mockHandleKeydown,
    fillFromChip: mockFillFromChip
  })
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMessage(overrides = {}) {
  return {
    id: 'm1',
    sender: 'user',
    text: 'Hello',
    actions: [],
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

function mountWren(storeOverrides = {}) {
  // Reset fakeStore to defaults then apply overrides
  fakeStore = {
    messages: [],
    loading: false,
    sending: false,
    error: '',
    load: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    ...storeOverrides
  }
  draftRef = ref(storeOverrides.draft ?? '')

  return mount(WrenView, {
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('WrenView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    mockSendMessage.mockReset()
    mockHandleKeydown.mockReset()
    mockFillFromChip.mockReset()
  })

  // -- Rendering --

  it('renders without errors', () => {
    const wrapper = mountWren()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the date divider with a date label', () => {
    const wrapper = mountWren()
    const dateLabel = wrapper.find('.wren-view__date-label')
    expect(dateLabel.exists()).toBe(true)
    expect(dateLabel.text().length).toBeGreaterThan(0)
  })

  // -- Loading state --

  it('shows loading indicator while store.loading is true', () => {
    const wrapper = mountWren({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('does not show empty-state when loading', () => {
    const wrapper = mountWren({ loading: true, messages: [] })
    expect(wrapper.text()).not.toContain('Start a conversation with Wren')
  })

  // -- Empty state --

  it('shows empty-state message when messages array is empty and not loading', () => {
    const wrapper = mountWren({ messages: [], loading: false })
    expect(wrapper.text()).toContain('Start a conversation with Wren')
  })

  // -- Messages --

  it('does not show empty-state when messages are present', () => {
    const wrapper = mountWren({ messages: [buildMessage()], loading: false })
    expect(wrapper.text()).not.toContain('Start a conversation with Wren')
  })

  it('renders a WrenBubble stub for each message', () => {
    const messages = [
      buildMessage({ id: 'm1', sender: 'user' }),
      buildMessage({ id: 'm2', sender: 'coach' })
    ]
    const wrapper = mountWren({ messages, loading: false })
    const bubbles = wrapper.findAll('wren-bubble-stub')
    expect(bubbles).toHaveLength(2)
  })

  it('renders no WrenBubble stubs when message list is empty', () => {
    const wrapper = mountWren({ messages: [], loading: false })
    const bubbles = wrapper.findAll('wren-bubble-stub')
    expect(bubbles).toHaveLength(0)
  })

  // -- Quick-prompt chips --

  it('renders 4 quick-prompt chips', () => {
    const wrapper = mountWren()
    const chips = wrapper.findAll('.wren-view__chip')
    expect(chips).toHaveLength(4)
  })

  it('chip text matches QUICK_PROMPTS', () => {
    const wrapper = mountWren()
    const text = wrapper.text()
    for (const prompt of QUICK_PROMPTS_LIST) {
      expect(text).toContain(prompt)
    }
  })

  it('clicking a chip calls fillFromChip with the first prompt', async () => {
    const wrapper = mountWren()
    const chips = wrapper.findAll('.wren-view__chip')
    await chips[0].trigger('click')
    expect(mockFillFromChip).toHaveBeenCalledWith(QUICK_PROMPTS_LIST[0])
  })

  it('clicking the second chip passes the correct prompt', async () => {
    const wrapper = mountWren()
    const chips = wrapper.findAll('.wren-view__chip')
    await chips[1].trigger('click')
    expect(mockFillFromChip).toHaveBeenCalledWith(QUICK_PROMPTS_LIST[1])
  })

  it('clicking the third chip passes the correct prompt', async () => {
    const wrapper = mountWren()
    const chips = wrapper.findAll('.wren-view__chip')
    await chips[2].trigger('click')
    expect(mockFillFromChip).toHaveBeenCalledWith(QUICK_PROMPTS_LIST[2])
  })

  it('clicking the fourth chip passes the correct prompt', async () => {
    const wrapper = mountWren()
    const chips = wrapper.findAll('.wren-view__chip')
    await chips[3].trigger('click')
    expect(mockFillFromChip).toHaveBeenCalledWith(QUICK_PROMPTS_LIST[3])
  })

  // -- Input bar (WEB-T08-013 fix) --

  it('renders the message input with aria-label', () => {
    const wrapper = mountWren()
    const input = wrapper.find('.wren-view__input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('aria-label')).toBe('Message Wren')
  })

  it('input has correct placeholder', () => {
    const wrapper = mountWren()
    const input = wrapper.find('.wren-view__input')
    expect(input.attributes('placeholder')).toBe('Tell Wren anything…')
  })

  it('renders the send button with aria-label "Send message"', () => {
    const wrapper = mountWren()
    const sendBtn = wrapper.find('.wren-view__send')
    expect(sendBtn.exists()).toBe(true)
    expect(sendBtn.attributes('aria-label')).toBe('Send message')
  })

  it('send button is disabled when draft is empty (not sending)', () => {
    const wrapper = mountWren({ sending: false, draft: '' })
    const sendBtn = wrapper.find('.wren-view__send')
    // !draft.trim() = true → disabled
    expect(sendBtn.attributes('disabled')).toBeDefined()
  })

  it('send button is disabled when store.sending is true (draft non-empty)', async () => {
    const wrapper = mountWren({ sending: true, draft: 'Hello' })
    await wrapper.vm.$nextTick()
    const sendBtn = wrapper.find('.wren-view__send')
    // !draft.trim() = false, store.sending = true → disabled
    expect(sendBtn.attributes('disabled')).toBeDefined()
  })

  it('submitting the form (or clicking send) calls sendMessage (WEB-W4-15)', async () => {
    // The send button is now type="submit" inside a <form @submit.prevent>,
    // so the native browser submit flow is what reaches sendMessage. We
    // trigger the form submit directly to exercise that wiring.
    const wrapper = mountWren({ sending: false, draft: 'Hello' })
    const form = wrapper.find('.wren-view__input-container')
    await form.trigger('submit.prevent')
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })

  it('keydown on input calls handleKeydown', async () => {
    const wrapper = mountWren()
    const input = wrapper.find('.wren-view__input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(mockHandleKeydown).toHaveBeenCalledTimes(1)
  })

  // -- today computed --

  it('today computed returns a non-empty date string', () => {
    const wrapper = mountWren()
    expect(typeof wrapper.vm.today).toBe('string')
    expect(wrapper.vm.today.length).toBeGreaterThan(0)
  })

  it('today computed contains a day of the week', () => {
    const wrapper = mountWren()
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    expect(days.some(d => wrapper.vm.today.includes(d))).toBe(true)
  })

  // -- fillFromChip exposed --

  it('fillFromChip is returned from setup and accessible on vm', () => {
    const wrapper = mountWren()
    expect(typeof wrapper.vm.fillFromChip).toBe('function')
  })

  // -- Draft model --

  it('input v-model is bound to draft ref', async () => {
    const wrapper = mountWren()
    const input = wrapper.find('.wren-view__input')
    await input.setValue('Test message')
    // v-model updates the ref — wrapper.vm.draft is the draftRef
    expect(input.element.value).toBe('Test message')
  })

  // -- Bubble event wiring --

  describe('WrenBubble event forwarding', () => {
    function mountWithActionsBubbleStub(eventName) {
      // Replace the WrenBubble stub with one that emits the chosen event
      // (undo / confirm / cancel) on click so we can assert that the
      // inline arrow handler in WrenView reaches store.<method>.
      const undoSpy = vi.fn()
      const confirmSpy = vi.fn()
      const cancelSpy = vi.fn()
      fakeStore = {
        messages: [buildMessage({ sender: 'coach', actions: [] })],
        loading: false,
        sending: false,
        error: '',
        load: vi.fn().mockResolvedValue(undefined),
        send: vi.fn().mockResolvedValue(undefined),
        undo: undoSpy,
        confirm: confirmSpy,
        cancel: cancelSpy
      }
      draftRef = ref('')
      const wrapper = mount(WrenView, {
        global: {
          stubs: {
            ScreenHeading: true,
            WrenBubble: {
              props: ['message'],
              emits: ['action', 'undo', 'confirm', 'cancel'],
              template: `<div class="wb-stub" @click="$emit('${eventName}', 'tok-${eventName}')">{{ message.text }}</div>`
            }
          },
          plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
        }
      })
      return { wrapper, undoSpy, confirmSpy, cancelSpy }
    }

    it('@undo from WrenBubble routes to store.undo with the token', async () => {
      const { wrapper, undoSpy } = mountWithActionsBubbleStub('undo')
      await wrapper.find('.wb-stub').trigger('click')
      expect(undoSpy).toHaveBeenCalledWith('tok-undo')
    })

    it('@confirm from WrenBubble routes to store.confirm with the token', async () => {
      const { wrapper, confirmSpy } = mountWithActionsBubbleStub('confirm')
      await wrapper.find('.wb-stub').trigger('click')
      expect(confirmSpy).toHaveBeenCalledWith('tok-confirm')
    })

    it('@cancel from WrenBubble routes to store.cancel with the token', async () => {
      const { wrapper, cancelSpy } = mountWithActionsBubbleStub('cancel')
      await wrapper.find('.wb-stub').trigger('click')
      expect(cancelSpy).toHaveBeenCalledWith('tok-cancel')
    })
  })

  // -- store.loading watcher (line ~115) --
  //
  // setup() initialises `loaded` from the current store.loading and also
  // sets up `watch(() => store.loading, isLoading => { if (!isLoading) loaded = true })`
  // so a store that starts in the loading state still flips to "ready" once
  // the initial load resolves. The earlier suite only covered the
  // synchronous mount paths; this one drives the watcher branch by mutating
  // a reactive fake store after mount.

  describe('store.loading watcher', () => {
    function mountWithReactiveStore({ messages = [], loading = true } = {}) {
      const undoSpy = vi.fn()
      const confirmSpy = vi.fn()
      const cancelSpy = vi.fn()
      // reactive() so that the watcher source `() => store.loading` re-runs
      // when we mutate fakeStore.loading below.
      fakeStore = reactive({
        messages,
        loading,
        sending: false,
        error: '',
        load: vi.fn().mockResolvedValue(undefined),
        send: vi.fn().mockResolvedValue(undefined),
        undo: undoSpy,
        confirm: confirmSpy,
        cancel: cancelSpy
      })
      draftRef = ref('')
      const wrapper = mount(WrenView, {
        global: {
          stubs: globalStubs,
          plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
        }
      })
      return wrapper
    }

    it('flips `loaded` true when store.loading transitions true → false (covers watch())', async () => {
      const wrapper = mountWithReactiveStore({ loading: true })
      // Pre-watcher: loaded starts false because loading was true at setup.
      expect(wrapper.vm.loaded).toBe(false)
      expect(wrapper.text()).toContain('Loading')

      // Flip loading false — the watcher should set loaded true on next tick.
      fakeStore.loading = false
      await nextTick()
      await flushPromises()

      expect(wrapper.vm.loaded).toBe(true)
    })

    it('watcher does NOT flip loaded false when store.loading transitions false → true after first load', async () => {
      // Start loaded (loading false), then flip loading true — the watcher's
      // `if (!isLoading) loaded = true` branch should be skipped, so loaded
      // stays true. This guards the inverted-condition regression.
      const wrapper = mountWithReactiveStore({ loading: false })
      expect(wrapper.vm.loaded).toBe(true)

      fakeStore.loading = true
      await nextTick()
      await flushPromises()

      // Even though store is "loading" again (e.g., a refresh), the first
      // load already resolved so loaded stays true.
      expect(wrapper.vm.loaded).toBe(true)
    })

    it('shows empty-state after the watcher flips loaded (loading false, no messages)', async () => {
      const wrapper = mountWithReactiveStore({ loading: true, messages: [] })
      // While loading, the empty-state copy is suppressed.
      expect(wrapper.text()).not.toContain('Start a conversation with Wren')

      fakeStore.loading = false
      await nextTick()
      await flushPromises()

      // Watcher flipped loaded → empty-state copy now renders.
      expect(wrapper.text()).toContain('Start a conversation with Wren')
    })
  })
})
