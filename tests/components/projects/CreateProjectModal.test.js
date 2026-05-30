import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
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
  }
}

function mountModal(props = {}) {
  return mount(CreateProjectModal, {
    props: { modelValue: true, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateProjectModal', () => {
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
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when name is empty', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createProject).not.toHaveBeenCalled()
  })

  it('submit calls store.createProject with trimmed name and emits created', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    const created = { id: 'p1', name: 'New project' }
    store.createProject.mockResolvedValue(created)
    await wrapper.find('input[data-label="Project name"]').setValue('  New project  ')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New project' })
    )

    expect(wrapper.emitted('created')).toEqual([[created]])
    expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
  })

  it('keeps modal open when createProject rejects', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createProject.mockRejectedValue(new Error('save failed'))
    await wrapper.find('input[data-label="Project name"]').setValue('Doomed')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('created')).toBeUndefined()
  })

  it('passes optional tag and blurb when set', async () => {
    const wrapper = mountModal()
    const store = useProjectsStore()
    store.createProject.mockResolvedValue({ id: 'p1' })
    await wrapper.find('input[data-label="Project name"]').setValue('Project')
    await wrapper.find('input[data-label="Tag (optional)"]').setValue('work')
    await wrapper.find('textarea').setValue('a blurb')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createProject).toHaveBeenCalledWith({
      name: 'Project',
      tag: 'work',
      blurb: 'a blurb'
    })
  })

  it('resets form when reopened', async () => {
    const wrapper = mountModal({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    await wrapper.find('input[data-label="Project name"]').setValue('First')
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    expect(wrapper.find('input[data-label="Project name"]').element.value).toBe('')
  })
})
