import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TomorrowIntent from '@/components/review/TomorrowIntent.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountIntent(props = {}) {
  return mount(TomorrowIntent, {
    props: { modelValue: '', ...props },
    global: { plugins: [i18n] }
  })
}

describe('TomorrowIntent', () => {
  it('renders an input with the current value', () => {
    const wrapper = mountIntent({ modelValue: 'finish the blog draft' })
    expect(wrapper.find('input').element.value).toBe('finish the blog draft')
  })

  it('emits raw update:modelValue on input (no trimming during typing)', async () => {
    const wrapper = mountIntent()
    await wrapper.find('input').setValue('  ship the demo  ')
    // Trailing/leading whitespace is preserved during typing so the input
    // does not snap back as the user types; ReviewView trims before save.
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('  ship the demo  ')
  })

  it('hides the counter when value is short', () => {
    const wrapper = mountIntent({ modelValue: 'short' })
    expect(wrapper.find('.tomorrow-intent__counter').exists()).toBe(false)
  })

  it('shows the counter when value length is >= 60', () => {
    const wrapper = mountIntent({ modelValue: 'x'.repeat(61) })
    expect(wrapper.find('.tomorrow-intent__counter').exists()).toBe(true)
  })
})
