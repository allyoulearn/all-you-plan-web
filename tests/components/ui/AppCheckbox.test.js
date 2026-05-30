import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'

describe('AppCheckbox', () => {
  it('emits the toggled value on click (false -> true)', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('emits false when currently checked', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows a check icon when modelValue is true', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('hides the check icon when modelValue is false', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('applies checked class when modelValue is true', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('checkbox--checked')
  })

  it('applies unchecked class when modelValue is false', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('checkbox--unchecked')
  })

  it('applies size via the --checkbox-size custom property (WEB-W2-41)', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, size: 28 } })
    const style = wrapper.attributes('style')
    expect(style).toContain('--checkbox-size: 28px')
  })

  it('defaults size to 20 via the --checkbox-size custom property', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    const style = wrapper.attributes('style')
    expect(style).toContain('--checkbox-size: 20px')
  })

  it('has role="checkbox" for screen readers', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.attributes('role')).toBe('checkbox')
  })

  it('sets aria-checked to false when unchecked', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.attributes('aria-checked')).toBe('false')
  })

  it('sets aria-checked to true when checked', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
  })

  it('defaults aria-label to Complete', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.attributes('aria-label')).toBe('Complete')
  })

  it('accepts a custom aria-label', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, ariaLabel: 'Mark as done' } })
    expect(wrapper.attributes('aria-label')).toBe('Mark as done')
  })

  it('is a button element', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('has checkbox class for focus-visible SCSS targeting', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('checkbox')
  })

  it('does not emit when toggle is called directly with disabled=true', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } })
    // Call toggle directly to exercise the disabled guard branch
    wrapper.vm.toggle()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not add the just-checked class on initial mount when modelValue starts true', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('adds the just-checked class on user click (false → true)', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.classes()).toContain('checkbox--just-checked')
  })

  it('does not add the just-checked class on user click (true → false)', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    await wrapper.trigger('click')
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('does not add the just-checked class on click when disabled', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('adds the just-checked class on false → true transition', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.classes()).toContain('checkbox--just-checked')
  })

  it('does not add the just-checked class on true → false transition', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('clears the just-checked class after the pulse duration', async () => {
    vi.useFakeTimers()

    try {
      const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
      await wrapper.setProps({ modelValue: true })
      expect(wrapper.classes()).toContain('checkbox--just-checked')

      vi.advanceTimersByTime(400)
      await wrapper.vm.$nextTick()

      expect(wrapper.classes()).not.toContain('checkbox--just-checked')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('AppProgressBar', () => {
  it('clamps the fill width to 0-100%', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 1.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 100%')
  })

  it('clamps negative values to 0%', () => {
    const wrapper = mount(AppProgressBar, { props: { value: -0.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 0%')
  })

  it('renders 50% fill for value 0.5', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 0.5 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 50%')
  })

  it('renders 0% fill by default', () => {
    const wrapper = mount(AppProgressBar)
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 0%')
  })

  it('applies normal modifier by default', () => {
    const wrapper = mount(AppProgressBar)
    expect(wrapper.classes()).toContain('progress-bar--normal')
  })

  it('applies thin modifier when thin is true', () => {
    const wrapper = mount(AppProgressBar, { props: { thin: true } })
    expect(wrapper.classes()).toContain('progress-bar--thin')
  })

  it('does not apply thin modifier when thin is false', () => {
    const wrapper = mount(AppProgressBar, { props: { thin: false } })
    expect(wrapper.classes()).not.toContain('progress-bar--thin')
  })

  it('renders with 100% fill for value 1', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 1 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 100%')
  })

  it('has a progress-bar__fill child element', () => {
    const wrapper = mount(AppProgressBar)
    expect(wrapper.find('.progress-bar__fill').exists()).toBe(true)
  })
})
