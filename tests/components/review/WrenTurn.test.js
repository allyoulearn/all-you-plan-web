import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WrenTurn from '@/components/review/WrenTurn.vue'

const stubs = { AppIcon: { template: '<span class="icon" />' } }

describe('WrenTurn', () => {
  it('renders the prompt text', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'How did today feel?' },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('How did today feel?')
  })

  it('renders the optional data callout when provided', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p', callout: '5 of 8 · 3-day streak' },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('5 of 8 · 3-day streak')
  })

  it('does not render a callout element when callout prop is empty', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      global: { stubs }
    })

    expect(wrapper.find('.wren-turn__callout').exists()).toBe(false)
  })

  it('renders a Wren mark via AppIcon stub', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      global: { stubs }
    })

    expect(wrapper.find('.icon').exists()).toBe(true)
  })

  it('renders the default slot beneath the prompt', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      slots: { default: '<p class="custom-child">child</p>' },
      global: { stubs }
    })

    expect(wrapper.find('.custom-child').exists()).toBe(true)
  })
})
