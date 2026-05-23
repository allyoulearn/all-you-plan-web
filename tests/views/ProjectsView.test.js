import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProjectsView from '@/views/ProjectsView.vue'
import { useProjectsStore } from '@/stores/projects.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/projects/:id', name: 'project', component: { template: '<div />' } }]
})

const globalStubs = {
  ScreenHeading: true,
  SectionHeader: true,
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  ProjectCard: true,
  RouterLink: true,
  CreateProjectModal: true
}

function mountProjects(storeState = {}) {
  return mount(ProjectsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            projects: {
              projects: [],
              board: null,
              loadingProjects: false,
              loadingBoard: false,
              errorProjects: '',
              errorBoard: '',
              ...storeState
            }
          }
        }),
        i18n,
        router
      ]
    }
  })
}

describe('ProjectsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Loading / error states --

  it('shows loading indicator while loadingProjects is true', () => {
    const wrapper = mountProjects({ loadingProjects: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message when errorProjects is set', () => {
    const wrapper = mountProjects({ errorProjects: 'Failed to fetch projects' })
    expect(wrapper.text()).toContain('Failed to fetch projects')
    expect(wrapper.find('.projects-view__status--error').exists()).toBe(true)
  })

  it('does not show loading when loadingProjects is false', () => {
    const wrapper = mountProjects({ loadingProjects: false })
    expect(wrapper.find('.projects-view__status').exists()).toBe(false)
  })

  // -- Successful state --

  it('renders the "New project" button when loaded', () => {
    const wrapper = mountProjects({ projects: [] })
    // Button stub renders a real <button> element
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('New project'))).toBe(true)
  })

  it('renders a ProjectCard for each project', () => {
    const projects = [
      { id: 'p1', title: 'Alpha', status: 'on_track', progress: null },
      { id: 'p2', title: 'Beta', status: 'stalled', progress: null }
    ]
    const wrapper = mountProjects({ projects })
    const cards = wrapper.findAll('project-card-stub')
    expect(cards).toHaveLength(2)
  })

  it('passes the project as a prop to each ProjectCard', () => {
    const projects = [{ id: 'p1', title: 'Alpha', status: 'on_track', progress: null }]
    const wrapper = mountProjects({ projects })
    const card = wrapper.find('project-card-stub')
    // vue-test-utils passes object props as JSON string in stub attrs
    expect(card.exists()).toBe(true)
  })

  it('renders SectionHeader with label="Active" when loaded', () => {
    const wrapper = mountProjects({ projects: [] })
    const header = wrapper.find('section-header-stub')
    expect(header.attributes('label')).toBe('Active')
  })

  it('shows SectionHeader count matching the number of projects', () => {
    const projects = [
      { id: 'p1', title: 'A', status: 'on_track', progress: null },
      { id: 'p2', title: 'B', status: 'idle', progress: null }
    ]
    const wrapper = mountProjects({ projects })
    const header = wrapper.find('section-header-stub')
    expect(header.attributes('count')).toBe('2')
  })

  it('shows empty grid (no cards) when projects is empty', () => {
    const wrapper = mountProjects({ projects: [] })
    const cards = wrapper.findAll('project-card-stub')
    expect(cards).toHaveLength(0)
  })

  // -- Lifecycle --

  it('calls store.loadProjects() on mount', () => {
    mountProjects()
    const store = useProjectsStore()
    expect(store.loadProjects).toHaveBeenCalledTimes(1)
  })

  // -- Error state does not show content --

  it('does not render the projects grid while in error state', () => {
    const wrapper = mountProjects({ errorProjects: 'Network error' })
    const cards = wrapper.findAll('project-card-stub')
    expect(cards).toHaveLength(0)
  })

  it('does not render the projects grid while loading', () => {
    const wrapper = mountProjects({ loadingProjects: true })
    const cards = wrapper.findAll('project-card-stub')
    expect(cards).toHaveLength(0)
  })
})
