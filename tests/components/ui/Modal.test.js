import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Modal from '@/components/ui/Modal.vue'

// jsdom does not implement `Teleport` to body well across test interactions;
// disable teleport via @vue/test-utils mount option per test to keep the
// markup queryable inside the wrapper.

// Track mounted wrappers so we can unmount them in afterEach. The Modal uses
// a module-scoped nested-modal counter for the scroll-lock; leaking a mounted
// modal across tests would skew the count and break scroll-lock assertions.
let activeWrapper = null

function mountModal(options) {
  activeWrapper = mount(Modal, options)
  return activeWrapper
}

describe('Modal', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  afterEach(() => {
    if (activeWrapper) {
      activeWrapper.unmount()
      activeWrapper = null
    }
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  describe('rendering', () => {
    it('renders nothing when modelValue is false', () => {
      const wrapper = mountModal({
        props: { modelValue: false, title: 'Hello' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      expect(wrapper.find('.modal').exists()).toBe(false)
    })

    it('renders dialog when modelValue is true', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'Hello' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').exists()).toBe(true)
      expect(wrapper.find('.modal__title').text()).toBe('Hello')
    })

    it('forwards the title via aria-labelledby', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'Confirm thing' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      const labelId = wrapper.find('.modal__title').attributes('id')
      expect(labelId).toBeTruthy()
      expect(wrapper.find('.modal').attributes('aria-labelledby')).toBe(labelId)
    })

    it('renders an accessible name even without title or header (WEB-W2-04)', async () => {
      const wrapper = mountModal({
        props: { modelValue: true },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').attributes('aria-label')).toBe('Dialog')
    })
  })

  describe('close button (WEB-W2-05, WEB-W2-06)', () => {
    it('renders the close button by default when no header exists', async () => {
      const wrapper = mountModal({
        props: { modelValue: true },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal__close').exists()).toBe(true)
    })

    it('hides the close button when showClose is false', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X', showClose: false },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal__close').exists()).toBe(false)
    })

    it('uses the closeLabel prop for aria-label', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X', closeLabel: 'Dismiss' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal__close').attributes('aria-label')).toBe('Dismiss')
    })

    it('emits update:modelValue=false on close click', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      await wrapper.find('.modal__close').trigger('click')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })
  })

  describe('role (WEB-W2-08)', () => {
    it('defaults role to "dialog"', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').attributes('role')).toBe('dialog')
    })

    it('accepts role="alertdialog"', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X', role: 'alertdialog' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').attributes('role')).toBe('alertdialog')
    })
  })

  describe('aria-describedby (WEB-W2-09)', () => {
    it('reflects the ariaDescribedby prop when set', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X', ariaDescribedby: 'desc-1' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').attributes('aria-describedby')).toBe('desc-1')
    })

    it('omits aria-describedby when not set', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(wrapper.find('.modal').attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('body scroll lock (WEB-W2-03)', () => {
    it('locks body overflow when opened', async () => {
      mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when closed', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      await wrapper.setProps({ modelValue: false })
      await flushPromises()
      expect(document.body.style.overflow).toBe('')
    })

    it('does not lock body when never opened', async () => {
      mountModal({
        props: { modelValue: false, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('backdrop close', () => {
    it('emits close when clicking the backdrop (default closeOnBackdrop=true)', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      await wrapper.find('.modal').trigger('click')
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('does not emit close when closeOnBackdrop=false', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X', closeOnBackdrop: false },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      await wrapper.find('.modal').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('keyboard (WEB-W2-07)', () => {
    it('closes on Escape via the document listener', async () => {
      const wrapper = mountModal({
        props: { modelValue: true, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
      await flushPromises()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('does not respond to Escape when the modal is closed', async () => {
      const wrapper = mountModal({
        props: { modelValue: false, title: 'X' },
        global: { stubs: { Teleport: true, Transition: false } }
      })
      await flushPromises()
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
      await flushPromises()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
