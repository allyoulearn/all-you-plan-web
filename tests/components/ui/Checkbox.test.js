import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from '@/components/ui/Checkbox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

describe('Checkbox', () => {
  it('emits the toggled value on click (false -> true)', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('emits false when currently checked', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows a check icon when modelValue is true', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('hides the check icon when modelValue is false', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('applies checked class when modelValue is true', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('checkbox--checked')
  })

  it('applies unchecked class when modelValue is false', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('checkbox--unchecked')
  })

  it('applies size via inline style', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, size: 28 } })
    const style = wrapper.attributes('style')
    expect(style).toContain('width: 28px')
    expect(style).toContain('height: 28px')
  })

  it('defaults size to 20', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    const style = wrapper.attributes('style')
    expect(style).toContain('width: 20px')
    expect(style).toContain('height: 20px')
  })

  it('has role="checkbox" for screen readers', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.attributes('role')).toBe('checkbox')
  })

  it('sets aria-checked to false when unchecked', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.attributes('aria-checked')).toBe('false')
  })

  it('sets aria-checked to true when checked', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
  })

  it('defaults aria-label to Complete', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.attributes('aria-label')).toBe('Complete')
  })

  it('accepts a custom aria-label', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, ariaLabel: 'Mark as done' } })
    expect(wrapper.attributes('aria-label')).toBe('Mark as done')
  })

  it('is a button element', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('has checkbox class for focus-visible SCSS targeting', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('checkbox')
  })

  it('does not emit when toggle is called directly with disabled=true', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    // Call toggle directly to exercise the disabled guard branch
    wrapper.vm.toggle()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('ProgressBar', () => {
  it('clamps the fill width to 0-100%', () => {
    const wrapper = mount(ProgressBar, { props: { value: 1.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 100%')
  })

  it('clamps negative values to 0%', () => {
    const wrapper = mount(ProgressBar, { props: { value: -0.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 0%')
  })

  it('renders 50% fill for value 0.5', () => {
    const wrapper = mount(ProgressBar, { props: { value: 0.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 50%')
  })

  it('renders 0% fill by default', () => {
    const wrapper = mount(ProgressBar)
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 0%')
  })

  it('applies normal modifier by default', () => {
    const wrapper = mount(ProgressBar)
    expect(wrapper.classes()).toContain('progress-bar--normal')
  })

  it('applies thin modifier when thin is true', () => {
    const wrapper = mount(ProgressBar, { props: { thin: true } })
    expect(wrapper.classes()).toContain('progress-bar--thin')
  })

  it('does not apply thin modifier when thin is false', () => {
    const wrapper = mount(ProgressBar, { props: { thin: false } })
    expect(wrapper.classes()).not.toContain('progress-bar--thin')
  })

  it('renders with 100% fill for value 1', () => {
    const wrapper = mount(ProgressBar, { props: { value: 1 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 100%')
  })

  it('has a progress-bar__fill child element', () => {
    const wrapper = mount(ProgressBar)
    expect(wrapper.find('.progress-bar__fill').exists()).toBe(true)
  })
})
