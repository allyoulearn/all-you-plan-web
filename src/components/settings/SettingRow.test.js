import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingRow from './SettingRow.vue'

describe('SettingRow', () => {
  it('renders the label', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Theme' } })
    expect(wrapper.text()).toContain('Theme')
  })

  it('renders the description when provided', () => {
    const wrapper = mount(SettingRow, {
      props: { label: 'Theme', description: 'Choose your color theme' },
    })
    expect(wrapper.text()).toContain('Choose your color theme')
  })

  it('does not render description paragraph when omitted', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Theme' } })
    // Only one <p> exists — the label one; the description <p> has v-if
    const paragraphs = wrapper.findAll('p')
    expect(paragraphs).toHaveLength(1)
  })

  it('renders slotted content in the control area', () => {
    const wrapper = mount(SettingRow, {
      props: { label: 'Dark mode' },
      slots: { default: '<input type="checkbox" class="test-toggle" />' },
    })
    expect(wrapper.find('.test-toggle').exists()).toBe(true)
  })

  it('uses a three-column grid layout', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Theme' } })
    const root = wrapper.find('div')
    expect(root.attributes('style')).toContain('grid-template-columns')
  })
})
