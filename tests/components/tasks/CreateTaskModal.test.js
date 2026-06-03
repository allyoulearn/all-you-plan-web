import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'
import { useTasksStore } from '@/stores/tasks.store'
import { useProjectsStore } from '@/stores/projects.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop', 'initialFocusSelector'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" class="app-modal-stub"><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppDatePicker: {
    props: ['modelValue', 'label', 'placeholder', 'clearable'],
    emits: ['update:modelValue'],
    template:
      '<input class="date-picker-stub" :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled', 'icon'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  }
}

function mountModal(props = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  setActivePinia(pinia)
  return mount(CreateTaskModal, {
    props: { modelValue: true, ...props },
    global: { stubs: globalStubs, plugins: [pinia, i18n] }
  })
}

function submitButton(wrapper) {
  return wrapper
    .findAll('button')
    .filter(b => !b.text().includes('Cancel'))
    .at(-1)
}

describe('CreateTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
  })

  it('loads projects on open to populate the dropdown', () => {
    const wrapper = mountModal()
    const projectsStore = useProjectsStore()
    expect(projectsStore.loadProjects).toHaveBeenCalled()
    expect(wrapper.exists()).toBe(true)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when the title is empty', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    await submitButton(wrapper).trigger('click')
    expect(store.createTask).not.toHaveBeenCalled()
  })

  it('creates a task with the title and default urgency/kind', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockResolvedValue({ id: 'x' })
    await wrapper.find('input[data-label="Title"]').setValue('Renew passport')
    await submitButton(wrapper).trigger('click')
    await flushPromises()

    expect(store.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Renew passport', urgency: 'medium', kind: 'once' })
    )
  })

  it('sends category, urgency, and note when provided', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockResolvedValue({ id: 'x' })
    await wrapper.find('input[data-label="Title"]').setValue('Tidy studio')

    const selects = wrapper.findAll('select')
    // selects: [category, urgency, kind, project]
    await selects[0].setValue('studio')
    await selects[1].setValue('high')

    await submitButton(wrapper).trigger('click')
    await flushPromises()

    expect(store.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Tidy studio', category: 'studio', urgency: 'high' })
    )
  })

  it('auto-sets kind to deadline when a due date is picked', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockResolvedValue({ id: 'x' })
    await wrapper.find('input[data-label="Title"]').setValue('Pay invoice')
    await wrapper.find('.date-picker-stub').setValue('2026-06-10')
    await flushPromises()

    await submitButton(wrapper).trigger('click')
    await flushPromises()

    expect(store.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pay invoice', dueDate: '2026-06-10', kind: 'deadline' })
    )
  })

  it('respects an explicit kind choice over the due-date auto-nudge', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockResolvedValue({ id: 'x' })
    await wrapper.find('input[data-label="Title"]').setValue('Recurring thing')

    const selects = wrapper.findAll('select')
    // pick kind = recurring (3rd select), then add a due date
    await selects[2].setValue('recurring')
    await wrapper.find('.date-picker-stub').setValue('2026-06-10')
    await flushPromises()

    await submitButton(wrapper).trigger('click')
    await flushPromises()

    expect(store.createTask).toHaveBeenCalledWith(expect.objectContaining({ kind: 'recurring' }))
  })

  it('closes on a successful create', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockResolvedValue({ id: 'x' })
    await wrapper.find('input[data-label="Title"]').setValue('Thing')
    await submitButton(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
  })

  it('keeps the modal open when createTask rejects', async () => {
    const wrapper = mountModal()
    const store = useTasksStore()
    store.createTask.mockRejectedValue(new Error('failed'))
    await wrapper.find('input[data-label="Title"]').setValue('Thing')
    await submitButton(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('resets the form when reopened', async () => {
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
