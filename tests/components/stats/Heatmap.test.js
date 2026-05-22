import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Heatmap from '@/components/stats/Heatmap.vue'

// 182 values for 26 weeks x 7 days
function makeValues(length = 182, fill = 0) {
  return Array.from({ length }, (_, i) => (i < fill ? 1 : 0))
}

describe('Heatmap', () => {
  it('renders the grid structure (26 columns x 7 rows = 182 cells)', () => {
    const wrapper = mount(Heatmap, { props: { values: makeValues() } })
    const cells = wrapper.findAll('.heatmap__cell')
    expect(cells).toHaveLength(182)
  })

  it('applies heatmap__cell--empty modifier for value 0', () => {
    const values = makeValues()
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.heatmap__cell')
    expect(firstCell.classes()).toContain('heatmap__cell--empty')
  })

  it('applies heatmap__cell--low modifier for value 1', () => {
    const values = [1, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.heatmap__cell')
    expect(firstCell.classes()).toContain('heatmap__cell--low')
  })

  it('applies heatmap__cell--mid modifier for value 2', () => {
    const values = [2, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.heatmap__cell')
    expect(firstCell.classes()).toContain('heatmap__cell--mid')
  })

  it('applies heatmap__cell--full modifier for value >= 3', () => {
    const values = [3, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.heatmap__cell')
    expect(firstCell.classes()).toContain('heatmap__cell--full')
  })

  it('defaults out-of-bounds index to 0 (heatmap__cell--empty)', () => {
    // Only provide 10 values — remaining cells fall back to 0
    const values = makeValues(10)
    const wrapper = mount(Heatmap, { props: { values } })
    const cells = wrapper.findAll('.heatmap__cell')
    // Cell at index 10 (out of bounds) should get heatmap__cell--empty
    expect(cells[10].classes()).toContain('heatmap__cell--empty')
  })

  it('renders the legend with "less" and "more" labels', () => {
    const wrapper = mount(Heatmap, { props: { values: makeValues() } })
    expect(wrapper.text()).toContain('less')
    expect(wrapper.text()).toContain('more')
  })

  it('renders 4 legend swatch boxes', () => {
    const wrapper = mount(Heatmap, { props: { values: makeValues() } })
    const legend = wrapper.findAll('.heatmap__swatch')
    expect(legend).toHaveLength(4)
  })
})
