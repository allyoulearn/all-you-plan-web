import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import GoalCardMenu from '@/components/goals/GoalCardMenu.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = { AppIcon: true }

function mountMenu() {
  return mount(GoalCardMenu, {
    attachTo: document.body,
    global: { plugins: [i18n], stubs: globalStubs }
  })
}

describe('GoalCardMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a trigger button with the accessible label', () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button[aria-haspopup="menu"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe('Goal actions')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('opens the menu on trigger click', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits "edit" when the Edit item is clicked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const editItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Edit')
    await editItem.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits "remove" when the Remove item is clicked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const removeItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Remove')
    await removeItem.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    wrapper.unmount()
  })

  it('closes the menu after an action is selected', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const editItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Edit')
    await editItem.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
