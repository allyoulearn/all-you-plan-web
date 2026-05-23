import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import WrenPanel from '@/components/layout/WrenPanel.vue'
import { useWrenStore } from '@/stores/wren.store.js'
import { QUICK_PROMPTS } from '@/composables/useWrenChat.js'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

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

function mountPanel(storeOverrides = {}) {
  setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  const store = useWrenStore()
  // Ensure load() returns a Promise so useWrenChat's .catch() works
  store.load = vi.fn().mockResolvedValue(undefined)
  store.send = vi.fn().mockResolvedValue(undefined)

  // Apply state overrides directly to the reactive store
  Object.assign(store, {
    messages: [],
    loading: false,
    sending: false,
    error: '',
    ...storeOverrides
  })

  return mount(WrenPanel, {
    global: {
      plugins: [i18n],
      stubs: {
        WrenBubble: {
          props: ['message'],
          template: '<div class="wren-bubble-stub">{{ message.text }}</div>'
        }
      }
    },
    attachTo: document.body
  })
}

describe('WrenPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('header', () => {
    it('renders the panel as aside element', () => {
      const wrapper = mountPanel()
      expect(wrapper.element.tagName).toBe('ASIDE')
    })

    it('displays the name Wren', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__name').text()).toBe('Wren')
    })

    it('displays the role "Your coach"', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__role').text()).toBe('Your coach')
    })

    it('shows a live status indicator', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__status').text()).toContain('live')
    })

    it('has a status dot', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__status-dot').exists()).toBe(true)
    })

    it('renders avatar with "W"', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__avatar').text()).toBe('W')
    })
  })

  describe('loading state', () => {
    it('shows loading text when store.loading is true', () => {
      const wrapper = mountPanel({ loading: true })
      expect(wrapper.find('.wren-panel__loading').exists()).toBe(true)
      expect(wrapper.find('.wren-panel__loading').text()).toContain('Loading')
    })

    it('does not show loading text when loading is false', () => {
      const wrapper = mountPanel({ loading: false })
      expect(wrapper.find('.wren-panel__loading').exists()).toBe(false)
    })
  })

  describe('empty state', () => {
    it('shows empty state text when messages are empty and not loading', () => {
      const wrapper = mountPanel({ loading: false, messages: [] })
      expect(wrapper.find('.wren-panel__empty').exists()).toBe(true)
      expect(wrapper.find('.wren-panel__empty-text').text()).toBe('Say hello to Wren.')
    })

    it('does not show empty state when messages exist', () => {
      const messages = [{ id: '1', sender: 'user', text: 'Hello', actions: [], createdAt: null }]
      const wrapper = mountPanel({ loading: false, messages })
      expect(wrapper.find('.wren-panel__empty').exists()).toBe(false)
    })

    it('does not show empty text when loading (loading takes priority)', () => {
      const wrapper = mountPanel({ loading: true, messages: [] })
      expect(wrapper.find('.wren-panel__empty').exists()).toBe(false)
    })
  })

  describe('messages', () => {
    it('renders WrenBubble for each message', () => {
      const messages = [
        { id: '1', sender: 'user', text: 'Hi', actions: [], createdAt: null },
        { id: '2', sender: 'coach', text: 'Hello!', actions: [], createdAt: null }
      ]
      const wrapper = mountPanel({ loading: false, messages })
      const bubbles = wrapper.findAll('.wren-bubble-stub')
      expect(bubbles).toHaveLength(2)
    })

    it('does not render bubbles when messages is empty', () => {
      const wrapper = mountPanel({ loading: false, messages: [] })
      expect(wrapper.findAll('.wren-bubble-stub')).toHaveLength(0)
    })

    it('renders message text via stub', () => {
      const messages = [
        { id: '1', sender: 'user', text: 'Test message', actions: [], createdAt: null }
      ]
      const wrapper = mountPanel({ loading: false, messages })
      expect(wrapper.find('.wren-bubble-stub').text()).toBe('Test message')
    })
  })

  describe('fillFromChip via WrenBubble action', () => {
    it('WrenBubble @action fills the draft input', async () => {
      // Use an action-emitting stub to cover the @action="fillFromChip" handler
      setActivePinia(createTestingPinia({ createSpy: vi.fn }))
      const store = useWrenStore()
      store.load = vi.fn().mockResolvedValue(undefined)
      store.send = vi.fn().mockResolvedValue(undefined)
      const messages = [
        { id: '1', sender: 'coach', text: 'Hi', actions: ['Plan tomorrow'], createdAt: null }
      ]
      Object.assign(store, { messages, loading: false, sending: false, error: '' })

      const wrapper = mount(WrenPanel, {
        global: {
          plugins: [i18n],
          stubs: {
            WrenBubble: {
              props: ['message'],
              emits: ['action'],
              template:
                '<div class="wren-bubble-stub" @click="$emit(\'action\', \'Plan tomorrow\')">{{ message.text }}</div>'
            }
          }
        },
        attachTo: document.body
      })

      await wrapper.find('.wren-bubble-stub').trigger('click')
      const input = wrapper.find('.wren-panel__input')
      expect(input.element.value).toBe('Plan tomorrow')
    })
  })

  describe('quick-prompt chips', () => {
    it('renders a chip for each QUICK_PROMPTS entry', () => {
      const wrapper = mountPanel()
      const chips = wrapper.findAll('.wren-panel__chip')
      expect(chips).toHaveLength(QUICK_PROMPTS.length)
    })

    it('renders chip text matching QUICK_PROMPTS', () => {
      const wrapper = mountPanel()
      const chips = wrapper.findAll('.wren-panel__chip')
      chips.forEach((chip, i) => {
        expect(chip.text()).toBe(QUICK_PROMPTS[i])
      })
    })

    it('chip buttons have type="button" (WEB-T07-010)', () => {
      const wrapper = mountPanel()
      const chips = wrapper.findAll('.wren-panel__chip')
      chips.forEach(chip => {
        expect(chip.attributes('type')).toBe('button')
      })
    })

    it('clicking a chip fills the draft input', async () => {
      const wrapper = mountPanel()
      const firstChip = wrapper.findAll('.wren-panel__chip')[0]
      await firstChip.trigger('click')
      const input = wrapper.find('.wren-panel__input')
      expect(input.element.value).toBe(QUICK_PROMPTS[0])
    })
  })

  describe('input', () => {
    it('renders the text input', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__input').exists()).toBe(true)
    })

    it('has aria-label on the input (WEB-T07-007)', () => {
      const wrapper = mountPanel()
      const input = wrapper.find('.wren-panel__input')
      expect(input.attributes('aria-label')).toBe('Message to Wren')
    })

    it('has placeholder on the input', () => {
      const wrapper = mountPanel()
      const input = wrapper.find('.wren-panel__input')
      expect(input.attributes('placeholder')).toBe('Tell Wren anything…')
    })
  })

  describe('send button', () => {
    it('renders the send button', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__send').exists()).toBe(true)
    })

    it('has type="button" (WEB-T07-010)', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__send').attributes('type')).toBe('button')
    })

    it('has aria-label="Send message"', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__send').attributes('aria-label')).toBe('Send message')
    })

    it('is disabled when draft is empty', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.wren-panel__send').attributes('disabled')).toBeDefined()
    })

    it('is disabled when store.sending is true', async () => {
      const wrapper = mountPanel({ sending: true })
      const input = wrapper.find('.wren-panel__input')
      await input.setValue('hello')
      // store.sending=true keeps button disabled
      expect(wrapper.find('.wren-panel__send').attributes('disabled')).toBeDefined()
    })

    it('becomes enabled when draft has text and not sending', async () => {
      const wrapper = mountPanel({ sending: false })
      const input = wrapper.find('.wren-panel__input')
      await input.setValue('hello wren')
      expect(wrapper.find('.wren-panel__send').attributes('disabled')).toBeUndefined()
    })
  })

  describe('keydown handling', () => {
    it('Enter key on input does not crash', async () => {
      const wrapper = mountPanel({ sending: false })
      const input = wrapper.find('.wren-panel__input')
      await input.setValue('test message')
      await input.trigger('keydown', { key: 'Enter', shiftKey: false })
      expect(wrapper.exists()).toBe(true)
    })

    it('Shift+Enter does not send (no crash, draft kept)', async () => {
      const wrapper = mountPanel({ sending: false })
      const input = wrapper.find('.wren-panel__input')
      await input.setValue('multiline message')
      await input.trigger('keydown', { key: 'Enter', shiftKey: true })
      // draft is preserved for Shift+Enter
      expect(input.element.value).toBe('multiline message')
    })
  })

  describe('send button click', () => {
    it('clicking send button calls sendMessage', async () => {
      const wrapper = mountPanel({ sending: false })
      const store = useWrenStore()
      const input = wrapper.find('.wren-panel__input')
      await input.setValue('click send')
      await wrapper.find('.wren-panel__send').trigger('click')
      // store.send is the mock — check it was called
      expect(store.send).toHaveBeenCalledWith('click send')
    })
  })
})
