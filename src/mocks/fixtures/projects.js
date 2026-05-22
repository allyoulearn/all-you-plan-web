/** Mock fixtures for the Projects screen and board. */

const projectList = [
  {
    id: 'p1',
    name: 'Launch personal site',
    tag: 'work',
    status: 'active',
    blurb: 'Portfolio and writing hub',
    nudge: null,
    startedOn: '2026-04-01',
    targetOn: '2026-06-01',
    order: 0,
    archived: false,
    progress: { done: 4, total: 10, percent: 40 }
  },
  {
    id: 'p2',
    name: 'Fitness baseline',
    tag: 'health',
    status: 'active',
    blurb: 'Build a sustainable movement habit',
    nudge: null,
    startedOn: '2026-03-15',
    targetOn: '2026-07-15',
    order: 1,
    archived: false,
    progress: { done: 6, total: 8, percent: 75 }
  },
  {
    id: 'p3',
    name: 'Read 12 books this year',
    tag: 'learning',
    status: 'active',
    blurb: 'One book per month minimum',
    nudge: 'Pick the next book',
    startedOn: '2026-01-01',
    targetOn: '2026-12-31',
    order: 2,
    archived: false,
    progress: { done: 4, total: 12, percent: 33 }
  },
  {
    id: 'p4',
    name: 'Home deep clean',
    tag: 'personal',
    status: 'done',
    blurb: 'Spring cleaning top to bottom',
    nudge: null,
    startedOn: '2026-04-10',
    targetOn: '2026-04-30',
    order: 3,
    archived: false,
    progress: { done: 8, total: 8, percent: 100 }
  }
]

const boardProject = projectList[0]

export const registry = {
  projects: () => ({ projects: projectList }),
  projectBoard: variables => ({
    projectBoard: {
      project: variables.id === 'p2' ? projectList[1] : boardProject,
      backlog: [
        {
          id: 'bt1',
          title: 'Write about-me page copy',
          note: null,
          tag: 'work',
          done: false,
          column: 'backlog',
          order: 0
        },
        {
          id: 'bt2',
          title: 'Design mobile breakpoints',
          note: 'Test on iPhone 14 and Pixel 7',
          tag: 'work',
          done: false,
          column: 'backlog',
          order: 1
        }
      ],
      thisWeek: [
        {
          id: 'bt3',
          title: 'Set up Cloudflare Pages deploy',
          note: null,
          tag: 'work',
          done: false,
          column: 'thisWeek',
          order: 0
        },
        {
          id: 'bt4',
          title: 'Write first blog post draft',
          note: 'Topic: building in public',
          tag: 'work',
          done: false,
          column: 'thisWeek',
          order: 1
        }
      ],
      doing: [
        {
          id: 'bt5',
          title: 'Build project index page',
          note: null,
          tag: 'work',
          done: false,
          column: 'doing',
          order: 0
        }
      ],
      done: [
        {
          id: 'bt6',
          title: 'Register domain name',
          note: null,
          tag: 'work',
          done: true,
          column: 'done',
          order: 0
        },
        {
          id: 'bt7',
          title: 'Choose tech stack',
          note: null,
          tag: 'work',
          done: true,
          column: 'done',
          order: 1
        }
      ]
    }
  }),
  updateTask: variables => ({
    updateTask: {
      id: variables.id,
      column: variables.input?.column ?? 'doing'
    }
  })
}
