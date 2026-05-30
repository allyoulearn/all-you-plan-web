import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import AppSidebar from '@/components/layout/AppSidebar.vue'

vi.mock('@/api/apollo', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn()
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn() })
}))

// AppSidebar now reads the current route to compute its active-nav state.
// The component tests don't install a router; mock `useRoute` to return a
// minimal route shape so the sidebar mounts without exercising the router.
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ path: '/' })
  }
})

// AppSidebar also reads the layout drawer state; provide a static stub so
// the sidebar mounts without needing to install the layout composable.
vi.mock('@/composables/useLayout.js', () => ({
  useLayout: () => ({
    sidebarOpen: { value: false },
    toggleSidebar: vi.fn()
  })
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalConfig = {
  stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true },
  plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
}

describe('AppSidebar', () => {
  it('renders the app name', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('all you  plan')
  })

  it('renders the app name brand element', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.find('.app-sidebar__brand').exists()).toBe(true)
  })

  it('renders nav group labels', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('renders nav group labels as h3 elements (WEB-T07-006)', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    const headings = wrapper.findAll('h3.app-sidebar__group-label')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('does not render group labels as p elements', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.find('p.app-sidebar__group-label').exists()).toBe(false)
  })

  it('renders Workspaces group label', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('Workspaces')
  })

  it('renders Looking back group label', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('Looking back')
  })

  it('renders With Wren group label', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('With Wren')
  })

  it('renders System group label', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('System')
  })

  it('renders nav links for each item in navGroups', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders nav item keyboard shortcut keys', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    // navGroups has key "T" for Today
    expect(wrapper.text()).toContain('T')
  })

  it('shows "You" when userName is empty', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('You')
  })

  it('shows the user name when authenticated', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { auth: { user: { name: 'Ada' }, accessToken: 'tok' } }
    })

    const wrapper = mount(AppSidebar, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true },
        plugins: [pinia, i18n]
      }
    })

    expect(wrapper.text()).toContain('Ada')
  })

  it('shows the first letter of the user name as avatar', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { auth: { user: { name: 'Ada' }, accessToken: 'tok' } }
    })

    const wrapper = mount(AppSidebar, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true },
        plugins: [pinia, i18n]
      }
    })

    expect(wrapper.find('.app-sidebar__avatar').text()).toBe('A')
  })

  it('shows the first letter of the localized "You" fallback when user name is empty (WEB-W3-10)', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    // English locale: "You" → "Y". A different locale would naturally surface
    // a different letter, which is the intended i18n behavior.
    expect(wrapper.find('.app-sidebar__avatar').text()).toBe('Y')
  })

  it('renders the user panel at the bottom', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.find('.app-sidebar__user').exists()).toBe(true)
  })

  it('renders as an aside element', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.element.tagName).toBe('ASIDE')
  })
})
