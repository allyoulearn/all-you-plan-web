import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'

describe('Card', () => {
  it('renders slot content', () => {
    const wrapper = mount(Card, { slots: { default: 'Body' } })
    expect(wrapper.text()).toContain('Body')
  })

  it('defaults to the default variant', () => {
    const wrapper = mount(Card)
    expect(wrapper.classes()).toContain('card--default')
  })

  it('uses the accent variant class', () => {
    const wrapper = mount(Card, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('card--accent')
  })

  it('renders as a div by default', () => {
    const wrapper = mount(Card)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders as a different element when as prop is provided', () => {
    const wrapper = mount(Card, { props: { as: 'section' } })
    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('renders as article when as is article', () => {
    const wrapper = mount(Card, { props: { as: 'article' } })
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('always has the card class', () => {
    const wrapper = mount(Card)
    expect(wrapper.classes()).toContain('card')
  })

  it('renders multiple slot children', () => {
    const wrapper = mount(Card, {
      slots: { default: '<span>A</span><span>B</span>' }
    })
    expect(wrapper.findAll('span')).toHaveLength(2)
  })
})

describe('Pill', () => {
  it('renders slot content', () => {
    const wrapper = mount(Pill, { slots: { default: 'Active' } })
    expect(wrapper.text()).toContain('Active')
  })

  it('defaults to the default variant', () => {
    const wrapper = mount(Pill)
    expect(wrapper.classes()).toContain('pill--default')
  })

  it('renders a dot for the dot variant', () => {
    const wrapper = mount(Pill, { props: { variant: 'dot' }, slots: { default: 'x' } })
    expect(wrapper.find('span.pill__dot').exists()).toBe(true)
  })

  it('does not render a dot for non-dot variants', () => {
    const wrapper = mount(Pill, { props: { variant: 'accent' }, slots: { default: 'x' } })
    expect(wrapper.find('span.pill__dot').exists()).toBe(false)
  })

  it('applies the accent variant class', () => {
    const wrapper = mount(Pill, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('pill--accent')
  })

  it('applies the soft variant class', () => {
    const wrapper = mount(Pill, { props: { variant: 'soft' } })
    expect(wrapper.classes()).toContain('pill--soft')
  })

  it('renders as a span element', () => {
    const wrapper = mount(Pill)
    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('does not render dot for default variant', () => {
    const wrapper = mount(Pill, { props: { variant: 'default' } })
    expect(wrapper.find('.pill__dot').exists()).toBe(false)
  })
})
