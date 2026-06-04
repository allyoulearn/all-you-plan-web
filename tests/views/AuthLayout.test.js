import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthLayout from '@/views/auth/AuthLayout.vue'

describe('AuthLayout', () => {
  function mountLayout() {
    return mount(AuthLayout, {
      global: {
        // AppFooter is exercised by its own/route tests; stub it here so this
        // layout test doesn't need an i18n plugin or a RouterLink stub.
        stubs: { RouterView: true, AppFooter: true }
      }
    })
  }

  it('renders the wordmark text', () => {
    const wrapper = mountLayout()
    expect(wrapper.text()).toContain('all you')
    expect(wrapper.text()).toContain('plan')
  })

  it('renders a RouterView for the nested auth route', () => {
    const wrapper = mountLayout()
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })

  it('applies the auth-layout root class', () => {
    const wrapper = mountLayout()
    expect(wrapper.find('.auth-layout').exists()).toBe(true)
  })

  it('renders the inner container', () => {
    const wrapper = mountLayout()
    expect(wrapper.find('.auth-layout__inner').exists()).toBe(true)
  })

  it('renders the card container that wraps the RouterView', () => {
    const wrapper = mountLayout()
    expect(wrapper.find('.auth-layout__card').exists()).toBe(true)
  })

  it('renders the wordmark with semantic italic emphasis on "plan"', () => {
    const wrapper = mountLayout()
    const wordmark = wrapper.find('.auth-layout__wordmark')
    expect(wordmark.exists()).toBe(true)
    expect(wordmark.find('em').exists()).toBe(true)
    expect(wordmark.find('em').text()).toContain('plan')
  })
})
