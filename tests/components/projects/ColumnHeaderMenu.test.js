import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ColumnHeaderMenu from '@/components/projects/ColumnHeaderMenu.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = { AppIcon: true }

function mountMenu() {
  return mount(ColumnHeaderMenu, {
    global: { stubs: globalStubs, plugins: [i18n] },
    attachTo: document.body
  })
}

describe('ColumnHeaderMenu', () => {
  it('renders the trigger with aria-expanded false', () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('clicking the trigger opens the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
  })

  it('rename item emits rename and closes the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    const renameItem = wrapper.findAll('[role="menuitem"]').at(0)
    await renameItem.trigger('click')
    expect(wrapper.emitted('rename')).toHaveLength(1)
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('delete item emits delete and closes the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    const deleteItem = wrapper.findAll('[role="menuitem"]').at(1)
    await deleteItem.trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('Escape closes the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul').exists()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('clicking outside closes the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul').exists()).toBe(true)
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('toggles open/closed on repeated trigger clicks', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul').exists()).toBe(true)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul').exists()).toBe(false)
  })
})
