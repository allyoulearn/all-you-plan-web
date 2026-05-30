import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPriorityDot from '@/components/ui/AppPriorityDot.vue'

describe('AppPriorityDot', () => {
  it('renders with normal priority by default', () => {
    const wrapper = mount(AppPriorityDot)
    expect(wrapper.classes()).toContain('priority-dot--normal')
  })

  it('applies the urgent class', () => {
    const wrapper = mount(AppPriorityDot, { props: { value: 'urgent' } })
    expect(wrapper.classes()).toContain('priority-dot--urgent')
  })

  it('applies the high class', () => {
    const wrapper = mount(AppPriorityDot, { props: { value: 'high' } })
    expect(wrapper.classes()).toContain('priority-dot--high')
  })

  it('applies the low class', () => {
    const wrapper = mount(AppPriorityDot, { props: { value: 'low' } })
    expect(wrapper.classes()).toContain('priority-dot--low')
  })

  it('exposes size via the --priority-dot-size custom property', () => {
    const wrapper = mount(AppPriorityDot, { props: { value: 'urgent', size: 12 } })
    expect(wrapper.attributes('style')).toContain('--priority-dot-size: 12px')
  })

  it('defaults size to 8 pixels', () => {
    const wrapper = mount(AppPriorityDot)
    expect(wrapper.attributes('style')).toContain('--priority-dot-size: 8px')
  })

  it('uses the aria-label prop when provided', () => {
    const wrapper = mount(AppPriorityDot, { props: { ariaLabel: 'High priority' } })
    expect(wrapper.attributes('aria-label')).toBe('High priority')
  })

  it('exposes role=img for screen readers', () => {
    const wrapper = mount(AppPriorityDot)
    expect(wrapper.attributes('role')).toBe('img')
  })

  it('has the base priority-dot class so SCSS hooks work', () => {
    const wrapper = mount(AppPriorityDot)
    expect(wrapper.classes()).toContain('priority-dot')
  })
})
