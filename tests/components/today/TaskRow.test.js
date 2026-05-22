import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskRow from '@/components/today/TaskRow.vue'

describe('TaskRow', () => {
  it('renders the task title and emits complete on check', async () => {
    const task = { id: 't1', title: 'Morning pages', done: false, scheduledTime: '07:30' }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.text()).toContain('Morning pages')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('complete')[0]).toEqual(['t1'])
  })

  it('strikes through a done task', () => {
    const task = { id: 't2', title: 'Done thing', done: true }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__title--done').exists()).toBe(true)
  })

  it('renders pending class when task is not done', () => {
    const task = { id: 't3', title: 'Pending task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__title--pending').exists()).toBe(true)
    expect(wrapper.find('.task-row__title--done').exists()).toBe(false)
  })

  it('renders scheduledTime when provided', () => {
    const task = { id: 't4', title: 'Meeting', done: false, scheduledTime: '09:00' }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__time').exists()).toBe(true)
    expect(wrapper.find('.task-row__time').text()).toBe('09:00')
  })

  it('does not render time element when scheduledTime is absent', () => {
    const task = { id: 't5', title: 'No time task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__time').exists()).toBe(false)
  })

  it('renders note when provided', () => {
    const task = { id: 't6', title: 'Task with note', done: false, note: 'Do this carefully' }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__note').exists()).toBe(true)
    expect(wrapper.find('.task-row__note').text()).toBe('Do this carefully')
  })

  it('does not render note element when note is absent', () => {
    const task = { id: 't7', title: 'No note task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__note').exists()).toBe(false)
  })

  it('renders a Pill with tag text when tag is provided', () => {
    const task = { id: 't8', title: 'Tagged task', done: false, tag: 'Work' }
    const wrapper = mount(TaskRow, { props: { task } })
    // Pill is rendered via the .pill class
    expect(wrapper.find('.pill').exists()).toBe(true)
    expect(wrapper.find('.pill').text()).toBe('Work')
  })

  it('does not render Pill when tag is absent', () => {
    const task = { id: 't9', title: 'No tag task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.pill').exists()).toBe(false)
  })

  it('emits complete event with the correct task id', async () => {
    const task = { id: 'abc-123', title: 'My task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('complete')).toBeDefined()
    expect(wrapper.emitted('complete')[0]).toEqual(['abc-123'])
  })

  it('renders the task-row container class', () => {
    const task = { id: 't10', title: 'Test', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row').exists()).toBe(true)
  })

  it('renders the task body container', () => {
    const task = { id: 't11', title: 'Test', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.task-row__body').exists()).toBe(true)
  })

  it('checkbox reflects done=true', () => {
    const task = { id: 't12', title: 'Done task', done: true }
    const wrapper = mount(TaskRow, { props: { task } })
    // Checkbox renders with checkbox--checked class when modelValue is true
    expect(wrapper.find('.checkbox--checked').exists()).toBe(true)
  })

  it('checkbox reflects done=false', () => {
    const task = { id: 't13', title: 'Pending task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.find('.checkbox--unchecked').exists()).toBe(true)
  })

  it('all optional fields absent — renders only title and checkbox', () => {
    const task = { id: 't14', title: 'Minimal task', done: false }
    const wrapper = mount(TaskRow, { props: { task } })
    expect(wrapper.text()).toContain('Minimal task')
    expect(wrapper.find('.task-row__time').exists()).toBe(false)
    expect(wrapper.find('.task-row__note').exists()).toBe(false)
    expect(wrapper.find('.pill').exists()).toBe(false)
  })
})
