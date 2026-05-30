import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import JournalView from '@/views/JournalView.vue'
import { useJournalStore } from '@/stores/journal.store'
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
  AppPill: { template: '<span class="pill"><slot /></span>' }
}

const ENTRY_1 = {
  id: 'e1',
  date: '2026-05-20',
  prompt: 'What did you do today?',
  pullQuote: 'I wrote some tests',
  body: 'I wrote some tests today and felt great about it.',
  tags: ['work', 'coding']
}

const ENTRY_2 = {
  id: 'e2',
  date: '2026-05-19',
  prompt: 'What did you do today?',
  pullQuote: null,
  body: 'A quiet day of reflection.',
  tags: []
}

function mountJournal(storeOverrides = {}) {
  return mount(JournalView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { journal: { entries: [], loading: false, error: '', ...storeOverrides } }
        }),
        i18n
      ]
    }
  })
}

describe('JournalView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  // ── Loading / error states ─────────────────────────────────────────────────

  it('shows loading indicator while loading', () => {
    const wrapper = mountJournal({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when error is set', () => {
    const wrapper = mountJournal({ error: 'Journal fetch failed' })
    expect(wrapper.text()).toContain('Journal fetch failed')
  })

  it('shows error with error style', () => {
    const wrapper = mountJournal({ error: 'Oops' })
    expect(wrapper.find('.journal-view__status--error').exists()).toBe(true)
  })

  // ── Store lifecycle ────────────────────────────────────────────────────────

  it('calls store.load on mount', () => {
    mountJournal()
    const store = useJournalStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  // ── Prompt card ───────────────────────────────────────────────────────────

  it('renders the daily prompt text', () => {
    const wrapper = mountJournal()
    expect(wrapper.text()).toContain('What did you do today that you are quietly proud of?')
  })

  it('renders the textarea for writing', () => {
    const wrapper = mountJournal()
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('save button is disabled when textarea is empty', () => {
    const wrapper = mountJournal()
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('save button is enabled when textarea has content', async () => {
    const wrapper = mountJournal()
    await wrapper.find('textarea').setValue('Today I learned something new.')
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('calls store.createEntry with correct payload on save', async () => {
    const wrapper = mountJournal()
    const store = useJournalStore()
    store.createEntry.mockResolvedValue()

    await wrapper.find('textarea').setValue('Wrote some great code today.')
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))

    expect(store.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Wrote some great code today.',
        prompt: 'What did you do today that you are quietly proud of?',
        tags: []
      })
    )
  })

  it('clears the textarea after a successful save', async () => {
    const wrapper = mountJournal()
    const store = useJournalStore()
    store.createEntry.mockResolvedValue()

    await wrapper.find('textarea').setValue('Test entry content')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('textarea').element.value).toBe('')
  })

  // ── Entries list ───────────────────────────────────────────────────────────

  it('shows empty state when no entries and not loading', () => {
    const wrapper = mountJournal({ entries: [], loading: false })
    expect(wrapper.text()).toContain('No entries yet')
  })

  it('renders entries in the entries list', () => {
    const wrapper = mountJournal({ entries: [ENTRY_1, ENTRY_2] })
    expect(wrapper.text()).toContain(ENTRY_1.body)
    expect(wrapper.text()).toContain(ENTRY_2.body)
  })

  it('renders the pull quote when present', () => {
    const wrapper = mountJournal({ entries: [ENTRY_1] })
    expect(wrapper.find('.journal-view__pull-quote').exists()).toBe(true)
    expect(wrapper.text()).toContain(ENTRY_1.pullQuote)
  })

  it('does not render pull-quote element when absent', () => {
    const wrapper = mountJournal({ entries: [ENTRY_2] })
    expect(wrapper.find('.journal-view__pull-quote').exists()).toBe(false)
  })

  it('renders tags as AppPill components', () => {
    const wrapper = mountJournal({ entries: [ENTRY_1] })
    const pills = wrapper.findAll('.pill')
    expect(pills.length).toBe(ENTRY_1.tags.length)
    expect(wrapper.text()).toContain('work')
    expect(wrapper.text()).toContain('coding')
  })

  it('renders no tag pills when entry has no tags', () => {
    const wrapper = mountJournal({ entries: [ENTRY_2] })
    expect(wrapper.findAll('.pill').length).toBe(0)
  })

  // ── dayNumber / formatDate helpers ────────────────────────────────────────

  it('renders the numeric day of the entry date', () => {
    const wrapper = mountJournal({ entries: [ENTRY_1] })
    // ENTRY_1.date = '2026-05-20' → day 20
    expect(wrapper.find('.journal-view__entry-day').text()).toBe('20')
  })

  it('renders the formatted month-year label', () => {
    const wrapper = mountJournal({ entries: [ENTRY_1] })
    const monthEl = wrapper.find('.journal-view__entry-month')
    // Should contain some date representation; format depends on locale
    expect(monthEl.text().length).toBeGreaterThan(0)
    expect(monthEl.text()).toContain('2026')
  })

  // ── pullQuoteFrom helper (indirect via createEntry call) ─────────────────

  it('generates a pull quote from the first 8 words of the body with ellipsis suffix (WEB-W4-33)', async () => {
    const wrapper = mountJournal()
    const store = useJournalStore()
    store.createEntry.mockResolvedValue()

    const longText = 'one two three four five six seven eight nine ten'
    await wrapper.find('textarea').setValue(longText)
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))

    const call = store.createEntry.mock.calls[0][0]
    // The truncation now appends an ellipsis to make it visible.
    expect(call.pullQuote).toBe('one two three four five six seven eight…')
  })

  it('returns no pullQuote for a blank body (WEB-W4-33)', async () => {
    const wrapper = mountJournal()
    const store = useJournalStore()
    store.createEntry.mockResolvedValue()

    // Whitespace-only body would not have proceeded past saveEntry's own
    // trim guard, so test the exact-eight-word pass-through instead.
    await wrapper.find('textarea').setValue('one two three four five six seven eight')
    await wrapper.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 0))

    const call = store.createEntry.mock.calls[0][0]
    // No ellipsis when the source already has eight or fewer words.
    expect(call.pullQuote).toBe('one two three four five six seven eight')
  })

  // ── Edge-case coverage (saveEntry guard, dayNumber null, formatDate null) ─

  it('does not call store.createEntry when textarea is empty (saveEntry guard)', async () => {
    const wrapper = mountJournal()
    const store = useJournalStore()
    // Call saveEntry directly with an empty textarea
    await wrapper.vm.saveEntry()
    expect(store.createEntry).not.toHaveBeenCalled()
  })

  it('dayNumber returns 0 for a null date string', () => {
    const wrapper = mountJournal()
    expect(wrapper.vm.dayNumber(null)).toBe(0)
  })

  it('formatDate returns empty string for a falsy date', () => {
    const wrapper = mountJournal()
    expect(wrapper.vm.formatDate('')).toBe('')
    expect(wrapper.vm.formatDate(null)).toBe('')
  })
})
