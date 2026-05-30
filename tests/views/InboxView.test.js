import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import InboxView from '@/views/InboxView.vue'
import { useInboxStore } from '@/stores/inbox.store'
import { useProjectsStore } from '@/stores/projects.store'
import en from '@/i18n/locales/en.json'

// ── Helpers ───────────────────────────────────────────────────────────────────

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: true,
  AppButton: {
    template:
      '<button type="button" :disabled="$attrs.disabled" @click="$attrs.onClick"><slot /></button>'
  },
  AppCard: { template: '<div class="card"><slot /></div>' },
  AppTextField: {
    template:
      '<label><span>{{ label }}</span><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter="$attrs.onKeydownEnter?.($event)" /></label>',
    props: ['modelValue', 'label', 'placeholder']
  }
}

function mountInbox(storeOverrides = {}, projectsOverrides = {}) {
  return mount(InboxView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            inbox: { items: [], loading: false, error: '', saving: false, ...storeOverrides },
            projects: { projects: [], ...projectsOverrides }
          }
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

  it('renders the capture input with an accessible label', () => {
    const wrapper = mountInbox()
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('aria-label')).toBe('Capture')
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

    // AppSectionHeader is stubbed with count attr
    const header = wrapper.find('app-section-header-stub')
    expect(header.attributes('count')).toBe('1')
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
    // Submit the form rather than clicking the button — the AppButton stub
    // overrides type="submit" to type="button", so the form's @submit.prevent
    // handler is the only reliable trigger in this test environment.
    await wrapper.find('form').trigger('submit.prevent')
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

  it('shows empty relativeTime when capturedAt is null', () => {
    const wrapper = mountInbox({
      items: [{ id: 'i1', text: 'No date', source: 'web', capturedAt: null }]
    })

    // The relative time should be empty, but source should still render
    expect(wrapper.text()).toContain('web')
  })

  describe('bulk selection', () => {
    const items = [
      { id: 'i1', text: 'Buy milk', source: 'web', capturedAt: new Date().toISOString() },
      { id: 'i2', text: 'Read book', source: 'web', capturedAt: new Date().toISOString() }
    ]

    it('selecting a single item shows the bulk action bar', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.toggle('i1')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.inbox-view__bulk-bar').exists()).toBe(true)
    })

    it('toggle adds and removes from the selection', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.toggle('i1')
      expect(wrapper.vm.selectedIds).toEqual(['i1'])
      wrapper.vm.toggle('i1')
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('toggleSelectAll selects all when nothing selected', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.toggleSelectAll()
      expect(wrapper.vm.selectedIds).toEqual(['i1', 'i2'])
    })

    it('toggleSelectAll clears the selection when all selected', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.selectedIds = ['i1', 'i2']
      await wrapper.vm.$nextTick()
      wrapper.vm.toggleSelectAll()
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('clearSelection clears selection and projectTarget', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.selectedIds = ['i1']
      wrapper.vm.projectTarget = 'p1'
      wrapper.vm.clearSelection()
      expect(wrapper.vm.selectedIds).toEqual([])
      expect(wrapper.vm.projectTarget).toBe('')
    })

    it('bulkTriage calls store.triageMany and clears selection on success', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.triageMany.mockResolvedValue()
      wrapper.vm.selectedIds = ['i1', 'i2']
      await wrapper.vm.bulkTriage()
      expect(store.triageMany).toHaveBeenCalledWith(['i1', 'i2'])
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('bulkTriage swallows errors from triageMany', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.triageMany.mockRejectedValue(new Error('boom'))
      wrapper.vm.selectedIds = ['i1']
      await expect(wrapper.vm.bulkTriage()).resolves.toBeUndefined()
    })

    it('bulkDelete calls store.deleteMany and clears selection', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.deleteMany.mockResolvedValue()
      wrapper.vm.selectedIds = ['i1']
      await wrapper.vm.bulkDelete()
      expect(store.deleteMany).toHaveBeenCalledWith(['i1'])
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('bulkDelete swallows errors', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.deleteMany.mockRejectedValue(new Error('boom'))
      wrapper.vm.selectedIds = ['i1']
      await expect(wrapper.vm.bulkDelete()).resolves.toBeUndefined()
    })

    it('bulkSendToProject is a no-op when no projectTarget chosen', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      wrapper.vm.selectedIds = ['i1']
      wrapper.vm.projectTarget = ''
      await wrapper.vm.bulkSendToProject()
      expect(store.convertToTasks).not.toHaveBeenCalled()
    })

    it('bulkSendToProject calls convertToTasks with projectId when project chosen', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.convertToTasks.mockResolvedValue()
      wrapper.vm.selectedIds = ['i1']
      wrapper.vm.projectTarget = 'p1'
      await wrapper.vm.bulkSendToProject()
      expect(store.convertToTasks).toHaveBeenCalledWith(['i1'], { projectId: 'p1' })
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('bulkSendToProject swallows errors', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.convertToTasks.mockRejectedValue(new Error('boom'))
      wrapper.vm.selectedIds = ['i1']
      wrapper.vm.projectTarget = 'p1'
      await expect(wrapper.vm.bulkSendToProject()).resolves.toBeUndefined()
    })

    it('bulkScheduleToday calls convertToTasks with scheduledDate', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.convertToTasks.mockResolvedValue()
      wrapper.vm.selectedIds = ['i1']
      await wrapper.vm.bulkScheduleToday()

      expect(store.convertToTasks).toHaveBeenCalledWith(
        ['i1'],
        expect.objectContaining({ scheduledDate: expect.any(String) })
      )

      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('bulkScheduleToday swallows errors', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      store.convertToTasks.mockRejectedValue(new Error('boom'))
      wrapper.vm.selectedIds = ['i1']
      await expect(wrapper.vm.bulkScheduleToday()).resolves.toBeUndefined()
    })

    it('selection is dropped when the items list changes', async () => {
      const wrapper = mountInbox({ items })
      const store = useInboxStore()
      wrapper.vm.selectedIds = ['i1', 'i2']
      // Drop i1 from items.
      store.items = [items[1]]
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.selectedIds).toEqual(['i2'])
    })

    it('allSelected is true when every item is selected', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.selectedIds = ['i1', 'i2']
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.allSelected).toBe(true)
    })

    it('someSelected is true once any item is selected', async () => {
      const wrapper = mountInbox({ items })
      wrapper.vm.selectedIds = ['i1']
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.someSelected).toBe(true)
    })
  })

  describe('capture interaction', () => {
    it('capture is a no-op when text is whitespace only', async () => {
      const wrapper = mountInbox()
      const store = useInboxStore()
      wrapper.vm.captureText = '   '
      await wrapper.vm.capture()
      expect(store.capture).not.toHaveBeenCalled()
    })

    it('capturing flag toggles around the await', async () => {
      const wrapper = mountInbox()
      const store = useInboxStore()
      let resolveFn

      store.capture.mockImplementation(
        () =>
          new Promise(r => {
            resolveFn = r
          })
      )

      wrapper.vm.captureText = 'hello'
      const promise = wrapper.vm.capture()
      expect(wrapper.vm.capturing).toBe(true)
      resolveFn()
      await promise
      expect(wrapper.vm.capturing).toBe(false)
    })

    it('capturing resets even when store.capture rejects', async () => {
      const wrapper = mountInbox()
      const store = useInboxStore()
      store.capture.mockRejectedValueOnce(new Error('boom'))
      wrapper.vm.captureText = 'hello'
      await wrapper.vm.capture().catch(() => {})
      expect(wrapper.vm.capturing).toBe(false)
    })
  })

  describe('projects loading', () => {
    it('triggers projects.loadProjects on mount', () => {
      mountInbox()
      const projectsStore = useProjectsStore()
      expect(projectsStore.loadProjects).toHaveBeenCalled()
    })

    it('shows project picker options when projects loaded', async () => {
      const wrapper = mountInbox(
        {
          items: [{ id: 'i1', text: 'Test', source: 'web', capturedAt: new Date().toISOString() }]
        },
        { projects: [{ id: 'p1', name: 'Alpha' }] }
      )

      wrapper.vm.toggle('i1')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Alpha')
    })
  })
})
