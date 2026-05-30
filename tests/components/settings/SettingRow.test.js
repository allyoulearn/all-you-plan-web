import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingRow from '@/components/settings/SettingRow.vue'

describe('SettingRow', () => {
  it('renders the label', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Theme' } })
    expect(wrapper.text()).toContain('Theme')
  })

  it('renders the description when provided', () => {
    const wrapper = mount(SettingRow, {
      props: { label: 'Theme', description: 'Choose your color theme' }
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
      slots: { default: '<input type="checkbox" class="test-toggle" />' }
    })

    expect(wrapper.find('.test-toggle').exists()).toBe(true)
  })

  it('uses a three-column grid layout via CSS class (WEB-T07-012: no inline style)', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Theme' } })
    const root = wrapper.find('.setting-row')
    // Inline style must be absent — layout is now in scoped SCSS
    expect(root.attributes('style')).toBeUndefined()
    // Root element carries the BEM class
    expect(root.exists()).toBe(true)
  })

  it('label prop is required — renders label text in the label element', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Notifications' } })
    const label = wrapper.find('.setting-row__label')
    expect(label.text()).toBe('Notifications')
  })

  it('description is in setting-row__description element', () => {
    const wrapper = mount(SettingRow, {
      props: { label: 'Theme', description: 'Pick a color' }
    })

    const desc = wrapper.find('.setting-row__description')
    expect(desc.text()).toBe('Pick a color')
  })

  it('setting-row__control holds slotted content', () => {
    const wrapper = mount(SettingRow, {
      props: { label: 'Mode' },
      slots: { default: '<span class="slot-child">value</span>' }
    })

    const control = wrapper.find('.setting-row__control')
    expect(control.find('.slot-child').exists()).toBe(true)
  })

  it('default slot renders nothing when empty', () => {
    const wrapper = mount(SettingRow, { props: { label: 'Empty' } })
    const control = wrapper.find('.setting-row__control')
    expect(control.text()).toBe('')
  })

  it('description prop defaults to empty string (no description element)', () => {
    const wrapper = mount(SettingRow, { props: { label: 'X' } })
    expect(wrapper.find('.setting-row__description').exists()).toBe(false)
  })
})
