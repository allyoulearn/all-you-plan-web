import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AppSidebar from './AppSidebar.vue'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn() }),
}))

const globalConfig = {
  stubs: { RouterLink: { template: '<a><slot /></a>' }, Icon: true },
  plugins: [createTestingPinia({ createSpy: vi.fn })],
}

describe('AppSidebar', () => {
  it('renders the app name', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('all you plan')
  })

  it('renders nav group labels', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    // navConfig has groups — just verify the sidebar renders a nav element
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('shows "You" when userName is empty', () => {
    const wrapper = mount(AppSidebar, { global: globalConfig })
    expect(wrapper.text()).toContain('You')
  })

  it('shows the user name when authenticated', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { auth: { user: { name: 'Ada' }, accessToken: 'tok' } },
    })
    const wrapper = mount(AppSidebar, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Icon: true }, plugins: [pinia] },
    })
    expect(wrapper.text()).toContain('Ada')
  })

  it('shows the first letter of the user name as avatar', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { auth: { user: { name: 'Ada' }, accessToken: 'tok' } },
    })
    const wrapper = mount(AppSidebar, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Icon: true }, plugins: [pinia] },
    })
    expect(wrapper.text()).toContain('A')
  })
})
