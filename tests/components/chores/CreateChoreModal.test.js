import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateChoreModal from '@/components/chores/CreateChoreModal.vue'
import { useChoresStore } from '@/stores/chores.store'
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
  },
  AppSegmentedControl: {
    props: ['modelValue', 'options', 'groupLabel'],
    emits: ['update:modelValue'],
    template:
      '<div><button v-for="o in options" :key="o.value" type="button" :data-value="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  }
}

function mountModal(props = {}) {
  return mount(CreateChoreModal, {
    props: { modelValue: true, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateChoreModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
  })

  it('starts with daily cadence', async () => {
    const wrapper = mountModal()
    // daily branch shows the "Every N days" interval field
    expect(wrapper.find('input[data-label="Every (days)"]').exists()).toBe(true)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when title is empty', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createChore).not.toHaveBeenCalled()
  })

  it('submit creates a daily chore with title and interval', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    store.createChore.mockResolvedValue(undefined)
    await wrapper.find('input[data-label="Title"]').setValue('Walk the dog')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createChore).toHaveBeenCalledWith({
      title: 'Walk the dog',
      cadence: expect.objectContaining({ type: 'daily', interval: 1 })
    })
  })

  it('switches cadence to weekly and submits with daysOfWeek', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    store.createChore.mockResolvedValue(undefined)
    await wrapper.find('input[data-label="Title"]').setValue('Yoga')
    await wrapper.find('button[data-value="weekly"]').trigger('click')
    await flushPromises()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createChore).toHaveBeenCalledWith({
      title: 'Yoga',
      cadence: expect.objectContaining({ type: 'weekly' })
    })
  })

  it('switches to monthly and includes dayOfMonth', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    store.createChore.mockResolvedValue(undefined)
    await wrapper.find('input[data-label="Title"]').setValue('Bill payment')
    await wrapper.find('button[data-value="monthly"]').trigger('click')
    await flushPromises()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(store.createChore).toHaveBeenCalledWith({
      title: 'Bill payment',
      cadence: expect.objectContaining({ type: 'monthly', dayOfMonth: 1 })
    })
  })

  it('weekly with zero days selected is invalid and blocks submit', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    await wrapper.find('input[data-label="Title"]').setValue('Yoga')
    await wrapper.find('button[data-value="weekly"]').trigger('click')
    await flushPromises()
    // Click each day-of-week button (5 are active by default) to clear them all
    const dowBtns = wrapper.findAll('button.chore-form__dow-btn--active')
    for (const btn of dowBtns) await btn.trigger('click')
    await flushPromises()

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    expect(store.createChore).not.toHaveBeenCalled()
  })

  it('weekly toggling re-adds a deselected day', async () => {
    const wrapper = mountModal()
    await wrapper.find('input[data-label="Title"]').setValue('Yoga')
    await wrapper.find('button[data-value="weekly"]').trigger('click')
    await flushPromises()
    // Click Sunday (idx 0, not initially active) to add it
    const sunBtn = wrapper.findAll('button.chore-form__dow-btn')[0]
    await sunBtn.trigger('click')
    expect(sunBtn.classes()).toContain('chore-form__dow-btn--active')
    // Click again to remove
    await sunBtn.trigger('click')
    expect(sunBtn.classes()).not.toContain('chore-form__dow-btn--active')
  })

  it('keeps modal open if createChore rejects', async () => {
    const wrapper = mountModal()
    const store = useChoresStore()
    store.createChore.mockRejectedValue(new Error('failed'))
    await wrapper.find('input[data-label="Title"]').setValue('Walk')

    const submitBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().includes('Cancel'))
      .at(-1)

    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('resets when reopened', async () => {
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
