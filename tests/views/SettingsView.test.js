import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import SettingsView from '@/views/SettingsView.vue'
import { useAuthStore } from '@/stores/auth.store'

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

function buildUser(settings = {}) {
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
    }
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

function mountSettings(userSettings = {}) {
  return mount(SettingsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: buildUser(userSettings),
              accessToken: 'tok',
              loading: false,
              error: ''
            }
          }
        })
      ]
    }
  })
}

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    mockToastError.mockReset()
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
          })
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
          })
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
})
