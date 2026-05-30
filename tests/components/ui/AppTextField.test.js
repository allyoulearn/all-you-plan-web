import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTextField from '@/components/ui/AppTextField.vue'

describe('AppTextField', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppTextField)
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('shows the invalid state when invalid', () => {
    const wrapper = mount(AppTextField, { props: { invalid: true } })
    expect(wrapper.find('span.text-field__wrapper--invalid').exists()).toBe(true)
  })

  it('shows the valid state by default', () => {
    const wrapper = mount(AppTextField)
    expect(wrapper.find('span.text-field__wrapper--valid').exists()).toBe(true)
  })

  it('shows the valid state when invalid is false', () => {
    const wrapper = mount(AppTextField, { props: { invalid: false } })
    expect(wrapper.find('span.text-field__wrapper--valid').exists()).toBe(true)
    expect(wrapper.find('span.text-field__wrapper--invalid').exists()).toBe(false)
  })

  it('renders the label text when label prop is provided', () => {
    const wrapper = mount(AppTextField, { props: { label: 'Email address' } })
    expect(wrapper.find('.text-field__label').text()).toBe('Email address')
  })

  it('does not render the label element when label is empty', () => {
    const wrapper = mount(AppTextField, { props: { label: '' } })
    expect(wrapper.find('.text-field__label').exists()).toBe(false)
  })

  it('passes the placeholder to the native input', () => {
    const wrapper = mount(AppTextField, { props: { placeholder: 'Enter value' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter value')
  })

  it('passes the type to the native input', () => {
    const wrapper = mount(AppTextField, { props: { type: 'password' } })
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('defaults input type to text', () => {
    const wrapper = mount(AppTextField)
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('binds modelValue to the input value', () => {
    const wrapper = mount(AppTextField, { props: { modelValue: 'prefilled' } })
    expect(wrapper.find('input').element.value).toBe('prefilled')
  })

  it('renders a leading icon when icon prop is provided', () => {
    const wrapper = mount(AppTextField, { props: { icon: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not render an icon when icon is empty', () => {
    const wrapper = mount(AppTextField)
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('disables the input when disabled is true', () => {
    const wrapper = mount(AppTextField, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('is not disabled by default', () => {
    const wrapper = mount(AppTextField)
    expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
  })

  it('wraps everything in a label element', () => {
    const wrapper = mount(AppTextField)
    expect(wrapper.element.tagName).toBe('LABEL')
  })

  it('emits the correct value after multiple inputs', async () => {
    const wrapper = mount(AppTextField)
    await wrapper.find('input').setValue('first')
    await wrapper.find('input').setValue('second')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted[1]).toEqual(['second'])
  })

  describe('aria-invalid (WEB-W2-30)', () => {
    it('sets aria-invalid="true" on the input when invalid is true', () => {
      const wrapper = mount(AppTextField, { props: { invalid: true } })
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('omits aria-invalid when invalid is false', () => {
      const wrapper = mount(AppTextField, { props: { invalid: false } })
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('attrs passthrough (WEB-W2-31)', () => {
    it('passes autocomplete onto the input, not the label', () => {
      const wrapper = mount(AppTextField, { attrs: { autocomplete: 'current-password' } })
      expect(wrapper.find('input').attributes('autocomplete')).toBe('current-password')
      expect(wrapper.element.getAttribute('autocomplete')).toBeNull()
    })

    it('passes required onto the input', () => {
      const wrapper = mount(AppTextField, { attrs: { required: '' } })
      expect(wrapper.find('input').attributes('required')).toBeDefined()
    })

    it('passes id onto the input', () => {
      const wrapper = mount(AppTextField, { attrs: { id: 'email-field' } })
      expect(wrapper.find('input').attributes('id')).toBe('email-field')
    })

    it('passes inputmode onto the input', () => {
      const wrapper = mount(AppTextField, { attrs: { inputmode: 'email' } })
      expect(wrapper.find('input').attributes('inputmode')).toBe('email')
    })

    it('passes name onto the input', () => {
      const wrapper = mount(AppTextField, { attrs: { name: 'email' } })
      expect(wrapper.find('input').attributes('name')).toBe('email')
    })

    it('passes maxlength onto the input', () => {
      const wrapper = mount(AppTextField, { attrs: { maxlength: '50' } })
      expect(wrapper.find('input').attributes('maxlength')).toBe('50')
    })
  })

  describe('type validator (WEB-W2-30)', () => {
    it('accepts a recognized HTML input type', () => {
      // No error or warning expected. Vue's prop validator runs in dev only;
      // setting a valid type should round-trip onto the input.
      const wrapper = mount(AppTextField, { props: { type: 'email' } })
      expect(wrapper.find('input').attributes('type')).toBe('email')
    })
  })
})
