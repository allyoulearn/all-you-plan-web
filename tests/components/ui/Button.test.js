import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'
import IconButton from '@/components/ui/IconButton.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Save' } })
    expect(wrapper.text()).toContain('Save')
  })

  it('defaults to variant default and size md', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('button--default')
    expect(wrapper.classes()).toContain('button--md')
  })

  it('applies the accent variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('button--accent')
  })

  it('applies the primary variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'primary' } })
    expect(wrapper.classes()).toContain('button--primary')
  })

  it('applies the ghost variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'ghost' } })
    expect(wrapper.classes()).toContain('button--ghost')
  })

  it('applies sm size class', () => {
    const wrapper = mount(Button, { props: { size: 'sm' } })
    expect(wrapper.classes()).toContain('button--sm')
  })

  it('renders a leading icon when icon prop is provided', () => {
    const wrapper = mount(Button, { props: { icon: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders a trailing icon when iconTrailing prop is provided', () => {
    const wrapper = mount(Button, { props: { iconTrailing: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not render an icon element when neither prop is set', () => {
    const wrapper = mount(Button)
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('passes the type prop to the native button', () => {
    const wrapper = mount(Button, { props: { type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('defaults type to button', () => {
    const wrapper = mount(Button)
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('disables the button when disabled prop is true', () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is not disabled by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('has a focus-visible class applied via CSS', () => {
    // Verify the component class is on the element so SCSS can target it
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('button')
  })
})

describe('IconButton', () => {
  it('renders an svg icon', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('defaults to the default variant', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.classes()).toContain('icon-button--default')
  })

  it('applies ghost variant class', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus', variant: 'ghost' } })
    expect(wrapper.classes()).toContain('icon-button--ghost')
  })

  it('applies the size via the --icon-button-size custom property (WEB-W2-41)', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus', size: 48 } })
    const style = wrapper.attributes('style')
    expect(style).toContain('--icon-button-size: 48px')
  })

  it('defaults size to 34 via the --icon-button-size custom property', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    const style = wrapper.attributes('style')
    expect(style).toContain('--icon-button-size: 34px')
  })

  it('passes type prop to native button', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus', type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('defaults type to button', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('disables the button when disabled is true', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus', disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('has icon-button class for focus-visible SCSS targeting', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.classes()).toContain('icon-button')
  })
})
