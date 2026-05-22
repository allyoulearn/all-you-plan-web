import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' }
]

describe('SegmentedControl', () => {
  it('renders one button per option', () => {
    const wrapper = mount(SegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('emits the option value on click', async () => {
    const wrapper = mount(SegmentedControl, { props: { modelValue: 'a', options } })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['b'])
  })
})
