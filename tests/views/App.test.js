import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

describe('App', () => {
  function mountApp() {
    return mount(App, {
      global: {
        stubs: {
          RouterView: true,
          Toaster: true
        }
      }
    })
  }

  it('mounts without errors', () => {
    const wrapper = mountApp()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the Toaster component', () => {
    const wrapper = mountApp()
    // Toaster is stubbed — check the stub renders
    expect(wrapper.findComponent({ name: 'Toaster' }).exists()).toBe(true)
  })

  it('renders the RouterView outlet', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })

  it('has the correct component name', () => {
    expect(App.name).toBe('App')
  })
})
