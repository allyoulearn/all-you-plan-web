import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTopBar from './AppTopBar.vue'
import { useRoute } from 'vue-router'

// Mock vue-router's useRoute
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ meta: { crumbs: ['Looking back', 'Calendar'] } })),
}))

const globalConfig = {
  stubs: { IconButton: true },
}

describe('AppTopBar', () => {
  it('renders the breadcrumb crumbs joined by ·', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.text()).toContain('Looking back · Calendar')
  })

  it('renders today\'s date in the header', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    // The date is dynamically computed — just check it contains the current year
    const currentYear = new Date().getFullYear().toString()
    expect(wrapper.text()).toContain(currentYear)
  })

  it('renders three icon buttons (search, add, theme toggle)', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('icon-button-stub')
    expect(buttons).toHaveLength(3)
  })

  it('falls back to "all you plan" when route has no crumbs', () => {
    vi.mocked(useRoute).mockReturnValueOnce({ meta: {} })
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.text()).toContain('all you plan')
  })
})
