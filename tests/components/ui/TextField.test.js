import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextField from '@/components/ui/TextField.vue'

describe('TextField', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TextField)
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('shows the invalid state when invalid', () => {
    const wrapper = mount(TextField, { props: { invalid: true } })
    expect(wrapper.find('span.text-field__wrapper--invalid').exists()).toBe(true)
  })

  it('shows the valid state by default', () => {
    const wrapper = mount(TextField)
    expect(wrapper.find('span.text-field__wrapper--valid').exists()).toBe(true)
  })

  it('shows the valid state when invalid is false', () => {
    const wrapper = mount(TextField, { props: { invalid: false } })
    expect(wrapper.find('span.text-field__wrapper--valid').exists()).toBe(true)
    expect(wrapper.find('span.text-field__wrapper--invalid').exists()).toBe(false)
  })

  it('renders the label text when label prop is provided', () => {
    const wrapper = mount(TextField, { props: { label: 'Email address' } })
    expect(wrapper.find('.text-field__label').text()).toBe('Email address')
  })

  it('does not render the label element when label is empty', () => {
    const wrapper = mount(TextField, { props: { label: '' } })
    expect(wrapper.find('.text-field__label').exists()).toBe(false)
  })

  it('passes the placeholder to the native input', () => {
    const wrapper = mount(TextField, { props: { placeholder: 'Enter value' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter value')
  })

  it('passes the type to the native input', () => {
    const wrapper = mount(TextField, { props: { type: 'password' } })
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('defaults input type to text', () => {
    const wrapper = mount(TextField)
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('binds modelValue to the input value', () => {
    const wrapper = mount(TextField, { props: { modelValue: 'prefilled' } })
    expect(wrapper.find('input').element.value).toBe('prefilled')
  })

  it('renders a leading icon when icon prop is provided', () => {
    const wrapper = mount(TextField, { props: { icon: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not render an icon when icon is empty', () => {
    const wrapper = mount(TextField)
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('disables the input when disabled is true', () => {
    const wrapper = mount(TextField, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('is not disabled by default', () => {
    const wrapper = mount(TextField)
    expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
  })

  it('wraps everything in a label element', () => {
    const wrapper = mount(TextField)
    expect(wrapper.element.tagName).toBe('LABEL')
  })

  it('emits the correct value after multiple inputs', async () => {
    const wrapper = mount(TextField)
    await wrapper.find('input').setValue('first')
    await wrapper.find('input').setValue('second')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted[1]).toEqual(['second'])
  })
})
