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

  it('renders the tile container class', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Test', value: 1 } })
    expect(wrapper.find('.kpi-tile').exists()).toBe(true)
  })

  it('renders label in the correct element', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Streak', value: 5 } })
    expect(wrapper.find('.kpi-tile__label').text()).toBe('Streak')
  })

  it('renders value in the value element', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Streak', value: 42 } })
    expect(wrapper.find('.kpi-tile__value').text()).toContain('42')
  })

  it('renders unit in the unit element when provided', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Streak', value: 5, unit: 'days' } })
    expect(wrapper.find('.kpi-tile__unit').text()).toBe('days')
  })

  it('does not render unit element when unit is empty string', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Streak', value: 5, unit: '' } })
    expect(wrapper.find('.kpi-tile__unit').exists()).toBe(false)
  })

  it('renders numeric 0 value correctly', () => {
    const wrapper = mount(KpiTile, { props: { label: 'Streak', value: 0, unit: 'days' } })
    expect(wrapper.find('.kpi-tile__value').text()).toContain('0')
  })

  it('renders emphasis element with kpi-tile__emphasis class', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Focus', value: '1h', emphasis: '30m' }
    })
    expect(wrapper.find('.kpi-tile__emphasis').exists()).toBe(true)
  })

  it('emphasis text is inside the value container', () => {
    const wrapper = mount(KpiTile, {
      props: { label: 'Focus', value: '1h', emphasis: '30m' }
    })
    const valueEl = wrapper.find('.kpi-tile__value')
    expect(valueEl.find('em').exists()).toBe(true)
  })

  it('label prop is required — renders it as provided', () => {
    const wrapper = mount(KpiTile, { props: { label: 'My metric', value: 99 } })
    expect(wrapper.find('.kpi-tile__label').text()).toBe('My metric')
  })

  it('value can be a string or number (string)', () => {
    const wrapper = mount(KpiTile, { props: { label: 'L', value: '2/10' } })
    expect(wrapper.find('.kpi-tile__value').text()).toContain('2/10')
  })
})
