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
})
