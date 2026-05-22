import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanCard from '@/components/projects/KanbanCard.vue'

const baseTask = { id: 't1', title: 'Fix the bug', done: false, tag: null }

describe('KanbanCard', () => {
  describe('rendering', () => {
    it('renders the task title', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.text()).toContain('Fix the bug')
    })

    it('has a kanban-card__footer', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__footer').exists()).toBe(true)
    })

    it('has a kanban-card__title element', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__title').exists()).toBe(true)
    })
  })

  describe('done/pending state', () => {
    it('applies line-through styling when task is done', () => {
      const doneTask = { ...baseTask, done: true }
      const wrapper = mount(KanbanCard, {
        props: { task: doneTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__title--done').exists()).toBe(true)
    })

    it('does not apply line-through when task is not done', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__title--done').exists()).toBe(false)
    })

    it('applies pending class when task is not done', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__title--pending').exists()).toBe(true)
    })

    it('does not apply pending class when task is done', () => {
      const doneTask = { ...baseTask, done: true }
      const wrapper = mount(KanbanCard, {
        props: { task: doneTask },
        global: { stubs: { Checkbox: true, Pill: true } }
      })
      expect(wrapper.find('.kanban-card__title--pending').exists()).toBe(false)
    })

    it('checkbox receives done as modelValue', () => {
      const doneTask = { ...baseTask, done: true }
      const wrapper = mount(KanbanCard, {
        props: { task: doneTask },
        global: {
          stubs: {
            Checkbox: {
              template: '<div class="checkbox-stub" :data-checked="modelValue" />',
              props: ['modelValue']
            },
            Pill: true
          }
        }
      })
      expect(wrapper.find('.checkbox-stub').attributes('data-checked')).toBe('true')
    })

    it('checkbox receives false modelValue when task not done', () => {
      const wrapper = mount(KanbanCard, {
        props: { task: baseTask },
        global: {
          stubs: {
            Checkbox: {
              template: '<div class="checkbox-stub" :data-checked="modelValue" />',
              props: ['modelValue']
            },
            Pill: true
          }
        }
      })
      expect(wrapper.find('.checkbox-stub').attributes('data-checked')).toBe('false')
    })
  })

  describe('emits', () => {
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

    it('emits "complete" with the correct id for a different task', async () => {
      const task = { ...baseTask, id: 'task-99' }
      const wrapper = mount(KanbanCard, {
        props: { task },
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
      expect(wrapper.emitted('complete')?.[0]).toEqual(['task-99'])
    })
  })

  describe('tag pill', () => {
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

    it('does not render a Pill when tag is empty string', () => {
      const task = { ...baseTask, tag: '' }
      const wrapper = mount(KanbanCard, {
        props: { task },
        global: {
          stubs: {
            Checkbox: true,
            Pill: { template: '<span class="pill"><slot/></span>' }
          }
        }
      })
      // v-if="task.tag" treats empty string as falsy
      expect(wrapper.find('.pill').exists()).toBe(false)
    })
  })
})
