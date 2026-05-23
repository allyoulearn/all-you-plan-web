import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import KpiRow from '@/components/today/KpiRow.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const globalConfig = { plugins: [i18n] }

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
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    // Each tile has the label as text — count distinct label spans
    expect(wrapper.text()).toContain('Streak')
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Projects')
    expect(wrapper.text()).toContain('Focus')
  })

  it('passes Streak value to a KpiTile', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('5')
  })

  it('passes Today value in done/total format', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('2/6')
  })

  it('passes Projects value as active count', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('3')
  })

  it('formats Focus minutes as hours and minutes', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    // 90 minutes = 1h 30m
    expect(wrapper.text()).toContain('1h 30m')
  })

  it('formats Focus with 0h when less than 60 minutes', () => {
    const wrapper = mount(KpiRow, {
      props: { kpis: { ...fakeKpis, focusMinutes: 45 } },
      global: globalConfig
    })
    expect(wrapper.text()).toContain('0h 45m')
  })

  it('renders the kpi-row container class', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.find('.kpi-row').exists()).toBe(true)
  })

  it('renders four tile elements (one per KPI)', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    // Each KpiTile renders a .kpi-tile element
    const tiles = wrapper.findAll('.kpi-tile')
    expect(tiles).toHaveLength(4)
  })

  it('shows streak unit label "days"', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('days')
  })

  it('shows today unit label "complete"', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('complete')
  })

  it('shows projects unit label "active"', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('active')
  })

  it('shows focus unit label "logged"', () => {
    const wrapper = mount(KpiRow, { props: { kpis: fakeKpis }, global: globalConfig })
    expect(wrapper.text()).toContain('logged')
  })

  it('handles exactly 0 focus minutes', () => {
    const wrapper = mount(KpiRow, {
      props: { kpis: { ...fakeKpis, focusMinutes: 0 } },
      global: globalConfig
    })
    expect(wrapper.text()).toContain('0h 0m')
  })

  it('handles exactly 60 focus minutes as 1h 0m', () => {
    const wrapper = mount(KpiRow, {
      props: { kpis: { ...fakeKpis, focusMinutes: 60 } },
      global: globalConfig
    })
    expect(wrapper.text()).toContain('1h 0m')
  })

  it('handles zero streak', () => {
    const wrapper = mount(KpiRow, {
      props: { kpis: { ...fakeKpis, streak: 0 } },
      global: globalConfig
    })
    expect(wrapper.text()).toContain('0')
  })

  it('handles zero todayDone with non-zero todayTotal', () => {
    const wrapper = mount(KpiRow, {
      props: { kpis: { ...fakeKpis, todayDone: 0, todayTotal: 5 } },
      global: globalConfig
    })
    expect(wrapper.text()).toContain('0/5')
  })
})
