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
    const cells = wrapper.findAll('.h-3.w-3')
    expect(cells).toHaveLength(182)
  })

  it('applies bg-paper-3 for value 0', () => {
    const values = makeValues()
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.h-3.w-3')
    expect(firstCell.classes()).toContain('bg-paper-3')
  })

  it('applies bg-accent/[0.25] for value 1', () => {
    const values = [1, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.h-3.w-3')
    expect(firstCell.classes()).toContain('bg-accent/[0.25]')
  })

  it('applies bg-accent/[0.55] for value 2', () => {
    const values = [2, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.h-3.w-3')
    expect(firstCell.classes()).toContain('bg-accent/[0.55]')
  })

  it('applies bg-accent for value >= 3', () => {
    const values = [3, ...makeValues(181)]
    const wrapper = mount(Heatmap, { props: { values } })
    const firstCell = wrapper.find('.h-3.w-3')
    expect(firstCell.classes()).toContain('bg-accent')
  })

  it('defaults out-of-bounds index to 0 (bg-paper-3)', () => {
    // Only provide 10 values — remaining cells fall back to 0
    const values = makeValues(10)
    const wrapper = mount(Heatmap, { props: { values } })
    const cells = wrapper.findAll('.h-3.w-3')
    // Cell at index 10 (out of bounds) should get bg-paper-3
    expect(cells[10].classes()).toContain('bg-paper-3')
  })

  it('renders the legend with "less" and "more" labels', () => {
    const wrapper = mount(Heatmap, { props: { values: makeValues() } })
    expect(wrapper.text()).toContain('less')
    expect(wrapper.text()).toContain('more')
  })

  it('renders 4 legend swatch boxes', () => {
    const wrapper = mount(Heatmap, { props: { values: makeValues() } })
    const legend = wrapper.findAll('.h-2\\.5.w-2\\.5')
    expect(legend).toHaveLength(4)
  })
})
