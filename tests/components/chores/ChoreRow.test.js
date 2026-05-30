import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import ChoreRow from '@/components/chores/ChoreRow.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const globalConfig = { plugins: [i18n] }

const baseChore = {
  id: 'c1',
  title: 'Morning walk',
  cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: null },
  streak: 7,
  bestStreak: 14,
  lastCompletedOn: null,
  active: true,
  snoozedUntil: null,
  skipNextDate: null,
  recentCompletions: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  order: 0
}

describe('ChoreRow', () => {
  describe('rendering', () => {
    it('renders the chore title', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      expect(wrapper.text()).toContain('Morning walk')
    })

    it('renders a status pill instead of a streak number', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      expect(wrapper.find('.chore-status-pill').exists()).toBe(true)
      // Streak number must not be the visual focus of the row anymore — it
      // lives on the Stats view, not here.
      expect(wrapper.find('.chore-streak-badge').exists()).toBe(false)
    })

    it('renders daily cadence as "Every day" (no raw enum)', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      expect(wrapper.text()).toContain('Every day')
      expect(wrapper.text()).not.toMatch(/\bdaily\b/)
    })

    it('renders weekly cadence with empty daysOfWeek as "Weekly"', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'weekly', daysOfWeek: [], interval: 1, dayOfMonth: null }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('Weekly')
    })

    it('renders monthly cadence with null dayOfMonth as "Monthly"', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: null }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('Monthly')
    })

    it('falls back to raw value for unknown cadence type', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'custom', daysOfWeek: [], interval: 1, dayOfMonth: null }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('custom')
    })
  })

  describe('cadence labels (new)', () => {
    it('renders dot-separated 3-letter days for weekly with daysOfWeek', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'weekly', daysOfWeek: [1, 3, 5], interval: 1, dayOfMonth: null }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toMatch(/Mon.*Wed.*Fri/)
    })

    it('renders "Day 15 of each month" for monthly with dayOfMonth=15', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: 15 }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('Day 15 of each month')
    })

    it('renders "Every 3 days" for daily interval=3', () => {
      const chore = {
        ...baseChore,
        cadence: { type: 'daily', daysOfWeek: [], interval: 3, dayOfMonth: null }
      }

      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('Every 3 days')
    })
  })

  describe('completion state', () => {
    it('shows title as active when not completed today', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      expect(wrapper.find('.chore-row__title--active').exists()).toBe(true)
      expect(wrapper.find('.chore-row__title--muted').exists()).toBe(false)
    })

    it('shows title as muted when completed today (local date)', () => {
      const today = new Date().toLocaleDateString('en-CA')
      const chore = { ...baseChore, lastCompletedOn: today }
      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.find('.chore-row__title--muted').exists()).toBe(true)
    })
  })

  describe('status pill', () => {
    it('shows "Done today" when lastCompletedOn is today', () => {
      const today = new Date().toLocaleDateString('en-CA')
      const chore = { ...baseChore, lastCompletedOn: today }
      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toContain('Done today')
    })

    it('shows "Snoozed until …" when snoozedUntil is in the future', () => {
      const future = new Date(Date.now() + 7 * 86_400_000).toISOString()
      const chore = { ...baseChore, snoozedUntil: future }
      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      expect(wrapper.text()).toMatch(/Snoozed until/)
    })

    it('shows "Due" as the default state', () => {
      // Created today + no missed completions yet → status is "due", not
      // "1 day late". baseChore's createdAt is in May, which means by today
      // it would have a stack of missed due-days and read as overdue.
      const today = new Date().toISOString()
      const chore = { ...baseChore, createdAt: today }
      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      const pill = wrapper.find('.chore-status-pill')
      expect(pill.exists()).toBe(true)
      expect(pill.text()).toBe('Due')
    })
  })

  describe('recent strip', () => {
    it('renders 7 dots', () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      expect(wrapper.findAll('.chore-recent-strip__dot')).toHaveLength(7)
    })
  })

  describe('edit + delete + move actions', () => {
    it('clicking the title emits "edit"', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      await wrapper.find('.chore-row__title').trigger('click')
      expect(wrapper.emitted('edit')).toEqual([['c1']])
    })

    it('overflow menu has Edit, Move up, Move down, Delete entries', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      await wrapper.find('.chore-row__menu-trigger').trigger('click')
      const items = wrapper.findAll('.chore-row__menu-item').map(i => i.text())
      expect(items.some(t => t === 'Edit')).toBe(true)
      expect(items.some(t => t === 'Move up')).toBe(true)
      expect(items.some(t => t === 'Move down')).toBe(true)
      expect(items.some(t => t === 'Delete')).toBe(true)
    })

    it('Delete emits "delete"', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      await wrapper.find('.chore-row__menu-trigger').trigger('click')
      const deleteItem = wrapper.findAll('.chore-row__menu-item').find(i => i.text() === 'Delete')
      await deleteItem.trigger('click')
      expect(wrapper.emitted('delete')).toEqual([['c1']])
    })

    it('Move up disabled when atTop', async () => {
      const wrapper = mount(ChoreRow, {
        props: { chore: baseChore, atTop: true },
        global: globalConfig
      })

      await wrapper.find('.chore-row__menu-trigger').trigger('click')
      const up = wrapper.findAll('.chore-row__menu-item').find(i => i.text() === 'Move up')
      expect(up.attributes('disabled')).toBeDefined()
    })

    it('Move down disabled when atBottom', async () => {
      const wrapper = mount(ChoreRow, {
        props: { chore: baseChore, atBottom: true },
        global: globalConfig
      })

      await wrapper.find('.chore-row__menu-trigger').trigger('click')
      const down = wrapper.findAll('.chore-row__menu-item').find(i => i.text() === 'Move down')
      expect(down.attributes('disabled')).toBeDefined()
    })
  })

  describe('snooze and resume', () => {
    it('emits "snooze" with end-of-day timestamp on snooze 1 day', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      await wrapper.find('.chore-row__menu-trigger').trigger('click')

      const item = wrapper
        .findAll('.chore-row__menu-item')
        .find(i => i.text().includes('Snooze 1 day'))

      await item.trigger('click')
      const events = wrapper.emitted('snooze')
      expect(events).toBeTruthy()
      expect(events[0][0].id).toBe('c1')
      expect(events[0][0].until).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      // End-of-day 1 calendar day from now → within ~26h, never in the past
      const ms = new Date(events[0][0].until).getTime() - Date.now()
      expect(ms).toBeGreaterThan(0)
      // Adding 1 calendar day + end-of-local-day can span up to ~48h depending on UTC offset
      expect(ms).toBeLessThan(50 * 3600 * 1000)
    })

    it('shows Resume entry instead of Snooze items when snoozed', async () => {
      const future = new Date(Date.now() + 86_400_000).toISOString()
      const chore = { ...baseChore, snoozedUntil: future }
      const wrapper = mount(ChoreRow, { props: { chore }, global: globalConfig })
      await wrapper.find('.chore-row__menu-trigger').trigger('click')
      const items = wrapper.findAll('.chore-row__menu-item').map(i => i.text())
      expect(items.some(t => t === 'Resume')).toBe(true)
      expect(items.some(t => t.includes('Snooze'))).toBe(false)
    })

    it('emits "snooze-until" when Snooze until… is clicked', async () => {
      const wrapper = mount(ChoreRow, { props: { chore: baseChore }, global: globalConfig })
      await wrapper.find('.chore-row__menu-trigger').trigger('click')

      const item = wrapper
        .findAll('.chore-row__menu-item')
        .find(i => i.text().includes('Snooze until'))

      await item.trigger('click')
      expect(wrapper.emitted('snooze-until')).toEqual([['c1']])
    })
  })
})
