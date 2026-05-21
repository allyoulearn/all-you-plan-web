import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders an svg for a known name', () => {
    const wrapper = mount(Icon, { props: { name: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders nothing for an unknown name', () => {
    const wrapper = mount(Icon, { props: { name: 'nope' } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
