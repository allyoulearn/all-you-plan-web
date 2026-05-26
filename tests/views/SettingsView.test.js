import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'

// Mock vue-router so the SettingsView's OAuth-callback handler (useRoute()
// and useRouter().replace) can run inside the test environment without a
// real router. `routeQueryMock` is mutable so a test can simulate landing
// on /settings?connection=success.
let routeQueryMock = {}
const routerReplaceMock = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ query: routeQueryMock }),
    useRouter: () => ({ replace: routerReplaceMock, push: vi.fn() })
  }
})

// Mock the billing composable so SettingsView interaction tests can assert
// on startUpgrade / openPortal / connectGoogleCalendar calls without
// depending on Stripe or Google wiring. `billingTier` is mutable so a test
// can flip between Free and Pro to exercise both rendered states.
const billingStartUpgrade = vi.fn()
const billingOpenPortal = vi.fn()
const billingConnectGoogleCalendar = vi.fn(async () => ({ ok: true }))
let billingTier = 'free'
vi.mock('@/composables/useBilling.js', () => ({
  useBilling: () => ({
    startUpgrade: billingStartUpgrade,
    openPortal: billingOpenPortal,
    connectGoogleCalendar: billingConnectGoogleCalendar,
    currentTier: () => billingTier,
    isPaid: () => billingTier !== 'free'
  })
}))

import SettingsView from '@/views/SettingsView.vue'
import { useAuthStore } from '@/stores/auth.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// ── Stubs ─────────────────────────────────────────────────────────────────────

const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  // Button and SegmentedControl need to emit events for interaction tests
  Button: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  SegmentedControl: {
    props: ['modelValue', 'options'],
    template:
      '<div><button v-for="o in options" :key="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>',
    emits: ['update:modelValue']
  },
  SettingRow: { template: '<div><slot /><slot name="default" /></div>' },
  RouterLink: true
}

// ── Mount helper ──────────────────────────────────────────────────────────────

function buildUser(settings = {}, subscription = undefined) {
  return {
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    settings: {
      coachPersonality: 'gentle',
      checkIns: ['morning'],
      stalledNudgeDays: 7,
      theme: 'warm',
      mode: 'light',
      journalVisibility: 'private',
      ...settings
    },
    subscription
  }
}

// Mock useTheme composable
vi.mock('@/composables/useTheme.js', () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    setMode: vi.fn()
  })
}))

// Mock useErrorToast composable
const mockToastError = vi.fn()
vi.mock('@/composables/useErrorToast.js', () => ({
  useErrorToast: () => ({
    toastError: mockToastError
  })
}))

