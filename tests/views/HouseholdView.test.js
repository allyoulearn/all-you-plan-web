import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import HouseholdView from '@/views/HouseholdView.vue'
import { useHouseholdStore } from '@/stores/household.store'
import enRaw from '@/i18n/locales/en.json'

// vue-i18n treats `@` as the linked-message indicator. Literal `@` in
// translated strings (e.g. the email placeholder) breaks compilation, so
// escape each one to `{'@'}` which renders as a literal `@`. The source JSON
// already escapes its only literal `@` (household.invitePlaceholder), so this
// is idempotent: un-escape any existing `{'@'}` first, then re-escape every
// bare `@` — that way both raw and pre-escaped strings normalise correctly
// (a naive `@` → `{'@'}` pass would double-escape the source's `{'@'}`).
function sanitize(value) {
  if (typeof value === 'string') {
    return value.replace(/\{'@'\}/g, '@').replace(/@/g, "{'@'}")
  }

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
  AppSectionHeader: {
    props: ['label'],
    template: '<div class="section-stub">{{ label }}</div>'
  },
  AppIcon: true,
  RouterLink: { template: '<a><slot /></a>' },
  AppButton: {
    props: ['variant', 'disabled', 'icon'],
    emits: ['click'],
    template:
      '<button type="button" :data-variant="variant" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  },
  AppTextField: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input class="textfield-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppConfirmDialog: {
    props: ['modelValue', 'title', 'message'],
    emits: ['update:modelValue', 'confirm'],
    template:
      '<div class="confirm-stub" :data-open="modelValue ? \'1\' : \'0\'"><button class="confirm-stub__confirm" @click="$emit(\'confirm\')">confirm</button></div>'
  }
}

const YOU = {
  userId: 'me',
  name: 'Sam',
  initial: 'M',
  joinedAt: '2026-04-04T10:00:00Z',
  isYou: true
}

const PARTNER = {
  userId: 'u2',
  name: 'Jordan',
  initial: 'A',
  joinedAt: '2026-04-12T09:30:00Z',
  isYou: false
}

const ACTIVE_HOUSEHOLD = { id: 'hh1', name: 'Sam & Jordan', members: [YOU, PARTNER] }

const ACTIVITY = [
  {
    id: 'a1',
    actorName: 'Jordan',
    actorInitial: 'A',
    verb: 'completed',
    subject: 'Recycling',
    at: '2026-06-03T09:48:00Z'
  },
  {
    id: 'a2',
    actorName: 'Sam',
    actorInitial: 'M',
    verb: 'scheduled',
    subject: 'Delivery',
    at: '2026-06-03T08:00:00Z'
  }
]

function mountHousehold(storeOverrides = {}) {
  return mount(HouseholdView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            household: {
              household: null,
              invitations: [],
              activity: [],
              loading: false,
              saving: false,
              error: '',
              ...storeOverrides
            }
          }
        }),
        i18n
      ]
    }
  })
}

describe('HouseholdView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('mounts cleanly with an empty store', () => {
    const wrapper = mountHousehold()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls store.load on mount', () => {
    mountHousehold()
    const store = useHouseholdStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  it('renders the solo empty state with an invite-by-email form', async () => {
    const wrapper = mountHousehold()
    await flushPromises()
    expect(wrapper.find('.house-empty').exists()).toBe(true)
    expect(wrapper.find('.house-empty__form').exists()).toBe(true)
    expect(wrapper.text()).toContain('flying')
    expect(wrapper.find('.textfield-stub').exists()).toBe(true)
  })

  it('submits the invite form and calls store.invite', async () => {
    const wrapper = mountHousehold()
    const store = useHouseholdStore()
    store.invite.mockResolvedValue({})
    await flushPromises()

    await wrapper.find('.textfield-stub').setValue('jordan@example.com')
    await wrapper.find('.house-empty__form').trigger('submit')
    await flushPromises()

    expect(store.invite).toHaveBeenCalledWith('jordan@example.com')
  })

  it('renders the active state with members list and activity feed', async () => {
    const wrapper = mountHousehold({ household: ACTIVE_HOUSEHOLD, activity: ACTIVITY })
    await flushPromises()

    expect(wrapper.find('.house-card').exists()).toBe(true)
    expect(wrapper.findAll('.member-row').length).toBe(2)
    expect(wrapper.find('.activity-feed').exists()).toBe(true)
    expect(wrapper.findAll('.activity-row').length).toBe(2)
    expect(wrapper.text()).toContain('Sam & Jordan')
    expect(wrapper.text()).toContain('Jordan')
  })

  it('shows the per-surface sharing card in the active state', async () => {
    const wrapper = mountHousehold({ household: ACTIVE_HOUSEHOLD })
    await flushPromises()
    expect(wrapper.find('.house-share__list').exists()).toBe(true)
    expect(wrapper.findAll('.share-pill').length).toBeGreaterThan(0)
  })

  it('opens the leave confirmation and calls store.leave on confirm', async () => {
    const wrapper = mountHousehold({ household: ACTIVE_HOUSEHOLD })
    const store = useHouseholdStore()
    store.leave.mockResolvedValue(undefined)
    await flushPromises()

    const leaveBtn = wrapper.findAll('button').find(b => b.text().includes('Leave household'))
    await leaveBtn.trigger('click')

    // Two confirm dialogs render (remove member + leave household); the leave
    // one is the only one open after clicking "Leave household".
    const dialogs = wrapper.findAll('.confirm-stub')
    const openDialog = dialogs.find(d => d.attributes('data-open') === '1')
    expect(openDialog).toBeTruthy()

    await openDialog.find('.confirm-stub__confirm').trigger('click')
    await flushPromises()
    expect(store.leave).toHaveBeenCalled()
  })

  it('renders the sent state with a pending invitation and cancel action', async () => {
    const wrapper = mountHousehold({
      invitations: [
        {
          id: 'i1',
          email: 'jordan@example.com',
          status: 'pending',
          invitedBy: 'you',
          sentAt: '2026-06-03T08:00:00Z',
          expiresAt: '2026-06-10T08:00:00Z'
        }
      ]
    })

    await flushPromises()
    expect(wrapper.find('.invite-row').exists()).toBe(true)
    expect(wrapper.text()).toContain('jordan@example.com')
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    expect(cancelBtn).toBeTruthy()
  })

  it('renders the received state with accept and decline actions', async () => {
    const wrapper = mountHousehold({
      invitations: [
        {
          id: 'i1',
          email: 'jordan@example.com',
          status: 'pending',
          invitedBy: 'Jordan',
          sentAt: '2026-06-03T08:00:00Z',
          expiresAt: '2026-06-10T08:00:00Z'
        }
      ]
    })

    await flushPromises()
    expect(wrapper.find('.house-card--received').exists()).toBe(true)
    const accept = wrapper.findAll('button').find(b => b.text().includes('Accept'))
    const decline = wrapper.findAll('button').find(b => b.text().includes('Decline'))
    expect(accept).toBeTruthy()
    expect(decline).toBeTruthy()
  })

  it('renders the partner-left state', async () => {
    const wrapper = mountHousehold({ household: { id: 'hh1', name: 'Sam', members: [YOU] } })
    await flushPromises()
    expect(wrapper.text()).toContain('reverted to private')
  })
})
