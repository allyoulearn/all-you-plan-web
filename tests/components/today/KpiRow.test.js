import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiRow from '@/components/today/KpiRow.vue'

const fakeKpis = {
  streak: 5,
  todayDone: 2,
  todayTotal: 6,
  activeProjects: 3,
  focusMinutes: 90
}

// Mount with real KpiTile so we can inspect rendered output directly
describe('KpiRow', () => {
  it('renders four KpiTile children', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis } })
    // Each tile has the label as text — count distinct label spans
    expect(wrapper.text()).toContain('Streak')
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Projects')
    expect(wrapper.text()).toContain('Focus')
  })

  it('passes Streak value to a KpiTile', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis } })
    expect(wrapper.text()).toContain('5')
  })

  it('passes Today value in done/total format', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis } })
    expect(wrapper.text()).toContain('2/6')
  })

  it('passes Projects value as active count', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis } })
    expect(wrapper.text()).toContain('3')
  })

  it('formats Focus minutes as hours and minutes', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis } })
    // 90 minutes = 1h 30m
    expect(wrapper.text()).toContain('1h 30m')
  })

  it('formats Focus with 0h when less than 60 minutes', () => {
    const wrapper = mount(KpiRow, { props: { kpis: { ...fakeKpis, focusMinutes: 45 } } })
    expect(wrapper.text()).toContain('0h 45m')
  })
})
