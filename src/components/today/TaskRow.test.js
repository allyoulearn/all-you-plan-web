import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskRow from './TaskRow.vue'

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
    expect(wrapper.find('.line-through').exists()).toBe(true)
  })
})
