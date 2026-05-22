import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'

function mountScreen(props = {}) {
  return mount(PlaceholderScreen, {
    props,
    global: {
      stubs: {
        ScreenHeading: {
          template:
            '<div class="screen-heading-stub" :data-eyebrow="eyebrow" :data-title="title" :data-emphasis="emphasis"><slot /></div>',
          props: ['eyebrow', 'title', 'emphasis']
        },
        Card: { template: '<div class="card-stub"><slot /></div>' }
      }
    }
  })
}

describe('PlaceholderScreen', () => {
  describe('props and rendering', () => {
    it('renders without crashing with default props', () => {
      const wrapper = mountScreen()
      expect(wrapper.exists()).toBe(true)
    })

    it('passes eyebrow prop to ScreenHeading', () => {
      const wrapper = mountScreen({ eyebrow: 'System', title: 'Stats' })
      expect(wrapper.find('.screen-heading-stub').attributes('data-eyebrow')).toBe('System')
    })

    it('passes title prop to ScreenHeading', () => {
      const wrapper = mountScreen({ title: 'Calendar' })
      expect(wrapper.find('.screen-heading-stub').attributes('data-title')).toBe('Calendar')
    })

    it('passes emphasis prop to ScreenHeading', () => {
      const wrapper = mountScreen({ title: 'Today', emphasis: 'plan' })
      expect(wrapper.find('.screen-heading-stub').attributes('data-emphasis')).toBe('plan')
    })

    it('renders the note text inside the card', () => {
      const wrapper = mountScreen({ note: 'This feature is coming soon.' })
      expect(wrapper.find('.card-stub').text()).toBe('This feature is coming soon.')
    })

    it('renders empty note when note prop is not provided', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.card-stub').text()).toBe('')
    })

    it('renders the note with correct class', () => {
      const wrapper = mountScreen({ note: 'Some note text' })
      expect(wrapper.find('.placeholder-screen__note').exists()).toBe(true)
    })

    it('renders note text via placeholder-screen__note class', () => {
      const wrapper = mountScreen({ note: 'Work in progress' })
      expect(wrapper.find('.placeholder-screen__note').text()).toBe('Work in progress')
    })
  })

  describe('prop defaults', () => {
    it('eyebrow defaults to empty string', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.screen-heading-stub').attributes('data-eyebrow')).toBe('')
    })

    it('title defaults to empty string', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.screen-heading-stub').attributes('data-title')).toBe('')
    })

    it('emphasis defaults to empty string', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.screen-heading-stub').attributes('data-emphasis')).toBe('')
    })

    it('note defaults to empty string', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.placeholder-screen__note').text()).toBe('')
    })
  })

  describe('structure', () => {
    it('renders ScreenHeading', () => {
      const wrapper = mountScreen({ title: 'Test' })
      expect(wrapper.find('.screen-heading-stub').exists()).toBe(true)
    })

    it('renders a Card wrapping the note', () => {
      const wrapper = mountScreen({ note: 'placeholder note' })
      expect(wrapper.find('.card-stub').exists()).toBe(true)
    })

    it('renders note inside the Card', () => {
      const wrapper = mountScreen({ note: 'inside card' })
      const card = wrapper.find('.card-stub')
      expect(card.find('.placeholder-screen__note').exists()).toBe(true)
    })

    it('has ScreenHeading before Card in DOM order', () => {
      const wrapper = mountScreen({ title: 'Test', note: 'note' })
      const children = wrapper.element.children
      expect(children[0].classList.contains('screen-heading-stub')).toBe(true)
      expect(children[1].classList.contains('card-stub')).toBe(true)
    })
  })

  describe('all props together', () => {
    it('renders all props correctly together', () => {
      const wrapper = mountScreen({
        eyebrow: 'Looking back',
        title: 'Your',
        emphasis: 'stats',
        note: 'Stats coming soon.'
      })
      const heading = wrapper.find('.screen-heading-stub')
      expect(heading.attributes('data-eyebrow')).toBe('Looking back')
      expect(heading.attributes('data-title')).toBe('Your')
      expect(heading.attributes('data-emphasis')).toBe('stats')
      expect(wrapper.find('.placeholder-screen__note').text()).toBe('Stats coming soon.')
    })
  })
})
