import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateGoalModal from '@/components/goals/CreateGoalModal.vue'
import { useGoalsStore } from '@/stores/goals.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template:
      '<div v-if="modelValue" class="app-modal-stub"><slot name="header" /><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :data-placeholder="placeholder" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>'
  },
  AppDatePicker: {
    props: ['modelValue', 'invalid', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<input type="date" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }
}

function mountModal(props = {}) {
  return mount(CreateGoalModal, {
    props: { modelValue: true, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateGoalModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()

    const cancelBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'ghost')

    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when form is invalid', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()
    expect(store.create).not.toHaveBeenCalled()
  })

  it('submit calls store.create with trimmed fields', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockResolvedValue({ id: 'g1' })

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('  Memoir  ')
    await wrapper.find('textarea').setValue('  because it matters  ')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(store.create).toHaveBeenCalledWith({
      title: 'Memoir',
      why: 'because it matters',
      targetDate: '2026-12-31'
    })
  })

  it('closes the modal on successful save', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockResolvedValue({ id: 'g1' })

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    await wrapper.find('textarea').setValue('because')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays open on store rejection', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockRejectedValue(new Error('boom'))

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    await wrapper.find('textarea').setValue('because')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
