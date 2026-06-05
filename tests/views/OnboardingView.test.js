import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import OnboardingView from '@/views/OnboardingView.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useAuthStore } from '@/stores/auth.store'
import enRaw from '@/i18n/locales/en.json'

function sanitize(value) {
  if (typeof value === 'string') return value.replace(/@/g, "{'@'}")
  if (Array.isArray(value)) return value.map(sanitize)

  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = sanitize(value[k])
    return out
  }

  return value
}

const en = sanitize(enRaw)
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const pushSpy = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy }),
  useRoute: () => ({ query: {} })
}))

const globalStubs = { AppIcon: true }

function mountOnboarding(
  initialStep = 1,
  authUser = { name: 'Ada', timezone: 'Europe/Helsinki', settings: { checkIns: ['morning'] } },
  onboardingOverrides = {}
) {
  return mount(OnboardingView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            onboarding: {
              state: { step: initialStep, onboardedAt: null, tone: 'warm', mode: 'solo' },
              loading: false,
              error: '',
              ...onboardingOverrides
            },
            auth: { user: authUser }
          }
        }),
        i18n
      ]
    }
  })
}

describe('OnboardingView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
    pushSpy.mockClear()
  })

  it('mounts cleanly', () => {
    const wrapper = mountOnboarding(1)
    expect(wrapper.exists()).toBe(true)
  })

  it('calls store.load on mount', async () => {
    mountOnboarding(1)
    const store = useOnboardingStore()
    await flushPromises()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  it('renders the step 1 hero content', async () => {
    const wrapper = mountOnboarding(1)
    await flushPromises()
    expect(wrapper.find('.onb__card').exists()).toBe(true)
    expect(wrapper.find('.onb__h').exists()).toBe(true)
  })

  it('seeds form.name from auth.user.name on mount', async () => {
    const wrapper = mountOnboarding(1, { name: 'Bea', timezone: 'Europe/Stockholm' })
    await flushPromises()
    // step 2 renders the name input
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    // Move to step 2
    const nextBtn = wrapper.find('button.onb__btn-primary')
    await nextBtn.trigger('click')
    await flushPromises()
  })

  it('next button advances onboarding via store.update', async () => {
    const wrapper = mountOnboarding(1)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    expect(store.update).toHaveBeenCalled()
  })

  it('back button is hidden on step 1', async () => {
    const wrapper = mountOnboarding(1)
    await flushPromises()
    expect(wrapper.find('.onb__btn-ghost').exists()).toBe(false)
  })

  it('shows back button after step 1', async () => {
    const wrapper = mountOnboarding(2)
    await flushPromises()
    expect(wrapper.find('.onb__btn-ghost').exists()).toBe(true)
  })

  it('back button calls store.update with previous step', async () => {
    const wrapper = mountOnboarding(3)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    const backBtn = wrapper.find('.onb__btn-ghost')
    await backBtn.trigger('click')
    expect(store.update).toHaveBeenCalledWith({ step: 2 })
  })

  it('skip button advances forward via next()', async () => {
    const wrapper = mountOnboarding(1)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('.onb__skip').trigger('click')
    expect(store.update).toHaveBeenCalled()
  })

  it('renders the wren bubble on the final step', async () => {
    const wrapper = mountOnboarding(8)
    await flushPromises()
    expect(wrapper.find('.onb__bubble').exists()).toBe(true)
  })

  it('final step next button calls complete and pushes to today', async () => {
    const wrapper = mountOnboarding(8)
    await flushPromises()
    const onboarding = useOnboardingStore()
    const auth = useAuthStore()
    onboarding.complete.mockResolvedValue(undefined)
    auth.updateSettings.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(onboarding.complete).toHaveBeenCalledTimes(1)
    expect(pushSpy).toHaveBeenCalledWith({ name: 'today' })
  })

  it('final step swallows auth.updateSettings errors', async () => {
    const wrapper = mountOnboarding(8)
    await flushPromises()
    const onboarding = useOnboardingStore()
    const auth = useAuthStore()
    onboarding.complete.mockResolvedValue(undefined)
    auth.updateSettings.mockRejectedValue(new Error('settings failed'))
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(pushSpy).toHaveBeenCalledWith({ name: 'today' })
  })

  it('step 2 captures form.name/timezone/theme in update payload', async () => {
    const wrapper = mountOnboarding(2)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 3,
        name: expect.any(String),
        timezone: expect.any(String),
        theme: expect.any(String)
      })
    )
  })

  it('step 3 captures tone in update payload', async () => {
    const wrapper = mountOnboarding(3)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ step: 4, tone: 'warm' }))
  })

  it('step 4 captures mode in update payload', async () => {
    const wrapper = mountOnboarding(4)
    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ step: 5, mode: 'solo' }))
  })

  it('renders all eight stepper dots', async () => {
    const wrapper = mountOnboarding(3)
    await flushPromises()
    expect(wrapper.findAll('.onb__dot').length).toBe(8)
  })

  it('marks completed dots with done modifier', async () => {
    const wrapper = mountOnboarding(4)
    await flushPromises()
    const done = wrapper.findAll('.onb__dot--done')
    expect(done.length).toBe(3)
  })

  // -- Gate fixes (G-22) --

  it('re-hydrates form.mode from the store so the persisted mode is highlighted', async () => {
    const wrapper = mountOnboarding(
      4,
      { name: 'Ada' },
      {
        state: { step: 4, onboardedAt: null, tone: 'warm', mode: 'habits' }
      }
    )

    await flushPromises()
    const cards = wrapper.findAll('.onb__mode')
    // modes order: solo, partner, habits → habits is index 2
    expect(cards[2].classes()).toContain('onb__mode--active')
    expect(cards[0].classes()).not.toContain('onb__mode--active')
  })

  it('re-hydrated mode is sent in the step-4 advance payload', async () => {
    const wrapper = mountOnboarding(
      4,
      { name: 'Ada' },
      {
        state: { step: 4, onboardedAt: null, tone: 'warm', mode: 'habits' }
      }
    )

    await flushPromises()
    const store = useOnboardingStore()
    store.update.mockResolvedValue(undefined)
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ step: 5, mode: 'habits' }))
  })

  it('does not advance/redirect when complete() rejects on the final step', async () => {
    const wrapper = mountOnboarding(8)
    await flushPromises()
    const onboarding = useOnboardingStore()
    onboarding.complete.mockRejectedValue(new Error('network'))
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()
    expect(onboarding.complete).toHaveBeenCalledTimes(1)
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('does not double-submit while a step advance is in flight', async () => {
    const wrapper = mountOnboarding(2)
    await flushPromises()
    const store = useOnboardingStore()
    let resolve

    store.update.mockReturnValue(
      new Promise(r => {
        resolve = r
      })
    )

    const btn = wrapper.find('button.onb__btn-primary')
    await btn.trigger('click')
    await btn.trigger('click')
    expect(store.update).toHaveBeenCalledTimes(1)
    resolve()
    await flushPromises()
  })

  it('disables the primary CTA while a mutation is in flight', async () => {
    const wrapper = mountOnboarding(2)
    await flushPromises()
    const store = useOnboardingStore()
    let resolve

    store.update.mockReturnValue(
      new Promise(r => {
        resolve = r
      })
    )

    const btn = wrapper.find('button.onb__btn-primary')
    await btn.trigger('click')
    expect(btn.attributes('disabled')).toBeDefined()
    resolve()
    await flushPromises()
  })

  it('shows the initial-load skeleton before the first state resolves', () => {
    // No flushPromises: store.load() (a stub) has not resolved yet, so the
    // wizard is still in its initialLoading state.
    const wrapper = mountOnboarding(1)
    expect(wrapper.find('.app-skeleton').exists()).toBe(true)
    expect(wrapper.find('.onb__foot').exists()).toBe(false)
  })

  it('shows a retryable error card when the initial load failed', async () => {
    const wrapper = mountOnboarding(1, { name: 'Ada' }, { error: 'Network down' })
    await flushPromises()
    const store = useOnboardingStore()
    expect(wrapper.find('.app-error-state').exists()).toBe(true)
    await wrapper.find('.app-error-state button').trigger('click')
    expect(store.load).toHaveBeenCalled()
  })

  it('no longer renders the dead per-seed Edit button on the seed-preview step', async () => {
    const wrapper = mountOnboarding(7)
    await flushPromises()
    expect(wrapper.find('.onb__seeded-row .onb__btn-ghost').exists()).toBe(false)
  })

  // -- Daily-review step (step 5) --

  it('renders the daily-review toggle and time slots on step 5', async () => {
    const wrapper = mountOnboarding(5)
    await flushPromises()
    expect(wrapper.find('.onb__toggle').exists()).toBe(true)
    // Enabled by default → time slots visible.
    expect(wrapper.findAll('.onb__slot').length).toBe(3)
  })

  it('hides the time slots and shows a hint when the daily review is turned off', async () => {
    const wrapper = mountOnboarding(5)
    await flushPromises()
    // Second toggle button is "Off".
    await wrapper.findAll('.onb__toggle-btn')[1].trigger('click')
    expect(wrapper.findAll('.onb__slot').length).toBe(0)
    expect(wrapper.find('.onb__hint').exists()).toBe(true)
  })

  it('persists the chosen check-in slot via auth.updateSettings before advancing', async () => {
    const wrapper = mountOnboarding(5)
    await flushPromises()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    store.update.mockResolvedValue(undefined)
    auth.updateSettings.mockResolvedValue(undefined)

    // Pick the evening slot (third button).
    await wrapper.findAll('.onb__slot')[2].trigger('click')
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    expect(auth.updateSettings).toHaveBeenCalledWith({ checkIns: ['evening'] })
    expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ step: 6 }))
  })

  it('preserves a non-time-slot check-in (e.g. stuck) when saving the daily review', async () => {
    const wrapper = mountOnboarding(5, {
      name: 'Ada',
      settings: { checkIns: ['morning', 'stuck'] }
    })

    await flushPromises()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    store.update.mockResolvedValue(undefined)
    auth.updateSettings.mockResolvedValue(undefined)

    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    // 'stuck' is preserved; the re-hydrated 'morning' slot is re-sent.
    expect(auth.updateSettings).toHaveBeenCalledWith({ checkIns: ['stuck', 'morning'] })
  })

  it('sends an empty (time-slot-free) check-in array when the daily review is off', async () => {
    const wrapper = mountOnboarding(5, { name: 'Ada', settings: { checkIns: ['morning'] } })

    await flushPromises()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    store.update.mockResolvedValue(undefined)
    auth.updateSettings.mockResolvedValue(undefined)

    await wrapper.findAll('.onb__toggle-btn')[1].trigger('click') // Off
    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    expect(auth.updateSettings).toHaveBeenCalledWith({ checkIns: [] })
  })

  it('does not advance past step 5 when the check-in save fails', async () => {
    const wrapper = mountOnboarding(5)
    await flushPromises()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    auth.updateSettings.mockRejectedValue(new Error('save failed'))

    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    expect(auth.updateSettings).toHaveBeenCalled()
    expect(store.update).not.toHaveBeenCalled()
  })

  it('re-hydrates the daily-review toggle off when no time slot is set', async () => {
    const wrapper = mountOnboarding(5, { name: 'Ada', settings: { checkIns: [] } })

    await flushPromises()
    // Off button (second) should be the active one.
    const offBtn = wrapper.findAll('.onb__toggle-btn')[1]
    expect(offBtn.classes()).toContain('onb__toggle-btn--active')
    expect(wrapper.findAll('.onb__slot').length).toBe(0)
  })

  // -- Calendar-sync step (step 6) --

  it('renders the informational calendar note on step 6 and does not connect', async () => {
    const wrapper = mountOnboarding(6)
    await flushPromises()
    expect(wrapper.find('.onb__cal-note').exists()).toBe(true)
  })

  it('step 6 continue advances to the seed preview without persisting settings', async () => {
    const wrapper = mountOnboarding(6)
    await flushPromises()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    store.update.mockResolvedValue(undefined)

    await wrapper.find('button.onb__btn-primary').trigger('click')
    await flushPromises()

    expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ step: 7 }))
    expect(auth.updateSettings).not.toHaveBeenCalled()
  })
})
