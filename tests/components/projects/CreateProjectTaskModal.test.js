import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateProjectTaskModal from '@/components/projects/CreateProjectTaskModal.vue'
import { useProjectsStore } from '@/stores/projects.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" class="app-modal-stub"><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  },
  AppSegmentedControl: {
    props: ['modelValue', 'options', 'groupLabel'],
    emits: ['update:modelValue'],
    template:
      '<div class="seg-stub"><button v-for="o in options" :key="o.value" :data-value="o.value" type="button" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  }
}

function mountModal(props = {}) {
  return mount(CreateProjectTaskModal, {
    props: { modelValue: true, projectId: 'p1', ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateProjectTaskModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('renders when modelValue is true', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
  })

  it('does not render when modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false })
    expect(wrapper.find('.app-modal-stub').exists()).toBe(false)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when title is empty', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createTask).not.toHaveBeenCalled()
  })

  it('submit calls store.createTask with the trimmed title and projectId', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createTask.mockResolvedValue({ id: 't1' })
    await wrapper.find('input[data-label="Title"]').setValue('  Plan trip  ')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Plan trip', projectId: 'p1' })
    )

    expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
  })

  it('keeps modal open when createTask rejects', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createTask.mockRejectedValue(new Error('save failed'))
    await wrapper.find('input[data-label="Title"]').setValue('Doomed')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('passes the trimmed tag when provided', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createTask.mockResolvedValue({ id: 't1' })
    await wrapper.find('input[data-label="Title"]').setValue('Task')
    await wrapper.find('input[data-label="Tag (optional)"]').setValue('  urgent  ')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(store.createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 'urgent' }))
  })

  it('passes undefined for empty tag', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createTask.mockResolvedValue({ id: 't1' })
    await wrapper.find('input[data-label="Title"]').setValue('Task')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    const call = store.createTask.mock.calls[0][0]
    expect(call.tag).toBeUndefined()
  })

  it('resets form on reopen', async () => {
    const wrapper = mountModal()
    await wrapper.find('input[data-label="Title"]').setValue('First')
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('input[data-label="Title"]').element.value).toBe('')
  })

  it('column is forwarded to createTask', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createTask.mockResolvedValue({ id: 't1' })
    await wrapper.find('input[data-label="Title"]').setValue('Task')
    // Click the second segmented option to change column to this_week
    const segButtons = wrapper.findAll('.seg-stub button')
    await segButtons[1].trigger('click')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(store.createTask).toHaveBeenCalledWith(expect.objectContaining({ column: 'this_week' }))
  })
})
