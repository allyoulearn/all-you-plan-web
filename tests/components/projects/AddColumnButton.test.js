import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AddColumnButton from '@/components/projects/AddColumnButton.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppIcon: true
}

function mountButton(props = {}) {
  return mount(AddColumnButton, {
    props,
    global: { stubs: globalStubs, plugins: [i18n] },
    attachTo: document.body
  })
}

describe('AddColumnButton', () => {
  it('renders the trigger button initially', () => {
    const wrapper = mountButton()
    expect(wrapper.find('.add-column-button__trigger').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('clicking the trigger swaps to the input', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('Escape cancels editing back to the trigger', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('Enter on an empty input cancels editing', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('Enter with text emits create and clears the input', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('input').setValue('Backlog')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('create')).toEqual([['Backlog']])
    // Stays in editing mode for rapid entry
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('trims whitespace before emitting create', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('input').setValue('  Doing  ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('create')).toEqual([['Doing']])
  })

  it('blur with content commits', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('input').setValue('Review')
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('create')).toEqual([['Review']])
  })

  it('blur without content cancels', async () => {
    const wrapper = mountButton()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('input').trigger('blur')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('disables the input while saving is true', async () => {
    const wrapper = mountButton({ saving: true })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
