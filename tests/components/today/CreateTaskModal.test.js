import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateTaskModal from '@/components/today/CreateTaskModal.vue'
import { useTodayStore } from '@/stores/today.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" class="app-modal-stub"><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  }
}

function mountModal(props = {}) {
  return mount(CreateTaskModal, {
    props: { modelValue: true, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateTaskModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('renders the title and form fields when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(4)
  })

  it('does not render fields when closed', () => {
    const wrapper = mountModal({ modelValue: false })
    expect(wrapper.find('.app-modal-stub').exists()).toBe(false)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when title is empty', async () => {
    const wrapper = mountModal()
    const store = useTodayStore()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createTask).not.toHaveBeenCalled()
  })

  it('submit calls store.createTask with trimmed title', async () => {
    const wrapper = mountModal()
    const store = useTodayStore()
    store.createTask.mockResolvedValue(undefined)
    const titleInput = wrapper.find('input[data-label="Title"]')
    await titleInput.setValue('  Buy milk  ')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(store.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Buy milk' }))
  })

  it('submit closes modal on success', async () => {
    const wrapper = mountModal()
    const store = useTodayStore()
    store.createTask.mockResolvedValue(undefined)
    await wrapper.find('input[data-label="Title"]').setValue('Task')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
  })

  it('rejects effort values below 1', async () => {
    const wrapper = mountModal()
    const store = useTodayStore()
    const titleInput = wrapper.find('input[data-label="Title"]')
    await titleInput.setValue('Task')
    const effortInput = wrapper.find('input[data-label="Effort (min)"]')
    await effortInput.setValue('0')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createTask).not.toHaveBeenCalled()
  })

  it('keeps modal open when store.createTask rejects', async () => {
    const wrapper = mountModal()
    const store = useTodayStore()
    store.createTask.mockRejectedValue(new Error('save failed'))
    await wrapper.find('input[data-label="Title"]').setValue('Task')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('resets all fields when reopened', async () => {
    const wrapper = mountModal({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    await wrapper.find('input[data-label="Title"]').setValue('First')
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    expect(wrapper.find('input[data-label="Title"]').element.value).toBe('')
  })
})
