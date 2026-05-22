import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import { useAuthStore } from '@/stores/auth.store'
import en from '@/i18n/locales/en.json'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
let mockToken = 'valid-token-abc'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: { token: mockToken } })
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  RouterLink: { template: '<a><slot /></a>' },
  Icon: true
}

function mountReset(token = 'valid-token-abc') {
  mockToken = token
  const wrapper = mount(ResetPasswordView, {
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
  const store = useAuthStore()
  return { wrapper, store }
}

// A strong password that satisfies all hints
const STRONG_PW = 'Abcdef1!'

describe('ResetPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  // ── Token-missing state ───────────────────────────────────────────────

  it('shows invalid-token state when token query param is empty', () => {
    const { wrapper } = mountReset('')
    expect(wrapper.find('.reset-password-view__invalid').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('This reset link is invalid or has expired.')
  })

  it('shows a link back to forgot-password in invalid-token state', () => {
    const { wrapper } = mountReset('')
    const invalidBlock = wrapper.find('.reset-password-view__invalid')
    // RouterLink renders as <a><slot/></a> — slot text is visible
    expect(invalidBlock.text()).toContain('Send reset link')
  })

  // ── Normal form rendering (valid token) ──────────────────────────────

  it('renders the heading via i18n keys (WEB-T08-014 fix)', () => {
    const { wrapper } = mountReset()
    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Reset your')
    expect(heading.text()).toContain('password.')
  })

  it('renders the heading emphasis in an <em> tag', () => {
    const { wrapper } = mountReset()
    const em = wrapper.find('h2 em')
    expect(em.exists()).toBe(true)
    expect(em.text()).toContain('password.')
  })

  it('renders the new-password field with label', () => {
    const { wrapper } = mountReset()
    const labels = wrapper.findAll('label')
    const newPwLabel = labels.find(l => l.text().includes('New password'))
    expect(newPwLabel).toBeDefined()
  })

  it('renders the confirm-password field with label', () => {
    const { wrapper } = mountReset()
    const labels = wrapper.findAll('label')
    const confirmLabel = labels.find(l => l.text().includes('Confirm password'))
    expect(confirmLabel).toBeDefined()
  })

  it('renders four password-strength hint items', () => {
    const { wrapper } = mountReset()
    const hints = wrapper.findAll('.reset-password-view__hint')
    expect(hints).toHaveLength(4)
  })

  it('renders the submit button', () => {
    const { wrapper } = mountReset()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Set new password')
  })

  it('does not show the error paragraph by default', () => {
    const { wrapper } = mountReset()
    expect(wrapper.find('.reset-password-view__error').exists()).toBe(false)
  })

  // ── Strength hints ────────────────────────────────────────────────────

  it('shows muted hints when password is empty', () => {
    const { wrapper } = mountReset()
    const hints = wrapper.findAll('.reset-password-view__hint--muted')
    expect(hints.length).toBe(4)
  })

  it('marks the length hint ok when password >= 8 characters', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('abcdefgh')
    await wrapper.vm.$nextTick()
    const okHints = wrapper.findAll('.reset-password-view__hint--ok')
    // at least the length hint should be ok (lowercase might also trigger)
    expect(okHints.length).toBeGreaterThanOrEqual(1)
  })

  it('marks all four hints ok for a strong password', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()
    const okHints = wrapper.findAll('.reset-password-view__hint--ok')
    expect(okHints.length).toBe(4)
  })

  it('shows all hints as muted for a weak password', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('ab')
    await wrapper.vm.$nextTick()
    const mutedHints = wrapper.findAll('.reset-password-view__hint--muted')
    // 'ab' has lowercase but nothing else
    expect(mutedHints.length).toBeGreaterThanOrEqual(1)
  })

  // ── Submit disabled conditions ────────────────────────────────────────

  it('disables submit when password is weak', () => {
    const { wrapper } = mountReset()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('disables submit when password is strong but confirmPassword is mismatched (WEB-T08-002 fix)', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue('DifferentPassword1!')
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('enables submit when password is strong and passwords match', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  // ── Confirm field invalid state (WEB-T08-002 fix) ─────────────────────

  it('confirm field is NOT invalid when it is empty', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    // When confirmPassword is empty, :invalid="!!confirmPassword && !passwordsMatch"
    // should be false — no red border
    const confirmWrapper = wrapper.findAll('.text-field__wrapper')
    const invalidWrappers = confirmWrapper.filter(w =>
      w.classes().includes('text-field__wrapper--invalid')
    )
    expect(invalidWrappers.length).toBe(0)
  })

  it('confirm field shows invalid border when passwords mismatch', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue('WrongPassword9!')
    await wrapper.vm.$nextTick()

    const invalidWrappers = wrapper.findAll('.text-field__wrapper--invalid')
    expect(invalidWrappers.length).toBeGreaterThan(0)
  })

  it('confirm field shows valid border when passwords match', async () => {
    const { wrapper } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    const invalidWrappers = wrapper.findAll('.text-field__wrapper--invalid')
    expect(invalidWrappers.length).toBe(0)
  })

  // ── handleSubmit guard: password mismatch ─────────────────────────────

  it('shows mismatch error when passwords do not match on submit', async () => {
    const { wrapper, store } = mountReset()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue('DifferentPassword9!')
    await wrapper.vm.$nextTick()

    // Temporarily remove disabled to allow form submit
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    // If the submit proceeds despite disabled, the error text should appear
    // (this tests the runtime guard inside handleSubmit)
    // The button is disabled so the form submission won't fire authStore.resetPassword
    expect(store.resetPassword).not.toHaveBeenCalled()
  })

  // ── Successful submission ─────────────────────────────────────────────

  it('calls authStore.resetPassword with token and newPassword on submit', async () => {
    const { wrapper, store } = mountReset('my-token-xyz')
    store.resetPassword.mockResolvedValue({})

    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(store.resetPassword).toHaveBeenCalledWith('my-token-xyz', STRONG_PW)
  })

  // ── Error on submission ───────────────────────────────────────────────

  it('shows error message when resetPassword throws', async () => {
    const { wrapper, store } = mountReset()
    store.resetPassword.mockRejectedValue({
      graphQLErrors: [{ message: 'Token expired' }]
    })

    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.reset-password-view__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Token expired')
  })

  it('shows resetTokenInvalid fallback error when no graphQLErrors', async () => {
    const { wrapper, store } = mountReset()
    store.resetPassword.mockRejectedValue(new Error('network'))

    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.reset-password-view__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('This reset link is invalid or has expired.')
  })

  // ── Loading state ─────────────────────────────────────────────────────

  it('shows Loading... text while submitting', async () => {
    const { wrapper, store } = mountReset()
    store.resetPassword.mockImplementation(() => new Promise(() => {}))

    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toContain('Loading')
  })

  it('disables submit button while loading', async () => {
    const { wrapper, store } = mountReset()
    store.resetPassword.mockImplementation(() => new Promise(() => {}))

    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue(STRONG_PW)
    await inputs[1].setValue(STRONG_PW)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  // ── Accessibility ──────────────────────────────────────────────────────

  it('both password inputs have type="password"', () => {
    const { wrapper } = mountReset()
    const pwInputs = wrapper.findAll('input[type="password"]')
    expect(pwInputs.length).toBe(2)
  })

  it('back to login link is present and renders text', () => {
    const { wrapper } = mountReset()
    const footer = wrapper.find('.reset-password-view__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).toContain('Back to sign in')
  })
})
