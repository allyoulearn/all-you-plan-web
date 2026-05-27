import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SendoffCard from '@/components/review/SendoffCard.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = {
  WrenTurn: {
    template: '<div class="wren-turn"><p class="prompt">{{ prompt }}</p><slot /></div>',
    props: ['prompt', 'callout']
  },
  AppButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled'],
    emits: ['click']
  }
}

function mountCard(props = {}) {
  return mount(SendoffCard, {
    props: {
      input: {
        mood: 'steady',
        doneCount: 3,
        totalCount: 5,
        streak: 1,
        topWinTitle: '',
        tomorrowIntent: '',
        frictionTagCount: 0
      },
      saving: false,
      disabled: false,
      saved: false,
      ...props
    },
    global: { plugins: [i18n], stubs }
  })
}

describe('SendoffCard', () => {
  it('renders the composed headline and body', () => {
    const wrapper = mountCard()
    expect(wrapper.find('.prompt').text().toLowerCase()).toContain('solid')
  })

  it('renders Finish button when not saved', () => {
    const wrapper = mountCard()
    expect(wrapper.find('button').text().toLowerCase()).toContain('finish')
  })

  it('shows Saving label when saving', () => {
    const wrapper = mountCard({ saving: true })
    expect(wrapper.text()).toContain('Saving')
  })

  it('disables Finish when disabled prop is true', () => {
    const wrapper = mountCard({ disabled: true })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('emits finish when clicked', async () => {
    const wrapper = mountCard()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('shows the saved state with an Edit button when saved is true', () => {
    const wrapper = mountCard({ saved: true })
    expect(wrapper.text()).toContain('Review saved')
    expect(wrapper.text()).toContain('Edit')
  })

  it('emits edit when the Edit button is clicked in saved state', async () => {
    const wrapper = mountCard({ saved: true })
    const editBtn = wrapper.findAll('button').find(b => b.text().includes('Edit'))
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})
