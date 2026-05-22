import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WrenBubble from '@/components/wren/WrenBubble.vue'

const userMessage = {
  id: 'm1',
  sender: 'user',
  text: 'Hello Wren!',
  actions: [],
  createdAt: '2026-05-21T08:00:00Z'
}

const coachMessage = {
  id: 'm2',
  sender: 'coach',
  text: 'Hi there! How can I help?',
  actions: [],
  createdAt: '2026-05-21T08:01:00Z'
}

const coachWithActions = {
  id: 'm3',
  sender: 'coach',
  text: 'Here are some options:',
  actions: ['Plan my day', 'Review goals'],
  createdAt: '2026-05-21T08:02:00Z'
}

describe('WrenBubble', () => {
  describe('user bubble', () => {
    it('renders the user message text', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.text()).toContain('Hello Wren!')
    })

    it('aligns to the right (wren-bubble--user)', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.find('.wren-bubble--user').exists()).toBe(true)
    })

    it('does not render action buttons', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.find('button').exists()).toBe(false)
    })
  })

  describe('coach bubble', () => {
    it('renders the coach message text', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.text()).toContain('Hi there! How can I help?')
    })

    it('aligns to the left (wren-bubble--coach)', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble--coach').exists()).toBe(true)
    })

    it('does not render action buttons when actions is empty', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      const actionArea = wrapper.findAll('button-stub')
      expect(actionArea).toHaveLength(0)
    })

    it('renders action buttons when actions are present', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachWithActions },
        global: { stubs: { Button: { template: '<button><slot/></button>' } } }
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toBe('Plan my day')
      expect(buttons[1].text()).toBe('Review goals')
    })

    it('emits "action" with the action string when a button is clicked', async () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachWithActions },
        global: {
          stubs: { Button: { template: '<button @click="$emit(\'click\')"><slot/></button>' } }
        }
      })
      await wrapper.findAll('button')[0].trigger('click')
      expect(wrapper.emitted('action')?.[0]).toEqual(['Plan my day'])
    })

    it('applies accent styling when actions are present (wren-bubble__body--accent)', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachWithActions },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__body--accent').exists()).toBe(true)
    })

    it('uses default background when no actions (wren-bubble__body--default)', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__body--default').exists()).toBe(true)
    })
  })

  describe('timestamp', () => {
    it('renders a formatted time', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: userMessage },
        global: { stubs: { Button: true } }
      })
      // The formatted time contains AM/PM or colon — just ensure it's not empty
      const timeEl = wrapper.find('.wren-bubble__timestamp')
      expect(timeEl.text()).not.toBe('')
    })

    it('renders an empty time when createdAt is null', () => {
      const msg = { ...userMessage, createdAt: null }
      const wrapper = mount(WrenBubble, { props: { message: msg } })
      const timeEl = wrapper.find('.wren-bubble__timestamp')
      expect(timeEl.text()).toBe('')
    })
  })
})
