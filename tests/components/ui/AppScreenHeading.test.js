import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'

describe('AppScreenHeading', () => {
  it('renders the title and emphasis', () => {
    const wrapper = mount(AppScreenHeading, {
      props: { title: 'A quiet', emphasis: 'full day.' }
    })

    expect(wrapper.text()).toContain('A quiet')
    expect(wrapper.find('em').text()).toBe('full day.')
  })

  it('renders only the title when no emphasis is provided', () => {
    const wrapper = mount(AppScreenHeading, { props: { title: 'Today' } })
    expect(wrapper.find('h1').text()).toContain('Today')
    expect(wrapper.find('em').exists()).toBe(false)
  })

  it('accepts the eyebrow prop without rendering it (top-bar breadcrumb is canonical)', () => {
    const wrapper = mount(AppScreenHeading, {
      props: { title: 'Hello', eyebrow: 'Week 21' }
    })

    expect(wrapper.find('.screen-heading__eyebrow').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Week 21')
  })

  it('does not render the eyebrow element when eyebrow is empty', () => {
    const wrapper = mount(AppScreenHeading, { props: { title: 'Hello' } })
    expect(wrapper.find('.screen-heading__eyebrow').exists()).toBe(false)
  })

  it('renders a <header> root element', () => {
    const wrapper = mount(AppScreenHeading, { props: { title: 'Test' } })
    expect(wrapper.element.tagName).toBe('HEADER')
  })

  it('renders an <h1> for the title', () => {
    const wrapper = mount(AppScreenHeading, { props: { title: 'Main Title' } })
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toContain('Main Title')
  })

  it('renders emphasis inside an <em> tag', () => {
    const wrapper = mount(AppScreenHeading, {
      props: { title: 'Start', emphasis: 'here.' }
    })

    expect(wrapper.find('em').exists()).toBe(true)
    expect(wrapper.find('.screen-heading__emphasis').text()).toBe('here.')
  })

  it('renders the meta slot when provided', () => {
    const wrapper = mount(AppScreenHeading, {
      props: { title: 'Test' },
      slots: { meta: '<span class="meta-content">42 tasks</span>' }
    })

    expect(wrapper.find('.meta-content').text()).toBe('42 tasks')
    expect(wrapper.find('.screen-heading__meta').exists()).toBe(true)
  })

  it('does not render the meta container when meta slot is absent', () => {
    const wrapper = mount(AppScreenHeading, { props: { title: 'Test' } })
    expect(wrapper.find('.screen-heading__meta').exists()).toBe(false)
  })
})

describe('AppSectionHeader', () => {
  it('renders the label and bracketed count', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Morning', count: 4 } })
    expect(wrapper.text()).toContain('Morning')
    expect(wrapper.text()).toContain('[4]')
  })

  it('renders only the label when count is null', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Evening', count: null } })
    expect(wrapper.text()).toContain('Evening')
    expect(wrapper.find('.section-header__count').exists()).toBe(false)
  })

  it('does not render the count when count is not provided', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Items' } })
    expect(wrapper.find('.section-header__count').exists()).toBe(false)
  })

  it('renders count of 0', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Empty', count: 0 } })
    expect(wrapper.text()).toContain('[0]')
  })

  it('renders the action slot when provided', () => {
    const wrapper = mount(AppSectionHeader, {
      props: { label: 'Tasks' },
      slots: { action: '<button>Add</button>' }
    })

    expect(wrapper.find('button').text()).toBe('Add')
  })

  it('renders a rule span element', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Items' } })
    expect(wrapper.find('.section-header__rule').exists()).toBe(true)
  })

  it('renders label with correct class', () => {
    const wrapper = mount(AppSectionHeader, { props: { label: 'Section' } })
    expect(wrapper.find('.section-header__label').text()).toBe('Section')
  })
})
