import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanCard from '@/components/projects/KanbanCard.vue'

const baseTask = { id: 't1', title: 'Fix the bug', done: false, tag: null }

describe('KanbanCard', () => {
  it('renders the task title', () => {
    const wrapper = mount(KanbanCard, {
      props: { task: baseTask },
      global: { stubs: { Checkbox: true, Pill: true } }
    })
    expect(wrapper.text()).toContain('Fix the bug')
  })

  it('applies line-through styling when task is done', () => {
    const doneTask = { ...baseTask, done: true }
    const wrapper = mount(KanbanCard, {
      props: { task: doneTask },
      global: { stubs: { Checkbox: true, Pill: true } }
    })
    expect(wrapper.find('.line-through').exists()).toBe(true)
  })

  it('does not apply line-through when task is not done', () => {
    const wrapper = mount(KanbanCard, {
      props: { task: baseTask },
      global: { stubs: { Checkbox: true, Pill: true } }
    })
    expect(wrapper.find('.line-through').exists()).toBe(false)
  })

  it('emits "complete" with the task id when checkbox fires update:modelValue', async () => {
    const wrapper = mount(KanbanCard, {
      props: { task: baseTask },
      global: {
        stubs: {
          Checkbox: {
            template: '<button @click="$emit(\'update:modelValue\', true)" />',
            emits: ['update:modelValue']
          },
          Pill: true
        }
      }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('complete')?.[0]).toEqual(['t1'])
  })

  it('renders a Pill when task has a tag', () => {
    const taggedTask = { ...baseTask, tag: 'design' }
    const wrapper = mount(KanbanCard, {
      props: { task: taggedTask },
      global: {
        stubs: {
          Checkbox: true,
          Pill: { template: '<span class="pill"><slot/></span>' }
        }
      }
    })
    expect(wrapper.find('.pill').exists()).toBe(true)
    expect(wrapper.text()).toContain('design')
  })

  it('does not render a Pill when task has no tag', () => {
    const wrapper = mount(KanbanCard, {
      props: { task: baseTask },
      global: {
        stubs: {
          Checkbox: true,
          Pill: { template: '<span class="pill"><slot/></span>' }
        }
      }
    })
    expect(wrapper.find('.pill').exists()).toBe(false)
  })
})
