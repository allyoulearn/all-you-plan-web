import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Heatmap from '@/components/stats/Heatmap.vue'

// 182 values for 26 weeks x 7 days
function makeValues(length = 182, fill = 0) {
  return Array.from({ length }, (_, i) => (i < fill ? 1 : 0))
}

describe('Heatmap', () => {
  describe('grid structure', () => {
    it('renders 182 cells (26 columns x 7 rows)', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const cells = wrapper.findAll('.heatmap__cell')
      expect(cells).toHaveLength(182)
    })

    it('wraps in a <figure> element (WEB-T07-004: accessible landmark)', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      expect(wrapper.element.tagName).toBe('FIGURE')
    })

    it('figure has aria-label for screen readers', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      expect(wrapper.attributes('aria-label')).toContain('heatmap')
    })

    it('has a visually-hidden figcaption with total completions', () => {
      const values = makeValues(182, 5) // 5 completions
      const wrapper = mount(Heatmap, { props: { values } })
      const caption = wrapper.find('figcaption')
      expect(caption.exists()).toBe(true)
      expect(caption.text()).toContain('5')
    })

    it('figcaption has sr-only class', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const caption = wrapper.find('figcaption')
      expect(caption.classes()).toContain('heatmap__caption')
    })
  })

  describe('cell intensity classes', () => {
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

    it('applies heatmap__cell--full modifier for value 3', () => {
      const values = [3, ...makeValues(181)]
      const wrapper = mount(Heatmap, { props: { values } })
      const firstCell = wrapper.find('.heatmap__cell')
      expect(firstCell.classes()).toContain('heatmap__cell--full')
    })

    it('applies heatmap__cell--full modifier for value > 3', () => {
      const values = [5, ...makeValues(181)]
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
  })

  describe('accessibility (WEB-T07-004)', () => {
    it('each cell has role="gridcell"', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const firstCell = wrapper.find('.heatmap__cell')
      expect(firstCell.attributes('role')).toBe('gridcell')
    })

    it('each cell has an aria-label', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const firstCell = wrapper.find('.heatmap__cell')
      const label = firstCell.attributes('aria-label')
      expect(label).toBeTruthy()
      expect(label.length).toBeGreaterThan(0)
    })

    it('cell aria-label includes completion count', () => {
      const values = [2, ...makeValues(181)]
      const wrapper = mount(Heatmap, { props: { values } })
      const firstCell = wrapper.find('.heatmap__cell')
      expect(firstCell.attributes('aria-label')).toContain('2 completions')
    })

    it('cell aria-label shows "1 completion" (singular) for count 1', () => {
      const values = [1, ...makeValues(181)]
      const wrapper = mount(Heatmap, { props: { values } })
      const firstCell = wrapper.find('.heatmap__cell')
      expect(firstCell.attributes('aria-label')).toContain('1 completion')
      // Must NOT say "1 completions"
      expect(firstCell.attributes('aria-label')).not.toContain('1 completions')
    })

    it('cell aria-label shows "0 completions" for empty cells', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const firstCell = wrapper.find('.heatmap__cell')
      expect(firstCell.attributes('aria-label')).toContain('0 completions')
    })

    it('grid container has role="grid"', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      expect(wrapper.find('[role="grid"]').exists()).toBe(true)
    })

    it('each column has role="row"', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const rows = wrapper.findAll('[role="row"]')
      expect(rows).toHaveLength(26)
    })

    it('legend is aria-hidden (decorative)', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const legend = wrapper.find('.heatmap__legend')
      expect(legend.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('legend', () => {
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

  describe('totalCompletions computed', () => {
    it('sums all values in the figcaption', () => {
      const values = Array.from({ length: 182 }, (_, i) => (i % 3 === 0 ? 2 : 0))
      const total = values.reduce((s, v) => s + v, 0)
      const wrapper = mount(Heatmap, { props: { values } })
      const caption = wrapper.find('figcaption')
      expect(caption.text()).toContain(String(total))
    })

    it('shows 0 total when all values are 0', () => {
      const wrapper = mount(Heatmap, { props: { values: makeValues() } })
      const caption = wrapper.find('figcaption')
      expect(caption.text()).toContain('0')
    })
  })
})
