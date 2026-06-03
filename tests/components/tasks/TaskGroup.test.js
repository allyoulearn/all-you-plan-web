import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import TaskGroup from '@/components/tasks/TaskGroup.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// RouterLink (used deep inside TaskRow) is stubbed to a plain anchor.
const globalConfig = {
  plugins: [i18n],
  stubs: {
    RouterLink: { props: ['to'], template: '<a><slot /></a>' }
  }
}

function makeTask(id, overrides = {}) {
  return {
    id,
    title: `Task ${id}`,
    note: null,
    urgency: 'high',
    category: 'admin',
    kind: 'once',
    dueDate: null,
    due: null,
    done: false,
    tag: null,
    project: null,
    ...overrides
  }
}

const urgencyGroup = {
  key: 'critical',
  label: 'Critical',
  urgency: 'critical',
  count: 2,
  tasks: [makeTask('a', { urgency: 'critical' }), makeTask('b', { urgency: 'critical' })]
}

function mountGroup(group = urgencyGroup) {
  return mount(TaskGroup, { props: { group }, global: globalConfig })
}

describe('TaskGroup', () => {
  it('renders the group label and bracketed count', () => {
    const wrapper = mountGroup()
    expect(wrapper.find('.task-group__label').text()).toBe('Critical')
    expect(wrapper.find('.task-group__count').text()).toBe('[2]')
  })

  it('renders an urgency dot with the urgency modifier when grouping by urgency', () => {
    const wrapper = mountGroup()
    expect(wrapper.find('.task-group__dot').exists()).toBe(true)
    expect(wrapper.find('.task-group__header--u-critical').exists()).toBe(true)
  })

  it('omits the urgency dot when the group has no urgency (category/due modes)', () => {
    const wrapper = mountGroup({
      key: 'dated',
      label: 'With a deadline',
      count: 1,
      tasks: [makeTask('c')]
    })

    expect(wrapper.find('.task-group__dot').exists()).toBe(false)
  })

  it('renders one TaskRow per task', () => {
    const wrapper = mountGroup()
    expect(wrapper.findAll('.task-row')).toHaveLength(2)
  })

  it('forwards a row complete event upward with the task id', async () => {
    const wrapper = mountGroup()
    await wrapper.findAll('.checkbox')[1].trigger('click')
    expect(wrapper.emitted('complete')).toEqual([['b']])
  })
})
