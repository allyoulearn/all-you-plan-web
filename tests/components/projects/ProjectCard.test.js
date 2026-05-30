import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import ProjectCard from '@/components/projects/ProjectCard.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const baseProject = {
  id: 'p1',
  name: 'Write a memoir',
  tag: 'writing',
  status: 'on_track',
  blurb: 'A story worth telling.',
  nudge: null,
  startedOn: '2026-01-01',
  targetOn: '2026-12-31',
  order: 0,
  archived: false,
  progress: { done: 3, total: 10, percent: 30 }
}

const mountCard = (project = baseProject) =>
  mount(ProjectCard, {
    props: { project },
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      plugins: [i18n]
    }
  })

describe('ProjectCard', () => {
  describe('rendering', () => {
    it('renders the project name', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Write a memoir')
    })

    it('renders the project tag', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('writing')
    })

    it('renders the progress percent', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('30%')
    })

    it('renders done/total fraction', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('3 / 10')
    })

    it('renders the blurb when provided', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.project-card__blurb').text()).toBe('A story worth telling.')
    })

    it('does not render the blurb element when blurb is absent', () => {
      const project = { ...baseProject, blurb: null }
      const wrapper = mountCard(project)
      expect(wrapper.find('.project-card__blurb').exists()).toBe(false)
    })
  })

  describe('status label (WEB-T07-017: no raw enum strings)', () => {
    it('renders "On track" for status on_track', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('On track')
      expect(wrapper.text()).not.toContain('on_track')
    })

    it('renders "Hot" for status hot', () => {
      const project = { ...baseProject, status: 'hot' }
      const wrapper = mountCard(project)
      expect(wrapper.text()).toContain('Hot')
    })

    it('renders "Stalled" for status stalled', () => {
      const project = { ...baseProject, status: 'stalled' }
      const wrapper = mountCard(project)
      expect(wrapper.text()).toContain('Stalled')
    })

    it('renders "Idle" for status idle', () => {
      const project = { ...baseProject, status: 'idle' }
      const wrapper = mountCard(project)
      expect(wrapper.text()).toContain('Idle')
    })

    it('falls back to raw value for unknown status', () => {
      const project = { ...baseProject, status: 'archived' }
      const wrapper = mountCard(project)
      expect(wrapper.text()).toContain('archived')
    })
  })

  describe('status pill variant', () => {
    it('applies warn dot tone to status pill when status is hot', () => {
      const project = { ...baseProject, status: 'hot' }
      const wrapper = mountCard(project)
      const pills = wrapper.findAll('span.pill--dot-warn')
      expect(pills.length).toBeGreaterThan(0)
    })

    it('applies good dot tone to status pill when status is on_track', () => {
      const project = { ...baseProject, status: 'on_track' }
      const wrapper = mountCard(project)
      const pills = wrapper.findAll('span.pill--dot-good')
      expect(pills.length).toBeGreaterThan(0)
    })
  })

  describe('nudge', () => {
    it('shows the nudge line when nudge is present', () => {
      const project = { ...baseProject, nudge: 'Needs attention' }
      const wrapper = mountCard(project)
      expect(wrapper.text()).toContain('Needs attention')
      expect(wrapper.find('.project-card__nudge').exists()).toBe(true)
    })

    it('does not render nudge element when nudge is null', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.project-card__nudge').exists()).toBe(false)
    })
  })

  describe('progress guard (WEB-T07-009: null progress)', () => {
    it('renders progress block when progress is present', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.project-card__progress').exists()).toBe(true)
    })

    it('does not crash when progress is null', () => {
      const project = { ...baseProject, progress: null }
      // Must not throw
      expect(() => mountCard(project)).not.toThrow()
    })

    it('hides progress block when progress is null', () => {
      const project = { ...baseProject, progress: null }
      const wrapper = mountCard(project)
      expect(wrapper.find('.project-card__progress').exists()).toBe(false)
    })

    it('hides progress block when progress is undefined', () => {
      const projectWithout = { ...baseProject }
      delete projectWithout.progress
      const wrapper = mountCard(projectWithout)
      expect(wrapper.find('.project-card__progress').exists()).toBe(false)
    })
  })

  describe('routing', () => {
    it('links to the project detail route', () => {
      // Mount with real RouterLink stub that receives the to prop
      const wrapper = mount(ProjectCard, {
        props: { project: baseProject },
        global: {
          stubs: {
            RouterLink: {
              template: '<a :href="to"><slot /></a>',
              props: ['to']
            }
          },
          plugins: [i18n]
        }
      })

      expect(wrapper.find('a').attributes('href')).toBe('/projects/p1')
    })
  })
})
