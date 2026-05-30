import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import EditGoalModal from '@/components/goals/EditGoalModal.vue'
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

const goalFixture = {
  id: 'g1',
  title: 'Memoir',
  why: 'because writers write',
  targetDate: '2026-12-31'
}

function mountModal(props = {}) {
  return mount(EditGoalModal, {
    props: { modelValue: true, goal: goalFixture, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('EditGoalModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('seeds the form from the goal prop', () => {
    const wrapper = mountModal()

    expect(wrapper.find('input[data-placeholder="A short, vivid name…"]').element.value).toBe(
      'Memoir'
    )

    expect(wrapper.find('textarea').element.value).toBe('because writers write')
    expect(wrapper.find('input[type="date"]').element.value).toBe('2026-12-31')
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()

    const cancelBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'ghost')

    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('save calls store.update with the goal id and current fields', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockResolvedValue({})

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir v2')

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(store.update).toHaveBeenCalledWith('g1', {
      title: 'Memoir v2',
      why: 'because writers write',
      targetDate: '2026-12-31'
    })
  })

  it('closes on successful save', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockResolvedValue({})

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays open on store rejection', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockRejectedValue(new Error('boom'))

    const saveBtn = wrapper.findAll('button').find(b => b.attributes('data-variant') === 'primary')

    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
