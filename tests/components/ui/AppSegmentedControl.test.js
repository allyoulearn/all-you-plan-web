import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' }
]

const optionsWithCount = [
  { value: 'all', label: 'All', count: 12 },
  { value: 'done', label: 'Done', count: 4 }
]

describe('AppSegmentedControl', () => {
  it('renders one button per option', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('emits the option value on click', async () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['b'])
  })

  it('emits when the first option is clicked', async () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'b', options } })
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
  })

  it('applies active class to the selected option', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')[0].classes()).toContain('segmented-control__option--active')
    expect(wrapper.findAll('button')[1].classes()).toContain('segmented-control__option--inactive')
  })

  it('applies inactive class to non-selected options', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'b', options } })
    expect(wrapper.findAll('button')[0].classes()).toContain('segmented-control__option--inactive')
    expect(wrapper.findAll('button')[1].classes()).toContain('segmented-control__option--active')
  })

  it('sets aria-pressed true on the selected button', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')[0].attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('button')[1].attributes('aria-pressed')).toBe('false')
  })

  it('updates aria-pressed when a different option is active', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'b', options } })
    expect(wrapper.findAll('button')[0].attributes('aria-pressed')).toBe('false')
    expect(wrapper.findAll('button')[1].attributes('aria-pressed')).toBe('true')
  })

  it('has role="group" on the container', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.attributes('role')).toBe('group')
  })

  it('defaults group aria-label to "View options"', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.attributes('aria-label')).toBe('View options')
  })

  it('accepts a custom group aria-label', () => {
    const wrapper = mount(AppSegmentedControl, {
      props: { modelValue: 'a', options, groupLabel: 'Filter view' }
    })

    expect(wrapper.attributes('aria-label')).toBe('Filter view')
  })

  it('shows count badges when option has a count', () => {
    const wrapper = mount(AppSegmentedControl, {
      props: { modelValue: 'all', options: optionsWithCount }
    })

    const counts = wrapper.findAll('.segmented-control__count')
    expect(counts).toHaveLength(2)
    expect(counts[0].text()).toBe('12')
    expect(counts[1].text()).toBe('4')
  })

  it('does not render count spans when count is absent', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('.segmented-control__count')).toHaveLength(0)
  })

  it('renders no buttons with an empty options array', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: '', options: [] } })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('renders no buttons when options prop uses its default (not provided)', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: '' } })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('buttons have type="button"', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })

    for (const btn of wrapper.findAll('button')) {
      expect(btn.attributes('type')).toBe('button')
    }
  })

  it('renders option labels as button text', () => {
    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')[0].text()).toContain('A')
    expect(wrapper.findAll('button')[1].text()).toContain('B')
  })

  it('works with numeric modelValue', () => {
    const numOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ]

    const wrapper = mount(AppSegmentedControl, { props: { modelValue: 1, options: numOptions } })
    expect(wrapper.findAll('button')[0].attributes('aria-pressed')).toBe('true')
  })

  describe('keyboard arrow navigation (WEB-W2-32)', () => {
    const trio = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' }
    ]

    it('arrow Right moves to the next option', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options: trio } })
      await wrapper.findAll('button')[0].trigger('keydown.right')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['b'])
    })

    it('arrow Left moves to the previous option', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'b', options: trio } })
      await wrapper.findAll('button')[1].trigger('keydown.left')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
    })

    it('Home jumps to the first option', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'c', options: trio } })
      await wrapper.findAll('button')[2].trigger('keydown.home')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
    })

    it('End jumps to the last option', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options: trio } })
      await wrapper.findAll('button')[0].trigger('keydown.end')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['c'])
    })

    it('arrow Right wraps from last to first', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'c', options: trio } })
      await wrapper.findAll('button')[2].trigger('keydown.right')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
    })

    it('arrow Left wraps from first to last', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: 'a', options: trio } })
      await wrapper.findAll('button')[0].trigger('keydown.left')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['c'])
    })

    it('does not emit when options array is empty', async () => {
      const wrapper = mount(AppSegmentedControl, { props: { modelValue: '', options: [] } })
      // The component-level wrapper still exists; press a key on it.
      await wrapper.trigger('keydown.right')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
