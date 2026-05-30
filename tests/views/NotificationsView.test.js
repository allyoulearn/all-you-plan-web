import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import NotificationsView from '@/views/NotificationsView.vue'
import { useNotificationsStore } from '@/stores/notifications.store'
import enRaw from '@/i18n/locales/en.json'

// vue-i18n treats `@` as the linked-message indicator. Literal `@` in
// translated strings (e.g. email placeholders) breaks message compilation.
// Replace each `@` with `{'@'}` — vue-i18n renders that as a literal `@`.
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

const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: true,
  RouterLink: { template: '<a><slot /></a>' },
  AppIcon: true,
  AppButton: { template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' }
}

const FAKE_SETTINGS = {
  permission: 'granted',
  pushEnabled: true,
  emailEnabled: false,
  inAppEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  dailyBriefingTime: '07:00',
  preferences: [{ categoryId: 'tasks.due', push: true, email: false, inApp: true }]
}

const DEVICES = [
  {
    id: 'd1',
    label: 'Mac',
    platform: 'web',
    current: true,
    status: 'live',
    lastSeenAt: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'd2',
    label: 'iPhone',
    platform: 'ios',
    current: false,
    status: 'stale',
    lastSeenAt: new Date(Date.now() - 3600000).toISOString()
  }
]

function mountNotif(storeOverrides = {}, authState = { user: { email: 'me@example.com' } }) {
  return mount(NotificationsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            notifications: {
              settings: null,
              devices: [],
              loading: false,
              error: '',
              ...storeOverrides
            },
            auth: authState
          }
        }),
        i18n
      ]
    }
  })
}

describe('NotificationsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('mounts cleanly', () => {
    const wrapper = mountNotif()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls store.load on mount', () => {
    mountNotif()
    const store = useNotificationsStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  it('shows loading status while no settings are loaded', () => {
    const wrapper = mountNotif({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders main sections once settings are loaded', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    expect(wrapper.find('.notif__card').exists()).toBe(true)
    expect(wrapper.find('.notif__table').exists()).toBe(true)
  })

  it('shows permission banner when permission is denied', async () => {
    const wrapper = mountNotif({
      settings: { ...FAKE_SETTINGS, permission: 'denied' },
      devices: DEVICES
    })

    await flushPromises()
    expect(wrapper.find('.notif__permission').exists()).toBe(true)
  })

  it('does not show permission banner when permission is granted', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    expect(wrapper.find('.notif__permission').exists()).toBe(false)
  })

  it('uses user email from auth store when present', async () => {
    const wrapper = mountNotif(
      { settings: FAKE_SETTINGS, devices: DEVICES },
      { user: { email: 'tester@example.com' } }
    )

    await flushPromises()
    expect(wrapper.text()).toContain('tester@example.com')
  })

  it('falls back to a placeholder email when auth.user is null', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES }, { user: null })
    await flushPromises()
    // userEmail computed selects the fallback branch; we just confirm we didn't crash
    // and didn't render the test user's email.
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).not.toContain('tester@example.com')
  })

  it('toggles a channel via setChannel when push button is clicked', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    const store = useNotificationsStore()
    const toggles = wrapper.findAll('button[aria-pressed]')
    // first is push toggle (matches the order in the template)
    await toggles[0].trigger('click')
    expect(store.updateSettings).toHaveBeenCalledWith({ pushEnabled: false })
  })

  it('toggles a preference via updatePreference when a cell button is clicked', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    const store = useNotificationsStore()
    // Cell toggles live inside .notif__cell; click the first push cell toggle
    const cellToggle = wrapper.find('.notif__table-row .notif__cell button')
    await cellToggle.trigger('click')
    expect(store.updatePreference).toHaveBeenCalled()
  })

  it('renders device rows for each device', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    expect(wrapper.text()).toContain('Mac')
    expect(wrapper.text()).toContain('iPhone')
  })

  it('revokes a non-current device when revoke button is clicked', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    const store = useNotificationsStore()

    // Template renders one enabled revoke button for non-current devices and a
    // disabled one for the current device; filter to the enabled ones.
    const revokeBtns = wrapper
      .findAll('button')
      .filter(b => b.text().includes('Revoke') && b.attributes('disabled') === undefined)

    await revokeBtns[0].trigger('click')
    expect(store.revokeDevice).toHaveBeenCalledWith('d2')
  })

  it('selects daily briefing time via setChannel', async () => {
    const wrapper = mountNotif({ settings: FAKE_SETTINGS, devices: DEVICES })
    await flushPromises()
    const store = useNotificationsStore()
    const timeBtn = wrapper.findAll('button').find(b => b.text().trim() === '06:30')
    await timeBtn.trigger('click')
    expect(store.updateSettings).toHaveBeenCalledWith({ dailyBriefingTime: '06:30' })
  })
})
