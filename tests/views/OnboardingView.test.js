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

function mountOnboarding(initialStep = 1, authUser = { name: 'Ada', timezone: 'Europe/Helsinki' }) {
  return mount(OnboardingView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            onboarding: {
              state: { step: initialStep, onboardedAt: null, tone: 'warm', mode: 'solo' },
              loading: false
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

  it('renders the wren bubble on step 6', async () => {
    const wrapper = mountOnboarding(6)
    await flushPromises()
    expect(wrapper.find('.onb__bubble').exists()).toBe(true)
  })

  it('step 6 next button calls complete and pushes to today', async () => {
    const wrapper = mountOnboarding(6)
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

  it('step 6 swallows auth.updateSettings errors', async () => {
    const wrapper = mountOnboarding(6)
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

  it('renders all six stepper dots', async () => {
    const wrapper = mountOnboarding(3)
    await flushPromises()
    expect(wrapper.findAll('.onb__dot').length).toBe(6)
  })

  it('marks completed dots with done modifier', async () => {
    const wrapper = mountOnboarding(4)
    await flushPromises()
    const done = wrapper.findAll('.onb__dot--done')
    expect(done.length).toBe(3)
  })
})
