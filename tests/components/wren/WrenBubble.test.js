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

    it('applies wren-bubble__body--user class to the body', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.find('.wren-bubble__body--user').exists()).toBe(true)
    })

    it('does not render coach-side container', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.find('.wren-bubble--coach').exists()).toBe(false)
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

    it('emits "action" with the second action string when second button is clicked', async () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachWithActions },
        global: {
          stubs: { Button: { template: '<button @click="$emit(\'click\')"><slot/></button>' } }
        }
      })
      await wrapper.findAll('button')[1].trigger('click')
      expect(wrapper.emitted('action')?.[0]).toEqual(['Review goals'])
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

    it('does not apply accent class when actions is empty', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__body--accent').exists()).toBe(false)
    })

    it('actions area is hidden when no actions', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__actions').exists()).toBe(false)
    })

    it('actions area is visible when actions present', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachWithActions },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__actions').exists()).toBe(true)
    })

    it('does not apply dead --coach body class (WEB-T07-016: removed)', () => {
      // The &--coach SCSS modifier was dead code and has been removed
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__body--coach').exists()).toBe(false)
    })
  })

  describe('timestamp', () => {
    it('renders a formatted time for user message', () => {
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

    it('renders timestamp for coach message', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      const timeEl = wrapper.find('.wren-bubble__timestamp')
      expect(timeEl.text()).not.toBe('')
    })

    it('user timestamp has --right alignment class', () => {
      const wrapper = mount(WrenBubble, { props: { message: userMessage } })
      expect(wrapper.find('.wren-bubble__timestamp--right').exists()).toBe(true)
    })

    it('coach timestamp does not have --right alignment class', () => {
      const wrapper = mount(WrenBubble, {
        props: { message: coachMessage },
        global: { stubs: { Button: true } }
      })
      expect(wrapper.find('.wren-bubble__timestamp--right').exists()).toBe(false)
    })
  })

  describe('formatWhen edge cases', () => {
    it('handles an invalid ISO string gracefully (renders some output)', () => {
      const msg = { ...userMessage, createdAt: 'not-a-date' }
      const wrapper = mount(WrenBubble, { props: { message: msg } })
      // Invalid date produces "Invalid Date" or NaN — just confirm it does not throw
      expect(() => wrapper.find('.wren-bubble__timestamp').text()).not.toThrow()
    })
  })
})

// ── Action union & streaming cursor ───────────────────────────────────────────

describe('WrenBubble — action union', () => {
  it('renders WrenAppliedAction via WrenActionChip', () => {
    const action = {
      __typename: 'WrenAppliedAction',
      kind: 'task.created',
      summary: 'Added "X"',
      undoToken: 'u1',
      undoExpiresAt: new Date(Date.now() + 60_000).toISOString()
    }
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: 'Done',
          actions: [action],
          status: 'complete',
          createdAt: ''
        }
      }
    })
    expect(wrapper.text()).toContain('Added "X"')
    expect(wrapper.text()).toContain('Undo')
  })

  it('renders WrenPendingConfirmation via WrenConfirmChip', () => {
    const pending = {
      __typename: 'WrenPendingConfirmation',
      confirmToken: 'ct1',
      summary: 'Delete "X"?'
    }
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: '',
          actions: [pending],
          status: 'streaming',
          createdAt: ''
        }
      }
    })
    expect(wrapper.text()).toContain('Delete "X"?')
    expect(wrapper.text()).toContain('Confirm')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('shows streaming cursor when status=streaming on coach bubble', () => {
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: 'typ',
          actions: [],
          status: 'streaming',
          createdAt: ''
        }
      }
    })
    expect(wrapper.find('.wren-bubble__cursor').exists()).toBe(true)
  })

  it('does NOT show cursor when status=complete', () => {
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: 'done',
          actions: [],
          status: 'complete',
          createdAt: ''
        }
      }
    })
    expect(wrapper.find('.wren-bubble__cursor').exists()).toBe(false)
  })

  it('propagates undo event from chip', async () => {
    const action = {
      __typename: 'WrenAppliedAction',
      summary: 'X',
      undoToken: 'u1',
      undoExpiresAt: new Date(Date.now() + 60_000).toISOString()
    }
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: '',
          actions: [action],
          status: 'complete',
          createdAt: ''
        }
      }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('undo')).toEqual([['u1']])
  })

  it('propagates confirm and cancel events from confirm chip', async () => {
    const pending = {
      __typename: 'WrenPendingConfirmation',
      confirmToken: 'ct1',
      summary: 'X?'
    }
    const wrapper = mount(WrenBubble, {
      props: {
        message: {
          id: 'm1',
          sender: 'coach',
          text: '',
          actions: [pending],
          status: 'streaming',
          createdAt: ''
        }
      }
    })
    const btns = wrapper.findAll('button')
    await btns[0].trigger('click') // Cancel
    expect(wrapper.emitted('cancel')).toEqual([['ct1']])
    await btns[1].trigger('click') // Confirm
    expect(wrapper.emitted('confirm')).toEqual([['ct1']])
  })
})
