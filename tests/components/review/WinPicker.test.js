import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import WinPicker from '@/components/review/WinPicker.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = { AppIcon: { template: '<span />' } }

const tasks = [
  { id: 't1', title: 'Mentor call prep', done: true },
  { id: 't2', title: 'Morning walk', done: true },
  { id: 't3', title: 'Weekly update', done: true },
  { id: 't4', title: 'Inbox zero', done: true }
]

function mountPicker(props = {}) {
  return mount(WinPicker, {
    props: { tasks, modelValue: { starred: [], freeText: '' }, ...props },
    global: { plugins: [i18n], stubs }
  })
}

describe('WinPicker', () => {
  it('renders one row per completed task', () => {
    const wrapper = mountPicker()
    expect(wrapper.findAll('.win-picker__row')).toHaveLength(4)
  })

  it('renders the empty state when tasks list is empty', () => {
    const wrapper = mountPicker({ tasks: [] })
    expect(wrapper.text()).toContain('Some days nothing on the list moves')
  })

  it('toggles a star on row click', async () => {
    const wrapper = mountPicker()
    await wrapper.findAll('.win-picker__row')[0].trigger('click')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events.at(-1)[0].starred).toEqual(['t1'])
  })

  it('un-stars when the same row is clicked twice', async () => {
    const wrapper = mountPicker({
      modelValue: { starred: ['t1'], freeText: '' }
    })

    await wrapper.findAll('.win-picker__row')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue').at(-1)[0].starred).toEqual([])
  })

  it('caps starred to 3 by unstarring the oldest when a 4th is added', async () => {
    const wrapper = mountPicker({
      modelValue: { starred: ['t1', 't2', 't3'], freeText: '' }
    })

    await wrapper.findAll('.win-picker__row')[3].trigger('click')
    const out = wrapper.emitted('update:modelValue').at(-1)[0].starred
    expect(out).toHaveLength(3)
    expect(out).not.toContain('t1')
    expect(out).toContain('t4')
  })

  it('emits free-text changes', async () => {
    const wrapper = mountPicker()
    const input = wrapper.find('input, textarea')
    await input.setValue('a win that was not on the list')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.freeText).toBe('a win that was not on the list')
  })
})
