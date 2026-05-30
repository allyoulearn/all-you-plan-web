import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RenameColumnModal from '@/components/projects/RenameColumnModal.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template:
      '<div v-if="modelValue" class="app-modal-stub" data-title="">{{ title }}<slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'invalid'],
    emits: ['update:modelValue'],
    template:
      '<label><span>{{ label }}</span><input :value="modelValue" :data-invalid="invalid" @input="$emit(\'update:modelValue\', $event.target.value)" /></label>'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  }
}

function mountModal(props = {}) {
  return mount(RenameColumnModal, {
    props: { modelValue: true, initialLabel: 'Backlog', ...props },
    global: { stubs: globalStubs, plugins: [i18n] }
  })
}

describe('RenameColumnModal', () => {
  it('renders the modal with the initial label prefilled', () => {
    const wrapper = mountModal()
    const input = wrapper.find('input')
    expect(input.element.value).toBe('Backlog')
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('clicking save emits submit with the trimmed label', async () => {
    const wrapper = mountModal()
    await wrapper.find('input').setValue('  Inbox  ')
    const saveBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('save'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['Inbox']])
  })

  it('does not emit submit when the label is empty', async () => {
    const wrapper = mountModal()
    await wrapper.find('input').setValue('   ')
    const saveBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('save'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('does not emit submit when saving prop is true', async () => {
    const wrapper = mountModal({ saving: true })
    await wrapper.find('input').setValue('Inbox')
    const saveBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('loading'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('resets label to initialLabel when reopened', async () => {
    const wrapper = mountModal({ modelValue: false })
    await wrapper.setProps({ modelValue: true, initialLabel: 'Doing' })
    expect(wrapper.find('input').element.value).toBe('Doing')
  })

  it('submit via the form fires the submit event', async () => {
    const wrapper = mountModal()
    await wrapper.find('input').setValue('Renamed')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['Renamed']])
  })

  it('disabled save button when label is empty', async () => {
    const wrapper = mountModal({ initialLabel: '' })
    const saveBtn = wrapper.findAll('button').at(-1)
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })
})
