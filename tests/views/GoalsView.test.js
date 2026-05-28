import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import GoalsView from '@/views/GoalsView.vue'
import { useGoalsStore } from '@/stores/goals.store'
import enRaw from '@/i18n/locales/en.json'

function sanitize(value) {
  if (typeof value === 'string') return value.replace(/@/g, "{'@'}")
  if (Array.isArray(value)) return value.map(sanitize)

  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = sanitize(value[k])
    return out
  }

  return value
}

const en = sanitize(enRaw)
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: true,
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :data-variant="variant" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  },
  AppIcon: true,
  // The modals + confirm dialog are stubbed to a div that exposes their open
  // state via a data attribute so we can assert "the modal opened" without
  // pulling in the full Teleport machinery.
  CreateGoalModal: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="create-goal-stub" :data-open="modelValue ? \'1\' : \'0\'" />'
  },
  EditGoalModal: {
    props: ['modelValue', 'goal'],
    emits: ['update:modelValue'],
    template:
      '<div class="edit-goal-stub" :data-open="modelValue ? \'1\' : \'0\'" :data-goal-id="goal && goal.id" />'
  },
  AppConfirmDialog: {
    props: ['modelValue', 'title', 'message', 'busy', 'confirmLabel', 'cancelLabel', 'busyLabel'],
    emits: ['update:modelValue', 'confirm', 'cancel'],
    template:
      '<div class="confirm-stub" :data-open="modelValue ? \'1\' : \'0\'"><button class="confirm-stub__confirm" @click="$emit(\'confirm\')">confirm</button></div>'
  },
  GoalCardMenu: {
    emits: ['edit', 'remove'],
    template:
      '<div class="goal-menu-stub"><button class="goal-menu-stub__edit" @click="$emit(\'edit\')">edit</button><button class="goal-menu-stub__remove" @click="$emit(\'remove\')">remove</button></div>'
  }
}

const FAKE_GOAL = {
  id: 'g1',
  title: 'Write book',
  why: 'because writers write',
  status: 'ok',
  progress: 0.25,
  targetDate: '2026-12-31',
  linkedProjects: [{ id: 'p1', name: 'Outline', progress: 0.5, kind: 'project' }],
  linkedChores: [{ id: 'c1', name: 'Pages daily', progress: 0.8, kind: 'chore' }]
}

const RISK_GOAL = {
  ...FAKE_GOAL,
  id: 'g2',
  title: 'Marathon',
  status: 'risk',
  linkedProjects: [],
  linkedChores: []
}

const DONE_GOAL = {
  ...FAKE_GOAL,
  id: 'g3',
  title: 'Done',
  status: 'done',
  linkedProjects: [],
  linkedChores: []
}

function mountGoals(storeOverrides = {}) {
  return mount(GoalsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            goals: { goals: [], loading: false, error: '', ...storeOverrides }
          }
        }),
        i18n
      ]
    }
  })
}

describe('GoalsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('mounts cleanly with an empty store', () => {
    const wrapper = mountGoals()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls store.load on mount', () => {
    mountGoals()
    const store = useGoalsStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  it('shows loading text while first load is in flight', () => {
    const wrapper = mountGoals({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders the empty-state CTA when no goals exist', async () => {
    const wrapper = mountGoals()
    await flushPromises()
    expect(wrapper.find('.goals__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No goals yet')
    expect(wrapper.text()).toContain('Add your first goal')
  })

  it('renders the hero card when goals exist', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__hero').exists()).toBe(true)
    expect(wrapper.text()).toContain('Write book')
  })

  it('shows status pill for risk goals using the risk label', async () => {
    const wrapper = mountGoals({ goals: [RISK_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__status--risk').exists()).toBe(true)
  })

  it('uses the done label for completed goals', async () => {
    const wrapper = mountGoals({ goals: [DONE_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__status--done').exists()).toBe(true)
  })

  it('renders both hero (first) and grid (rest) goals', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL, RISK_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__hero').exists()).toBe(true)
    expect(wrapper.findAll('.goals__card').length).toBe(1)
  })

  it('opens the create modal when "Add your first goal" is clicked', async () => {
    const wrapper = mountGoals()
    await flushPromises()
    const btn = wrapper.findAll('button').find(b => b.text().includes('Add your first goal'))
    await btn.trigger('click')
    expect(wrapper.find('.create-goal-stub').attributes('data-open')).toBe('1')
  })

  it('opens the create modal when the "New goal" action-bar button is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    const btn = wrapper.findAll('button').find(b => b.text().includes('New goal'))
    await btn.trigger('click')
    expect(wrapper.find('.create-goal-stub').attributes('data-open')).toBe('1')
  })

  it('opens the edit modal when a card kebab → Edit is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    await wrapper.find('.goal-menu-stub__edit').trigger('click')
    const editStub = wrapper.find('.edit-goal-stub')
    expect(editStub.attributes('data-open')).toBe('1')
    expect(editStub.attributes('data-goal-id')).toBe('g1')
  })

  it('opens the confirm dialog when a card kebab → Remove is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    await wrapper.find('.goal-menu-stub__remove').trigger('click')
    expect(wrapper.find('.confirm-stub').attributes('data-open')).toBe('1')
  })

  it('calls store.archive when the remove confirm is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    const store = useGoalsStore()
    store.archive.mockResolvedValue(undefined)
    await flushPromises()
    await wrapper.find('.goal-menu-stub__remove').trigger('click')
    await wrapper.find('.confirm-stub__confirm').trigger('click')
    await flushPromises()
    expect(store.archive).toHaveBeenCalledWith('g1')
  })
})
