import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectCard from './ProjectCard.vue'

const baseProject = {
  id: 'p1',
  name: 'Write a memoir',
  tag: 'writing',
  status: 'active',
  blurb: 'A story worth telling.',
  nudge: null,
  startedOn: '2026-01-01',
  targetOn: '2026-12-31',
  order: 0,
  archived: false,
  progress: { done: 3, total: 10, percent: 30 },
}

const mountCard = (project = baseProject) =>
  mount(ProjectCard, {
    props: { project },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })

describe('ProjectCard', () => {
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

  it('applies accent variant to status pill when status is hot', () => {
    const project = { ...baseProject, status: 'hot' }
    const wrapper = mountCard(project)
    const pills = wrapper.findAll('span.bg-accent')
    expect(pills.length).toBeGreaterThan(0)
  })

  it('shows the nudge line with flag icon when nudge is present', () => {
    const project = { ...baseProject, nudge: 'Needs attention' }
    const wrapper = mountCard(project)
    expect(wrapper.text()).toContain('Needs attention')
  })
})
