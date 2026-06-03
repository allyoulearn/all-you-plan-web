import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import CategoryFilter from '@/components/tasks/CategoryFilter.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const globalConfig = { plugins: [i18n] }

const categories = [
  { id: 'admin', label: 'Admin', count: 3 },
  { id: 'music', label: 'Music', count: 2 },
  { id: 'studio', label: 'Studio', count: 1 }
]

function mountFilter(props = {}) {
  return mount(CategoryFilter, {
    props: { modelValue: null, categories, ...props },
    global: globalConfig
  })
}

describe('CategoryFilter', () => {
  it('renders an All chip plus one per category', () => {
    const wrapper = mountFilter()
    // All + 3 categories
    expect(wrapper.findAll('.category-filter__chip')).toHaveLength(4)
    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('Music')
    expect(wrapper.text()).toContain('Studio')
  })

  it('computes the All count as the sum of category counts', () => {
    const wrapper = mountFilter()
    const allChip = wrapper.findAll('.category-filter__chip')[0]
    expect(allChip.find('.category-filter__count').text()).toBe('6')
  })

  it('renders each category mono count', () => {
    const wrapper = mountFilter()
    const counts = wrapper.findAll('.category-filter__count').map(c => c.text())
    expect(counts).toEqual(['6', '3', '2', '1'])
  })

  it('marks All active when modelValue is null', () => {
    const wrapper = mountFilter({ modelValue: null })
    const allChip = wrapper.findAll('.category-filter__chip')[0]
    expect(allChip.classes()).toContain('category-filter__chip--active')
  })

  it('marks the matching category chip active', () => {
    const wrapper = mountFilter({ modelValue: 'music' })
    const chips = wrapper.findAll('.category-filter__chip')
    // music is the 3rd chip (All, admin, music)
    expect(chips[2].classes()).toContain('category-filter__chip--active')
    expect(chips[0].classes()).not.toContain('category-filter__chip--active')
  })

  it('emits null when All is clicked', async () => {
    const wrapper = mountFilter({ modelValue: 'admin' })
    await wrapper.findAll('.category-filter__chip')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('emits the category id when a category chip is clicked', async () => {
    const wrapper = mountFilter()
    await wrapper.findAll('.category-filter__chip')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['admin']])
  })

  it('renders only the All chip when there are no categories', () => {
    const wrapper = mountFilter({ categories: [] })
    expect(wrapper.findAll('.category-filter__chip')).toHaveLength(1)

    expect(
      wrapper.findAll('.category-filter__chip')[0].find('.category-filter__count').text()
    ).toBe('0')
  })
})
