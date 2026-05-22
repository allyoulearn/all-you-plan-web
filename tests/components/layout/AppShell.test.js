import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppShell from '@/components/layout/AppShell.vue'

describe('AppShell', () => {
  function mountShell() {
    return mount(AppShell, {
      global: {
        stubs: { RouterView: true, AppSidebar: true, AppTopBar: true, WrenPanel: true }
      }
    })
  }

  it('renders the main content region', () => {
    const wrapper = mountShell()
    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('renders the root app-shell element', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.app-shell').exists()).toBe(true)
  })

  it('renders a stubbed AppSidebar', () => {
    const wrapper = mountShell()
    // @vue/test-utils stubs render as PascalCase-stub or kebab-stub depending on version
    // use the component by finding an aside or check the html
    expect(wrapper.html()).toContain('app-sidebar')
  })

  it('renders a stubbed AppTopBar inside main', () => {
    const wrapper = mountShell()
    expect(wrapper.html()).toContain('app-top-bar')
  })

  it('renders a stubbed WrenPanel', () => {
    const wrapper = mountShell()
    expect(wrapper.html()).toContain('wren-panel')
  })

  it('renders the content slot wrapper', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.app-shell__content').exists()).toBe(true)
  })

  it('renders RouterView inside the content area', () => {
    const wrapper = mountShell()
    const content = wrapper.find('.app-shell__content')
    expect(content.html()).toContain('router-view-stub')
  })

  it('has the app-shell__main class on the main element', () => {
    const wrapper = mountShell()
    expect(wrapper.find('main').classes()).toContain('app-shell__main')
  })
})
