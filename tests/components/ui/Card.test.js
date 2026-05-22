import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'

describe('Card', () => {
  it('renders slot content', () => {
    const wrapper = mount(Card, { slots: { default: 'Body' } })
    expect(wrapper.text()).toContain('Body')
  })

  it('uses the accent glow shadow for the accent variant', () => {
    const wrapper = mount(Card, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('shadow-accent-glow')
  })
})

describe('Pill', () => {
  it('renders a dot for the dot variant', () => {
    const wrapper = mount(Pill, { props: { variant: 'dot' }, slots: { default: 'x' } })
    expect(wrapper.find('span.bg-accent').exists()).toBe(true)
  })
})
