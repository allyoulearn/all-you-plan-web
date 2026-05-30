import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DeleteColumnDialog from '@/components/projects/DeleteColumnDialog.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop', 'role'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" class="app-modal-stub"><slot /><slot name="footer" /></div>'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  }
}

function mountDialog(props = {}) {
  return mount(DeleteColumnDialog, {
    props: {
      modelValue: true,
      column: { id: 'col-1', label: 'Backlog' },
      taskCount: 0,
      moveTargets: [],
      ...props
    },
    global: { stubs: globalStubs, plugins: [i18n] }
  })
}

describe('DeleteColumnDialog', () => {
  it('renders empty-column message when taskCount is 0', () => {
    const wrapper = mountDialog({ taskCount: 0 })
    expect(wrapper.find('fieldset').exists()).toBe(false)
  })

  it('renders the radios when taskCount > 0 and move targets exist', () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }]
    })

    expect(wrapper.find('fieldset').exists()).toBe(true)
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(2)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountDialog()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('cancel'))
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('confirm with empty column emits confirm with delete mode', async () => {
    const wrapper = mountDialog({ taskCount: 0 })

    const confirmBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([[{ mode: 'delete', moveToColumnId: null }]])
  })

  it('confirm with move mode emits confirm with moveToColumnId set', async () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }],
      modelValue: false
    })

    await wrapper.setProps({ modelValue: true })

    // Watch fires on open and initializes mode='move', moveTo='col-2'
    const confirmBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([[{ mode: 'move', moveToColumnId: 'col-2' }]])
  })

  it('switching to delete mode emits confirm with no moveTo', async () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }],
      modelValue: false
    })

    await wrapper.setProps({ modelValue: true })
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1].trigger('change')

    const confirmBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([[{ mode: 'delete', moveToColumnId: null }]])
  })

  it('does not emit confirm when saving is true', async () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }],
      saving: true,
      modelValue: false
    })

    await wrapper.setProps({ modelValue: true })

    const confirmBtn = wrapper
      .findAll('button')
      .filter(b => !b.text().toLowerCase().includes('cancel'))
      .at(-1)

    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('falls back to delete mode when no move targets are available', async () => {
    const wrapper = mountDialog({ taskCount: 2, moveTargets: [] })
    // Force re-watch by toggling modelValue.
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    // After watch fires, mode should be 'delete'
    expect(wrapper.vm.mode).toBe('delete')
  })

  it('resets mode/moveTo when reopened with move targets', async () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }]
    })

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.vm.mode).toBe('move')
    expect(wrapper.vm.moveTo).toBe('col-2')
  })

  it('canConfirm is false when in move mode without a moveTo selected', async () => {
    const wrapper = mountDialog({
      taskCount: 3,
      moveTargets: [{ id: 'col-2', label: 'Done' }]
    })

    wrapper.vm.moveTo = ''
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.canConfirm).toBe(false)
  })
})
