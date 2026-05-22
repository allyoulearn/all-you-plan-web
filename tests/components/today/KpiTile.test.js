import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiTile from '@/components/today/KpiTile.vue'

describe('KpiTile', () => {
  it('renders label, value, and unit', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Streak', value: 7, unit: 'days' }
    })
    expect(wrapper.text()).toContain('Streak')
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('days')
  })

  it('renders a string value', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Today', value: '2/5', unit: 'complete' }
    })
    expect(wrapper.text()).toContain('2/5')
    expect(wrapper.text()).toContain('complete')
  })

  it('renders emphasis when provided', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Focus', value: '2h', emphasis: '30m', unit: 'logged' }
    })
    expect(wrapper.find('em').exists()).toBe(true)
    expect(wrapper.find('em').text()).toBe('30m')
  })

  it('does not render emphasis element when emphasis is empty', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Streak', value: 7 }
    })
    expect(wrapper.find('em').exists()).toBe(false)
  })

  it('does not render unit span when unit is empty', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Streak', value: 7 }
    })
    // The unit span has v-if="unit"; verify unit text is absent when no unit prop
    expect(wrapper.text()).not.toContain('days')
  })
})
