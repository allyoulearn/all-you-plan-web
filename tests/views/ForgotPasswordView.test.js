import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import { useAuthStore } from '@/stores/auth.store'
import en from '@/i18n/locales/en.json'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} })
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  RouterLink: { template: '<a><slot /></a>' },
  AppIcon: true
}

function mountForgot() {
  const wrapper = mount(ForgotPasswordView, {
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })

  const store = useAuthStore()
  return { wrapper, store }
}

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the heading via i18n keys (WEB-T08-014 fix)', () => {
    const { wrapper } = mountForgot()
    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Forgot your')
    expect(heading.text()).toContain('password?')
  })

  it('renders the heading emphasis in an <em> tag', () => {
    const { wrapper } = mountForgot()
    const em = wrapper.find('h2 em')
    expect(em.exists()).toBe(true)
    expect(em.text()).toContain('password?')
  })

  it('renders the description text', () => {
    const { wrapper } = mountForgot()
    expect(wrapper.text()).toContain("Enter your email and we'll send you reset instructions.")
  })

  it('renders the email text field with label', () => {
    const { wrapper } = mountForgot()
    const labels = wrapper.findAll('label')
    const emailLabel = labels.find(l => l.text().includes('Email'))
    expect(emailLabel).toBeDefined()
  })

  it('renders the submit button with send text', () => {
    const { wrapper } = mountForgot()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Send reset link')
  })

  it('renders the back-to-login link text in the form footer', () => {
    const { wrapper } = mountForgot()
    const footer = wrapper.find('.forgot-password-view__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).toContain('Back to sign in')
  })

  it('does not show error paragraph by default', () => {
    const { wrapper } = mountForgot()
    expect(wrapper.find('.forgot-password-view__error').exists()).toBe(false)
  })

  it('shows the form (not success state) by default', () => {
    const { wrapper } = mountForgot()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('.forgot-password-view__success').exists()).toBe(false)
  })

  // ── Form input ─────────────────────────────────────────────────────────

  it('updates email on input', async () => {
    const { wrapper } = mountForgot()
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('user@example.com')
    expect(emailInput.element.value).toBe('user@example.com')
  })

  // ── Submission: success state ─────────────────────────────────────────

  it('transitions to success state when forgotPassword resolves', async () => {
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockResolvedValue({})

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('.forgot-password-view__success').exists()).toBe(true)
    expect(wrapper.text()).toContain('If an account exists with that email')
  })

  it('calls authStore.forgotPassword with the entered email', async () => {
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockResolvedValue({})

    await wrapper.find('input[type="email"]').setValue('ada@example.com')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(store.forgotPassword).toHaveBeenCalledWith('ada@example.com')
  })

  // ── Submission: error does NOT reveal account existence ───────────────

  it('transitions to success state even when forgotPassword throws (prevent enumeration)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockRejectedValue(new Error('user not found'))

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Should still show the success state to avoid email enumeration
    expect(wrapper.find('.forgot-password-view__success').exists()).toBe(true)
    // No error paragraph should be shown
    expect(wrapper.find('.forgot-password-view__error').exists()).toBe(false)
    // The mutation failure IS logged for dev diagnostics
    expect(errorSpy).toHaveBeenCalledWith('[forgotPassword] mutation failed', expect.any(Error))
    errorSpy.mockRestore()
  })

  // ── Loading state ─────────────────────────────────────────────────────

  it('shows Loading... text while submitting', async () => {
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockImplementation(() => new Promise(() => {}))

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toContain('Loading')
  })

  it('disables submit button while loading', async () => {
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockImplementation(() => new Promise(() => {}))

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  // ── Success state contents ────────────────────────────────────────────

  it('success state contains a back-to-login link', async () => {
    const { wrapper, store } = mountForgot()
    store.forgotPassword.mockResolvedValue({})

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const successBlock = wrapper.find('.forgot-password-view__success')
    expect(successBlock.text()).toContain('Back to sign in')
  })

  // ── Accessibility ─────────────────────────────────────────────────────

  it('email input has the correct type for browser autofill', () => {
    const { wrapper } = mountForgot()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('email AppTextField is present for browser autofill', () => {
    // Verify the email input exists (autocomplete prop is on the AppTextField component)
    const { wrapper } = mountForgot()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })
})
