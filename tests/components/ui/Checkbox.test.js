import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from '@/components/ui/Checkbox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

describe('Checkbox', () => {
  it('emits the toggled value on click', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('ProgressBar', () => {
  it('clamps the fill width to 0-100%', () => {
    const wrapper = mount(ProgressBar, { props: { value: 1.5 } })
    expect(wrapper.find('.bg-accent').attributes('style')).toContain('width: 100%')
  })
})
