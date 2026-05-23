import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '@/components/ui/Icon.vue'

describe('Icon', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an svg for a known name', () => {
    const wrapper = mount(Icon, { props: { name: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders nothing for an unknown name', () => {
    const wrapper = mount(Icon, { props: { name: 'nope' } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('applies the size via the --icon-size custom property (WEB-W2-41)', () => {
    const wrapper = mount(Icon, { props: { name: 'search', size: 24 } })
    const style = wrapper.find('svg').attributes('style')
    expect(style).toContain('--icon-size: 24px')
  })

  it('defaults size to 20 via the --icon-size custom property', () => {
    const wrapper = mount(Icon, { props: { name: 'search' } })
    const style = wrapper.find('svg').attributes('style')
    expect(style).toContain('--icon-size: 20px')
  })

  it('sets aria-hidden on the svg', () => {
    const wrapper = mount(Icon, { props: { name: 'search' } })
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('renders a solid variant when solid prop is true', () => {
    // 'plus' exists in both outline and solid maps
    const wrapper = mount(Icon, { props: { name: 'plus', solid: true } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('defaults to outline variant (solid is false)', () => {
    const wrapper = mount(Icon, { props: { name: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders known icons: check, plus, search, moon, sun', () => {
    for (const name of ['check', 'plus', 'search', 'moon', 'sun']) {
      const wrapper = mount(Icon, { props: { name } })
      expect(wrapper.find('svg').exists()).toBe(true)
    }
  })

  it('logs a console.warn in dev mode for unknown icon names', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Icon, { props: { name: 'does-not-exist' } })
    expect(warnSpy).toHaveBeenCalledWith('[Icon] Unknown icon name: "does-not-exist"')
  })

  it('does not render a solid icon for unknown name', () => {
    const wrapper = mount(Icon, { props: { name: 'does-not-exist', solid: true } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
