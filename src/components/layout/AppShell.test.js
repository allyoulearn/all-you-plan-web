import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppShell from './AppShell.vue'

describe('AppShell', () => {
  it('renders the main content region', () => {
    const wrapper = mount(AppShell, {
      global: {
        stubs: { RouterView: true, AppSidebar: true, AppTopBar: true, WrenPanel: true },
      },
    })
    expect(wrapper.find('main').exists()).toBe(true)
  })
})