function mountSettings(userSettings = {}, subscription = undefined) {
  return mount(SettingsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: buildUser(userSettings, subscription),
              accessToken: 'tok',
              loading: false,
              error: ''
            }
          }
        }),
        i18n
      ]
    }
  })
}

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    mockToastError.mockReset()
    billingStartUpgrade.mockReset()
    billingOpenPortal.mockReset()
    billingConnectGoogleCalendar.mockReset()
    billingConnectGoogleCalendar.mockResolvedValue({ ok: true })
    routerReplaceMock.mockReset()
    routeQueryMock = {}
    billingTier = 'free'
  })

  // -- Rendering --

  it('renders without errors', () => {
    const wrapper = mountSettings()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the Coach section header', () => {
    const wrapper = mountSettings()
    const headers = wrapper.findAll('section-header-stub')
    expect(headers.some(h => h.attributes('label') === 'Coach')).toBe(true)
  })

  it('renders the Look section header', () => {
    const wrapper = mountSettings()
    const headers = wrapper.findAll('section-header-stub')
    expect(headers.some(h => h.attributes('label') === 'Look')).toBe(true)
  })

  it('renders the Privacy section header', () => {
    const wrapper = mountSettings()
    const headers = wrapper.findAll('section-header-stub')
    expect(headers.some(h => h.attributes('label') === 'Privacy')).toBe(true)
  })

  it('renders check-in buttons for morning, midday, evening, stuck', () => {
    const wrapper = mountSettings()
    const text = wrapper.text()
    expect(text).toContain('Morning')
    expect(text).toContain('Midday')
    expect(text).toContain('Evening')
    expect(text).toContain('Stuck')
  })

  // -- Computed: settings --

  it('returns empty object for settings when user has no settings', () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { auth: { user: null, accessToken: null, loading: false, error: '' } }
          }),
          i18n
        ]
      }
    })
    expect(wrapper.vm.settings).toEqual({})
  })

  it('stalledNudge defaults to null when not set', () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: globalStubs,
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: { id: 'u1', name: 'T', email: 't@t.com', settings: {} },
                accessToken: 'tok',
                loading: false,
                error: ''
              }
            }
          }),
          i18n
        ]
      }
    })
    expect(wrapper.vm.stalledNudge).toBeNull()
  })

  it('stalledNudge reflects settings.stalledNudgeDays', () => {
    const wrapper = mountSettings({ stalledNudgeDays: 10 })
    expect(wrapper.vm.stalledNudge).toBe(10)
  })

  // -- hasCheckIn --

  it('hasCheckIn returns true when the slot is in the list', () => {
    const wrapper = mountSettings({ checkIns: ['morning', 'evening'] })
    expect(wrapper.vm.hasCheckIn('morning')).toBe(true)
    expect(wrapper.vm.hasCheckIn('midday')).toBe(false)
  })

  it('hasCheckIn returns false when checkIns is empty', () => {
    const wrapper = mountSettings({ checkIns: [] })
    expect(wrapper.vm.hasCheckIn('morning')).toBe(false)
  })

  // -- toggleCheckIn (WEB-T08-010 fix) --

  it('toggleCheckIn adds a check-in slot when not present', async () => {
    const wrapper = mountSettings({ checkIns: ['morning'] })
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.toggleCheckIn('evening')

    expect(store.updateSettings).toHaveBeenCalledWith({ checkIns: ['morning', 'evening'] })
  })

  it('toggleCheckIn removes a check-in slot when already present', async () => {
    const wrapper = mountSettings({ checkIns: ['morning', 'evening'] })
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.toggleCheckIn('morning')

    expect(store.updateSettings).toHaveBeenCalledWith({ checkIns: ['evening'] })
  })

  it('toggleCheckIn shows error toast when updateSettings throws', async () => {
    const wrapper = mountSettings({ checkIns: ['morning'] })
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Network error'))

    await wrapper.vm.toggleCheckIn('evening')

    expect(mockToastError).toHaveBeenCalledWith(
      expect.any(Error),
      'Failed to update check-in setting'
    )
  })

  // -- onPersonalityChange (WEB-T08-010 fix) --

  it('onPersonalityChange calls updateSettings with the new personality', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onPersonalityChange('direct')

    expect(store.updateSettings).toHaveBeenCalledWith({ coachPersonality: 'direct' })
  })

  it('onPersonalityChange shows error toast on failure', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Oops'))

    await wrapper.vm.onPersonalityChange('direct')

    expect(mockToastError).toHaveBeenCalled()
  })

  // -- onNudgeChange (WEB-T08-010 fix) --

  it('onNudgeChange calls updateSettings with stalledNudgeDays', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onNudgeChange(10)

    expect(store.updateSettings).toHaveBeenCalledWith({ stalledNudgeDays: 10 })
  })

  it('onNudgeChange can set stalledNudgeDays to null (Never)', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onNudgeChange(null)

    expect(store.updateSettings).toHaveBeenCalledWith({ stalledNudgeDays: null })
  })

  it('onNudgeChange shows error toast on failure', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Fail'))

    await wrapper.vm.onNudgeChange(4)

    expect(mockToastError).toHaveBeenCalled()
  })

  // -- onThemeChange (WEB-T08-010 fix) --

  it('onThemeChange calls updateSettings with the new theme', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onThemeChange('ink')

    expect(store.updateSettings).toHaveBeenCalledWith({ theme: 'ink' })
  })

  it('onThemeChange shows error toast on failure', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Fail'))

    await wrapper.vm.onThemeChange('rose')

    expect(mockToastError).toHaveBeenCalled()
  })

  // -- onModeChange (WEB-T08-010 fix) --

  it('onModeChange calls updateSettings with the new mode', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onModeChange('dark')

    expect(store.updateSettings).toHaveBeenCalledWith({ mode: 'dark' })
  })

  it('onModeChange shows error toast on failure', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Fail'))

    await wrapper.vm.onModeChange('dark')

    expect(mockToastError).toHaveBeenCalled()
  })

  // -- onVisibilityChange (WEB-T08-010 fix) --

  it('onVisibilityChange calls updateSettings with the new journalVisibility', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockResolvedValue({})

    await wrapper.vm.onVisibilityChange('themed')

    expect(store.updateSettings).toHaveBeenCalledWith({ journalVisibility: 'themed' })
  })

  it('onVisibilityChange shows error toast on failure', async () => {
    const wrapper = mountSettings()
    const store = useAuthStore()
    store.updateSettings.mockRejectedValue(new Error('Fail'))

    await wrapper.vm.onVisibilityChange('open')

    expect(mockToastError).toHaveBeenCalled()
  })

  // -- Billing section --

  it('renders a Billing section header', () => {
    const wrapper = mountSettings()
    const headers = wrapper.findAll('section-header-stub')
    expect(headers.some(h => h.attributes('label') === 'Billing')).toBe(true)
  })

  it('shows "Free" plan label for users with no subscription', () => {
    const wrapper = mountSettings()
    expect(wrapper.vm.planLabel).toBe('Free')
    expect(wrapper.text()).toContain('Free')
  })

  it('shows "Pro" plan label for paid users', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    expect(wrapper.vm.planLabel).toBe('Pro')
    expect(wrapper.vm.isPaid).toBe(true)
  })

  it('shows "Family" plan label for family tier', () => {
    billingTier = 'family'
    const wrapper = mountSettings({}, { tier: 'family' })
    expect(wrapper.vm.planLabel).toBe('Family')
  })

  it('renders an Upgrade to Pro CTA for Free users', () => {
    billingTier = 'free'
    const wrapper = mountSettings({}, { tier: 'free' })
    expect(wrapper.text()).toContain('Upgrade to Pro')
    expect(wrapper.vm.isPaid).toBe(false)
  })

  it('does NOT render the Upgrade CTA for Pro users', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    // The upgrade row description is the marker; it is not rendered when Pro
    // is active. Plan-description row remains.
    expect(wrapper.text()).not.toContain('200 Wren turns/day, calendar sync, and everything')
  })

  it('renders a Manage subscription affordance for Pro users', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    expect(wrapper.text()).toContain('Open Stripe portal')
  })

  it('does NOT render the Manage subscription row for Free users', () => {
    billingTier = 'free'
    const wrapper = mountSettings({}, { tier: 'free' })
    expect(wrapper.text()).not.toContain('Open Stripe portal')
  })

  it('onUpgradeClick calls billing.startUpgrade with the wren-pro planId', () => {
    const wrapper = mountSettings()
    wrapper.vm.onUpgradeClick()
    expect(billingStartUpgrade).toHaveBeenCalledWith('wren-pro')
  })

  it('onManageClick calls billing.openPortal', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    wrapper.vm.onManageClick()
    expect(billingOpenPortal).toHaveBeenCalled()
  })

  it('nextBillingLabel formats currentPeriodEnd as "Renews <date>" for active subscriptions', () => {
    billingTier = 'pro'
    const wrapper = mountSettings(
      {},
      { tier: 'pro', status: 'active', currentPeriodEnd: '2026-06-30T00:00:00Z' }
    )
    expect(wrapper.vm.nextBillingLabel).toMatch(/^Renews /)
    expect(wrapper.vm.nextBillingLabel).toContain('2026')
  })

  it('nextBillingLabel formats currentPeriodEnd as "Ends <date>" for canceled subscriptions', () => {
    billingTier = 'pro'
    const wrapper = mountSettings(
      {},
      { tier: 'pro', status: 'canceled', currentPeriodEnd: '2026-06-30T00:00:00Z' }
    )
    expect(wrapper.vm.nextBillingLabel).toMatch(/^Ends /)
  })

  it('nextBillingLabel returns empty string when no currentPeriodEnd', () => {
    const wrapper = mountSettings()
    expect(wrapper.vm.nextBillingLabel).toBe('')
  })

  it('nextBillingLabel returns empty string for invalid currentPeriodEnd', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro', currentPeriodEnd: 'not-a-date' })
    expect(wrapper.vm.nextBillingLabel).toBe('')
  })

  it('planDescription describes the Free tier with the cap', () => {
    const wrapper = mountSettings()
    expect(wrapper.vm.planDescription).toContain('5 Wren turns/day')
  })

  it('planDescription describes the Pro tier', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    expect(wrapper.vm.planDescription).toContain('Pro')
    expect(wrapper.vm.planDescription).toContain('200')
  })

  it('planDescription describes the Family tier with seats info', () => {
    billingTier = 'family'
    const wrapper = mountSettings({}, { tier: 'family' })
    expect(wrapper.vm.planDescription.toLowerCase()).toContain('family')
    expect(wrapper.vm.planDescription).toContain('5')
  })

  // -- Google Calendar connect button --

  it('renders the "Connect Google Calendar" label for Pro users', () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    expect(wrapper.text()).toContain('Connect Google Calendar')
  })

  it('renders the "Available on Pro" label for Free users', () => {
    billingTier = 'free'
    const wrapper = mountSettings()
    expect(wrapper.text()).toContain('Available on Pro')
    expect(wrapper.text()).not.toContain('Connect Google Calendar')
  })

  it('calls billing.connectGoogleCalendar when a Pro user clicks Connect', async () => {
    billingTier = 'pro'
    const wrapper = mountSettings({}, { tier: 'pro' })
    await wrapper.vm.onConnectCalendarClick()
    expect(billingConnectGoogleCalendar).toHaveBeenCalledTimes(1)
    expect(billingStartUpgrade).not.toHaveBeenCalled()
  })

  it('routes Free users through startUpgrade instead of connectGoogleCalendar', async () => {
    billingTier = 'free'
    const wrapper = mountSettings()
    await wrapper.vm.onConnectCalendarClick()
    expect(billingStartUpgrade).toHaveBeenCalledWith('wren-pro')
    expect(billingConnectGoogleCalendar).not.toHaveBeenCalled()
  })

  it('does not double-fire while a connect call is in flight', async () => {
    billingTier = 'pro'
    let resolveConnect
    billingConnectGoogleCalendar.mockReturnValue(
      new Promise(res => {
        resolveConnect = () => res({ ok: true })
      })
    )
    const wrapper = mountSettings({}, { tier: 'pro' })
    const first = wrapper.vm.onConnectCalendarClick()
    // Second click while the first is mid-flight should be a no-op.
    await wrapper.vm.onConnectCalendarClick()
    resolveConnect()
    await first
    expect(billingConnectGoogleCalendar).toHaveBeenCalledTimes(1)
  })

  it('exposes calendarConnectDescription tailored to the tier', () => {
    billingTier = 'pro'
    const wrapperPro = mountSettings({}, { tier: 'pro' })
    expect(wrapperPro.vm.calendarConnectDescription.toLowerCase()).toContain('two-way')

    billingTier = 'free'
    const wrapperFree = mountSettings()
    expect(wrapperFree.vm.calendarConnectDescription.toLowerCase()).toContain('available on pro')
  })
})
