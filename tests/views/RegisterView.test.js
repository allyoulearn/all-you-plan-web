import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import RegisterView from '@/views/auth/RegisterView.vue'
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
  Icon: true
}

function mountRegister() {
  const wrapper = mount(RegisterView, {
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
  const store = useAuthStore()
  return { wrapper, store }
}

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the heading via i18n keys (WEB-T08-014 fix)', () => {
    const { wrapper } = mountRegister()
    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Create your')
    expect(heading.text()).toContain('account.')
  })

  it('renders the heading emphasis in an <em> tag', () => {
    const { wrapper } = mountRegister()
    const em = wrapper.find('h2 em')
    expect(em.exists()).toBe(true)
    expect(em.text()).toContain('account.')
  })

  it('renders the full name text field with label', () => {
    const { wrapper } = mountRegister()
    const labels = wrapper.findAll('label')
    const nameLabel = labels.find(l => l.text().includes('Full name'))
    expect(nameLabel).toBeDefined()
  })

  it('renders the email text field with label', () => {
    const { wrapper } = mountRegister()
    const labels = wrapper.findAll('label')
    const emailLabel = labels.find(l => l.text().includes('Email'))
    expect(emailLabel).toBeDefined()
  })

  it('renders the password text field with label', () => {
    const { wrapper } = mountRegister()
    const labels = wrapper.findAll('label')
    const pwLabel = labels.find(l => l.text().includes('Password'))
    expect(pwLabel).toBeDefined()
  })

  it('renders the submit button with Create account text', () => {
    const { wrapper } = mountRegister()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Create account')
  })

  it('renders the "already have an account" text and sign-in link', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.text()).toContain('Already have an account?')
    // RouterLink renders slot text
    expect(wrapper.text()).toContain('Sign in')
  })

  it('does not show error paragraph by default', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.find('.register-view__error').exists()).toBe(false)
  })

  // ── Form inputs ─────────────────────────────────────────────────────────

  it('has three input fields (name, email, password)', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.findAll('input').length).toBe(3)
  })

  it('updates name on input', async () => {
    const { wrapper } = mountRegister()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Ada Lovelace')
    expect(inputs[0].element.value).toBe('Ada Lovelace')
  })

  it('updates email on input', async () => {
    const { wrapper } = mountRegister()
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('ada@example.com')
    expect(emailInput.element.value).toBe('ada@example.com')
  })

  it('updates password on input', async () => {
    const { wrapper } = mountRegister()
    const pwInput = wrapper.find('input[type="password"]')
    await pwInput.setValue('Hunter2!')
    expect(pwInput.element.value).toBe('Hunter2!')
  })

  // ── Submission ──────────────────────────────────────────────────────────

  it('calls authStore.register with email, password, name on submit', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockResolvedValue({})

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Ada Lovelace')
    await wrapper.find('input[type="email"]').setValue('ada@example.com')
    await wrapper.find('input[type="password"]').setValue('Secret1!')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(store.register).toHaveBeenCalledWith('ada@example.com', 'Secret1!', 'Ada Lovelace')
  })

  // ── Error states ─────────────────────────────────────────────────────────

  it('shows error paragraph when registration fails with GraphQL error', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockRejectedValue({
      graphQLErrors: [{ message: 'Email already in use' }]
    })

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.register-view__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Email already in use')
  })

  it('shows fallback error when rejection has no graphQLErrors', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockRejectedValue(new Error('network'))

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Registration failed')
  })

  it('clears error message at the start of a new submit', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockRejectedValueOnce({ graphQLErrors: [{ message: 'err' }] })
    store.register.mockResolvedValue({})

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.register-view__error').exists()).toBe(true)

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.register-view__error').exists()).toBe(false)
  })

  // ── Loading state ──────────────────────────────────────────────────────

  it('shows Loading... text while registering', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockImplementation(() => new Promise(() => {}))

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toContain('Loading')
  })

  it('disables the submit button while loading', async () => {
    const { wrapper, store } = mountRegister()
    store.register.mockImplementation(() => new Promise(() => {}))

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  // ── Accessibility ──────────────────────────────────────────────────────

  it('password input is of type password (screen reader not announcing plain text)', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })
})
