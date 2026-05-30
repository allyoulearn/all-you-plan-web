import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

describe('AppConfirmDialog', () => {
  describe('rendering', () => {
    it('renders the message via aria-describedby (WEB-W2-09)', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: true, title: 'Delete?', message: 'This cannot be undone.' },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      const message = wrapper.find('.confirm-dialog__message')
      expect(message.exists()).toBe(true)
      expect(message.text()).toBe('This cannot be undone.')
      const messageId = message.attributes('id')
      expect(messageId).toMatch(/^confirm-dialog-message-/)
      expect(wrapper.find('.modal').attributes('aria-describedby')).toBe(messageId)
    })

    it('forwards role="alertdialog" to AppModal by default (WEB-W2-08)', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: true, title: 'Delete?', message: 'Are you sure?' },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      expect(wrapper.find('.modal').attributes('role')).toBe('alertdialog')
    })

    it('forwards role="dialog" when explicitly opted out', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: true, title: 'Hi', message: 'x', role: 'dialog' },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      expect(wrapper.find('.modal').attributes('role')).toBe('dialog')
    })

    it('uses default labels when not provided', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: true, message: 'x' },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      const buttons = wrapper.findAll('button')
      // Buttons: [close X, Cancel, Confirm]
      const labels = buttons.map(b => b.text()).filter(Boolean)
      expect(labels).toContain('Cancel')
      expect(labels).toContain('Confirm')
    })
  })

  describe('emit behavior', () => {
    it('emits confirm when the confirm button is clicked', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          modelValue: true,
          title: 'X',
          message: 'go?',
          confirmLabel: 'Yes',
          cancelLabel: 'No'
        },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      const confirmBtn = wrapper.findAll('button').find(b => b.text() === 'Yes')
      await confirmBtn.trigger('click')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('emits cancel and update:modelValue=false on cancel click', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          modelValue: true,
          title: 'X',
          message: 'go?',
          confirmLabel: 'Yes',
          cancelLabel: 'No'
        },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'No')
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('disables both buttons while busy is true', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: true, message: 'go?', busy: true },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      // Both Cancel and Confirm buttons should be disabled. (The close X is not.)
      const buttons = wrapper.findAll('button')
      const disabledCount = buttons.filter(b => b.attributes('disabled') !== undefined).length
      expect(disabledCount).toBe(2)
    })

    it('renders busyLabel on the confirm button while busy is true', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          modelValue: true,
          message: 'go?',
          confirmLabel: 'Save',
          busyLabel: 'Saving…',
          busy: true
        },
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await flushPromises()
      expect(wrapper.text()).toContain('Saving…')
      expect(wrapper.text()).not.toContain('Save')
    })
  })

  describe('focus management (WEB-W2-11)', () => {
    it('moves focus to the cancel button on open', async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: { modelValue: false, message: 'go?', cancelLabel: 'No', confirmLabel: 'Yes' },
        attachTo: document.body,
        global: { stubs: { Teleport: true, Transition: false } }
      })

      await wrapper.setProps({ modelValue: true })
      // Need a few ticks for nextTick chains in both AppModal and AppConfirmDialog.
      await flushPromises()
      await flushPromises()
      await flushPromises()

      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'No')
      expect(cancelBtn).toBeDefined()
      expect(document.activeElement).toBe(cancelBtn.element)

      wrapper.unmount()
    })
  })
})
