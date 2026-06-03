import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import TaskRow from '@/components/tasks/TaskRow.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// RouterLink is stubbed to a plain anchor that surfaces its `to` prop so the
// project-link pill can be asserted without a full router instance.
const globalConfig = {
  plugins: [i18n],
  stubs: {
    RouterLink: {
      props: ['to'],
      template: '<a class="router-link-stub" :data-to="to"><slot /></a>'
    }
  }
}

const baseTask = {
  id: 't1',
  title: 'Reply to accountant',
  note: null,
  urgency: 'critical',
  category: 'admin',
  kind: 'deadline',
  dueDate: '2026-05-19',
  due: { label: '2 days overdue', daysLeft: -2 },
  done: false,
  tag: null,
  project: null
}

function mountRow(overrides = {}) {
  return mount(TaskRow, { props: { task: { ...baseTask, ...overrides } }, global: globalConfig })
}

describe('TaskRow', () => {
  describe('rendering', () => {
    it('renders the task title', () => {
      const wrapper = mountRow()
      expect(wrapper.text()).toContain('Reply to accountant')
    })

    it('renders the note when present', () => {
      const wrapper = mountRow({ note: 'They are waiting on the 1099.' })
      expect(wrapper.find('.task-row__note').exists()).toBe(true)
      expect(wrapper.find('.task-row__note').text()).toBe('They are waiting on the 1099.')
    })

    it('omits the note element when absent', () => {
      const wrapper = mountRow({ note: null })
      expect(wrapper.find('.task-row__note').exists()).toBe(false)
    })
  })

  describe('urgency stripe', () => {
    it('applies the urgency modifier class to the row', () => {
      const wrapper = mountRow({ urgency: 'critical' })
      expect(wrapper.find('.task-row--u-critical').exists()).toBe(true)
    })

    it('renders the stripe element', () => {
      const wrapper = mountRow()
      expect(wrapper.find('.task-row__stripe').exists()).toBe(true)
    })

    it('reflects a different urgency', () => {
      const wrapper = mountRow({ urgency: 'low' })
      expect(wrapper.find('.task-row--u-low').exists()).toBe(true)
      expect(wrapper.find('.task-row--u-critical').exists()).toBe(false)
    })
  })

  describe('due badge tiers', () => {
    it('renders an overdue badge with the over tier and a flag icon', () => {
      const wrapper = mountRow({ due: { label: '2 days overdue', daysLeft: -2 } })
      const badge = wrapper.find('.task-row__due')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('task-row__due--over')
      expect(badge.text()).toContain('2 days overdue')
    })

    it('uses the now tier for due today/tomorrow (daysLeft ≤ 1)', () => {
      const wrapper = mountRow({ due: { label: 'Due today', daysLeft: 0 } })
      expect(wrapper.find('.task-row__due--now').exists()).toBe(true)
    })

    it('uses the soon tier for deadlines within a week', () => {
      const wrapper = mountRow({ due: { label: 'May 28', daysLeft: 7 } })
      expect(wrapper.find('.task-row__due--soon').exists()).toBe(true)
    })

    it('uses the neutral base (no tier modifier) for far-future deadlines', () => {
      const wrapper = mountRow({ due: { label: 'Jun 30', daysLeft: 40 } })
      const badge = wrapper.find('.task-row__due')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).not.toContain('task-row__due--over')
      expect(badge.classes()).not.toContain('task-row__due--now')
      expect(badge.classes()).not.toContain('task-row__due--soon')
    })

    it('omits the due badge entirely when the task has no due date', () => {
      const wrapper = mountRow({ due: null, dueDate: null })
      expect(wrapper.find('.task-row__due').exists()).toBe(false)
    })
  })

  describe('category / recurring / project pills', () => {
    it('renders a soft category tag with the human label', () => {
      const wrapper = mountRow({ category: 'studio' })
      expect(wrapper.text()).toContain('Studio')
    })

    it('omits the category tag when category is null', () => {
      const wrapper = mountRow({
        category: null,
        project: null,
        kind: 'once',
        due: null,
        dueDate: null
      })

      // Only the title + checkbox remain — no pills.
      expect(wrapper.find('.pill').exists()).toBe(false)
    })

    it('renders a recurring tag for recurring tasks', () => {
      const wrapper = mountRow({ kind: 'recurring' })
      expect(wrapper.text()).toContain('recurring')
    })

    it('does not render a recurring tag for one-off / deadline tasks', () => {
      const wrapper = mountRow({ kind: 'once' })
      expect(wrapper.text()).not.toContain('recurring')
    })

    it('renders a project link pill with the shortened project name and its route', () => {
      const wrapper = mountRow({ project: { id: 'site', name: 'Portfolio site — redesign (v2)' } })
      const link = wrapper.find('.task-row__project')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Portfolio site')
      expect(link.text()).not.toContain('redesign')
      expect(link.attributes('data-to')).toBe('/projects/site')
    })

    it('omits the project pill when the task has no project', () => {
      const wrapper = mountRow({ project: null })
      expect(wrapper.find('.task-row__project').exists()).toBe(false)
    })
  })

  describe('completion', () => {
    it('renders a checked checkbox when done', () => {
      const wrapper = mountRow({ done: true })
      expect(wrapper.find('.checkbox--checked').exists()).toBe(true)
      expect(wrapper.find('.task-row__title--done').exists()).toBe(true)
    })

    it('renders an unchecked checkbox when not done', () => {
      const wrapper = mountRow({ done: false })
      expect(wrapper.find('.checkbox--unchecked').exists()).toBe(true)
      expect(wrapper.find('.task-row__title--pending').exists()).toBe(true)
    })

    it('emits complete with the task id when the checkbox is toggled', async () => {
      const wrapper = mountRow()
      await wrapper.find('.checkbox').trigger('click')
      expect(wrapper.emitted('complete')).toEqual([['t1']])
    })
  })
})
