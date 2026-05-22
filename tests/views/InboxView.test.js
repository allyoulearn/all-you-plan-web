import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import InboxView from '@/views/InboxView.vue'
import { useInboxStore } from '@/stores/inbox.store'
import en from '@/i18n/locales/en.json'

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Button: {
    template:
      '<button type="button" :disabled="$attrs.disabled" @click="$attrs.onClick"><slot /></button>'
  },
  Card: { template: '<div class="card"><slot /></div>' },
  TextField: {
    template:
      '<label><span>{{ label }}</span><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter="$attrs.onKeydownEnter?.($event)" /></label>',
    props: ['modelValue', 'label', 'placeholder']
  }
}

function mountInbox(storeOverrides = {}) {
  return mount(InboxView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { inbox: { items: [], loading: false, error: '', ...storeOverrides } }
        }),
        i18n
      ]
    }
  })
}

describe('InboxView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // ── Loading / error states ─────────────────────────────────────────────────

  it('shows loading indicator while loading', () => {
    const wrapper = mountInbox({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when error is set', () => {
    const wrapper = mountInbox({ error: 'Network failure' })
    expect(wrapper.text()).toContain('Network failure')
  })

  it('shows error with error style', () => {
    const wrapper = mountInbox({ error: 'Oops' })
    expect(wrapper.find('.inbox-view__status--error').exists()).toBe(true)
  })

  // ── Capture input (WEB-T08-003 fix) ───────────────────────────────────────

  it('renders the capture TextField with a label', () => {
    const wrapper = mountInbox()
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('Capture')
  })

  it('calls store.load on mount', () => {
    mountInbox()
    const store = useInboxStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  // ── Empty / populated list states ─────────────────────────────────────────

  it('shows empty state message when no items and not loading', () => {
    const wrapper = mountInbox({ items: [], loading: false })
    expect(wrapper.text()).toContain('Nothing to triage')
  })

  it('renders list items when items are present', () => {
    const wrapper = mountInbox({
      items: [
        { id: 'i1', text: 'Buy milk', source: 'web', capturedAt: new Date().toISOString() },
        { id: 'i2', text: 'Read book', source: 'mobile', capturedAt: new Date().toISOString() }
      ]
    })
    expect(wrapper.text()).toContain('Buy milk')
    expect(wrapper.text()).toContain('Read book')
  })

  it('renders item count in section header', () => {
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Test', source: 'web', capturedAt: new Date().toISOString() }]
    })
    // SectionHeader is stubbed with count attr
    const header = wrapper.find('section-header-stub')
    expect(header.attributes('count')).toBe('1')
  })

  it('renders index numbers padded to 2 digits', () => {
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'First', source: 'web', capturedAt: new Date().toISOString() }]
    })
    expect(wrapper.text()).toContain('01')
  })

  it('renders item source and relative time', () => {
    const wrapper = mountInbox({
      items: [
        { id: 'i1', text: 'Test item', source: 'mobile', capturedAt: new Date().toISOString() }
      ]
    })
    expect(wrapper.text()).toContain('mobile')
    expect(wrapper.text()).toContain('just now')
  })

  // ── Triage action ──────────────────────────────────────────────────────────

  it('calls store.triage when triage button is clicked', async () => {
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Test item', source: 'web', capturedAt: new Date().toISOString() }]
    })
    const store = useInboxStore()
    const triageBtn = wrapper.findAll('button').find(b => b.text().includes('Triage'))
    await triageBtn.trigger('click')
    expect(store.triage).toHaveBeenCalledWith('i1')
  })

  // ── Capture action ─────────────────────────────────────────────────────────

  it('capture button is disabled when input is empty', () => {
    const wrapper = mountInbox()
    const captureBtn = wrapper.findAll('button').find(b => b.text().includes('Capture'))
    expect(captureBtn.attributes('disabled')).toBeDefined()
  })

  it('calls store.capture with trimmed text and clears input on success', async () => {
    const wrapper = mountInbox()
    const store = useInboxStore()
    store.capture.mockResolvedValue()

    const input = wrapper.find('input')
    await input.setValue('Buy groceries')
    // Trigger capture by clicking the button
    const captureBtn = wrapper.findAll('button').find(b => b.text().includes('Capture'))
    await captureBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))

    expect(store.capture).toHaveBeenCalledWith('Buy groceries')
  })

  // ── relativeTime helper ────────────────────────────────────────────────────

  it('shows "just now" for very recent captures', () => {
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Fresh', source: 'web', capturedAt: new Date().toISOString() }]
    })
    expect(wrapper.text()).toContain('just now')
  })

  it('shows minutes-ago for a recent capture', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Old', source: 'web', capturedAt: fiveMinAgo }]
    })
    expect(wrapper.text()).toContain('5m ago')
  })

  it('shows hours-ago for an older capture', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Older', source: 'web', capturedAt: twoHoursAgo }]
    })
    expect(wrapper.text()).toContain('2h ago')
  })

  it('shows days-ago for a very old capture', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'Ancient', source: 'web', capturedAt: threeDaysAgo }]
    })
    expect(wrapper.text()).toContain('3d ago')
  })
})
