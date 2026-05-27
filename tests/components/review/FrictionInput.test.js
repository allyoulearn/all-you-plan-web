import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FrictionInput from '@/components/review/FrictionInput.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountInput(props = {}) {
  return mount(FrictionInput, {
    props: { modelValue: { text: '', tags: [] }, ...props },
    global: { plugins: [i18n] }
  })
}

describe('FrictionInput', () => {
  it('renders the textarea and chip row', () => {
    const wrapper = mountInput()
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.findAll('.friction-input__chip')).toHaveLength(5)
  })

  it('emits update:modelValue with new text', async () => {
    const wrapper = mountInput()
    await wrapper.find('textarea').setValue('meetings ate the afternoon')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.text).toBe('meetings ate the afternoon')
    expect(ev.tags).toEqual([])
  })

  it('toggles a chip into tags', async () => {
    const wrapper = mountInput()
    await wrapper.findAll('.friction-input__chip')[0].trigger('click')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.tags).toContain('meetings')
  })

  it('removes a chip when toggled off', async () => {
    const wrapper = mountInput({ modelValue: { text: '', tags: ['meetings'] } })
    await wrapper.findAll('.friction-input__chip')[0].trigger('click')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.tags).not.toContain('meetings')
  })

  it('marks active chips with a pressed state', () => {
    const wrapper = mountInput({ modelValue: { text: '', tags: ['energy'] } })
    const chips = wrapper.findAll('.friction-input__chip')
    const energyChip = chips.find(c => c.text().toLowerCase().includes('energy'))
    expect(energyChip.attributes('aria-pressed')).toBe('true')
  })

  it('shows the counter when text length is at least 800 chars', async () => {
    const wrapper = mountInput({ modelValue: { text: 'x'.repeat(801), tags: [] } })
    expect(wrapper.find('.friction-input__counter').exists()).toBe(true)
  })

  it('hides the counter for short text', () => {
    const wrapper = mountInput({ modelValue: { text: 'short', tags: [] } })
    expect(wrapper.find('.friction-input__counter').exists()).toBe(false)
  })
})
