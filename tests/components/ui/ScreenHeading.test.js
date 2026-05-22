import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

describe('ScreenHeading', () => {
  it('renders the title and emphasis', () => {
    const wrapper = mount(ScreenHeading, {
      props: { title: 'A quiet', emphasis: 'full day.' }
    })
    expect(wrapper.text()).toContain('A quiet')
    expect(wrapper.find('em').text()).toBe('full day.')
  })
})

describe('SectionHeader', () => {
  it('renders the label and bracketed count', () => {
    const wrapper = mount(SectionHeader, { props: { label: 'Morning', count: 4 } })
    expect(wrapper.text()).toContain('Morning')
    expect(wrapper.text()).toContain('[4]')
  })
})
