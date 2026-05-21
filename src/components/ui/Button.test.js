import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'
import IconButton from './IconButton.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Save' } })
    expect(wrapper.text()).toContain('Save')
  })

  it('applies the accent variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('bg-accent')
  })
})

describe('IconButton', () => {
  it('renders an svg icon', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
