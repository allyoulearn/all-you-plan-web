/**
 * Mock fixtures for Goals.
 *
 * GOALS_QUERY uses a `... GoalFields on Goal` fragment. Apollo's InMemoryCache
 * skips fragment fields when the response object lacks `__typename: 'Goal'`,
 * which would silently strip every Goal field and surface as an empty view.
 * Both Goal and GoalLink carry their typename so the fragment applies.
 */

let GOALS = [
  {
    __typename: 'Goal',
    id: 'g1',
    title: 'Finish memoir first draft',
    why: 'Because I have been talking about it for three years.',
    targetDate: '2026-10-01',
    status: 'ok',
    archived: false,
    progress: 0.34,
    linkedProjects: [
      {
        __typename: 'GoalLink',
        id: 'p1',
        name: 'Memoir — "Hand-drawn maps"',
        progress: 0.34,
        kind: 'project'
      }
    ],
    linkedChores: [
      {
        __typename: 'GoalLink',
        id: 'c1',
        name: 'Daily morning pages',
        progress: 0.7,
        kind: 'chore'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-20T09:00:00Z'
  },
  {
    __typename: 'Goal',
    id: 'g2',
    title: 'Build a calmer home',
    why: 'I want a place that feels like rest, not a to-do list.',
    targetDate: '2026-12-31',
    status: 'ok',
    archived: false,
    progress: 0.61,
    linkedProjects: [
      {
        __typename: 'GoalLink',
        id: 'p2',
        name: 'Move to new apartment',
        progress: 0.72,
        kind: 'project'
      },
      {
        __typename: 'GoalLink',
        id: 'p3',
        name: 'Balcony garden 2026',
        progress: 0.55,
        kind: 'project'
      }
    ],
    linkedChores: [
      {
        __typename: 'GoalLink',
        id: 'c2',
        name: 'Weekly review chore',
        progress: 0.5,
        kind: 'chore'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-20T09:00:00Z'
  },
  {
    __typename: 'Goal',
    id: 'g3',
    title: 'Play Clair de Lune by year-end',
    why: 'I bought a piano. It deserves more than scales.',
    targetDate: '2026-12-24',
    status: 'risk',
    archived: false,
    progress: 0.42,
    linkedProjects: [
      {
        __typename: 'GoalLink',
        id: 'p4',
        name: 'Learn Debussy — Clair de Lune',
        progress: 0.42,
        kind: 'project'
      }
    ],
    linkedChores: [
      {
        __typename: 'GoalLink',
        id: 'c3',
        name: 'Practice scales (daily)',
        progress: 0.55,
        kind: 'chore'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-20T09:00:00Z'
  },
  {
    __typename: 'Goal',
    id: 'g4',
    title: 'Stay strong & flexible',
    why: 'I want to be 80 and still hike.',
    targetDate: '2026-12-31',
    status: 'ok',
    archived: false,
    progress: 0.48,
    linkedProjects: [],
    linkedChores: [
      {
        __typename: 'GoalLink',
        id: 'c4',
        name: '10 min stretch (daily)',
        progress: 0.21,
        kind: 'chore'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-20T09:00:00Z'
  }
]

export const registry = {
  goals: () => ({ goals: GOALS.filter(g => !g.archived) }),
  goal: ({ id }) => ({ goal: GOALS.find(g => g.id === id) ?? null }),
  createGoal: (variables = {}) => {
    const input = variables.input ?? {}

    const goal = {
      id: 'g' + (GOALS.length + 1),
      title: input.title ?? 'Untitled goal',
      why: input.why ?? '',
      targetDate: input.targetDate ?? new Date().toISOString().slice(0, 10),
      status: 'ok',
      archived: false,
      progress: 0,
      linkedProjects: [],
      linkedChores: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    GOALS = [...GOALS, goal]
    return { createGoal: goal }
  },
  updateGoal: (variables = {}) => {
    const { id, input = {} } = variables
    const goal = GOALS.find(g => g.id === id)
    if (!goal) return { updateGoal: null }
    Object.assign(goal, input, { updatedAt: new Date().toISOString() })
    return { updateGoal: goal }
  },
  archiveGoal: (variables = {}) => {
    const goal = GOALS.find(g => g.id === variables.id)
    if (goal) goal.archived = true
    return { archiveGoal: !!goal }
  }
}
