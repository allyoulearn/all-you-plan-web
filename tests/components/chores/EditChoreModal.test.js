import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import EditChoreModal from '@/components/chores/EditChoreModal.vue'
import { useChoresStore } from '@/stores/chores.store'

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
      '<button type="button" :disabled="disabled" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>'
  },
  AppSegmentedControl: {
    props: ['modelValue', 'options', 'groupLabel'],
    emits: ['update:modelValue'],
    template:
      '<div><button v-for="o in options" :key="o.value" type="button" :data-value="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  }
}

const choreFixture = {
  id: 'c1',
  title: 'Meditate',
  cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: null },
  active: true
}

function mountModal(props = {}) {
  return mount(EditChoreModal, {
    props: { modelValue: true, chore: choreFixture, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('EditChoreModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('initialises form fields from the chore prop', () => {
    const wrapper = mountModal()
    expect(wrapper.find('input[data-label="Title"]').element.value).toBe('Meditate')
  })

  it('calls store.updateChore on save with current values', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    store.updateChore.mockResolvedValue({})
    const saveBtn = wrapper
      .findAll('button')
      .filter(b => b.attributes('data-variant') === 'primary')
      .at(-1)
    await saveBtn.trigger('click')
    await flushPromises()
    expect(store.updateChore).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ title: 'Meditate' })
    )
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
