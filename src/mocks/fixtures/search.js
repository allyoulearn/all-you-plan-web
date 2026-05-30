/** Mock fixtures for global search. */

const SEED = {
  tasks: [
    {
      id: 't1',
      kind: 'task',
      title: 'Draft chapter 3 outline',
      snippet: 'Today · 10:30 · Memoir',
      when: 'today',
      projectTag: 'Memoir',
      href: '/'
    },
    {
      id: 't2',
      kind: 'task',
      title: 'Sign apartment lease',
      snippet: 'Wed · Project: Move',
      when: 'Wed',
      projectTag: 'Move',
      href: '/'
    },
    {
      id: 't3',
      kind: 'task',
      title: 'Tidy desk + plan tomorrow',
      snippet: 'Daily chore',
      when: 'today',
      projectTag: 'chore',
      href: '/'
    }
  ],
  projects: [
    {
      id: 'p1',
      kind: 'project',
      title: 'Memoir — "Hand-drawn maps"',
      snippet: 'Writing · 34% · last touched yesterday',
      when: 'yesterday',
      projectTag: null,
      href: '/projects/p1'
    },
    {
      id: 'p2',
      kind: 'project',
      title: 'Move to new apartment',
      snippet: 'Life admin · 72% · Hot',
      when: 'today',
      projectTag: null,
      href: '/projects/p2'
    }
  ],
  chores: [
    {
      id: 'c1',
      kind: 'chore',
      title: 'Morning pages',
      snippet: 'Daily · 42-day streak',
      when: 'today',
      projectTag: null,
      href: '/chores'
    },
    {
      id: 'c2',
      kind: 'chore',
      title: 'Make the bed',
      snippet: 'Daily · 31-day streak',
      when: 'today',
      projectTag: null,
      href: '/chores'
    }
  ],
  inbox: [
    {
      id: 'i1',
      kind: 'inbox',
      title: 'Ask Annika about parking spot',
      snippet: 'Quick capture',
      when: '08:14',
      projectTag: null,
      href: '/inbox'
    },
    {
      id: 'i2',
      kind: 'inbox',
      title: 'Idea: chapter named after each city we left',
      snippet: 'Captured Sun',
      when: 'Sun',
      projectTag: null,
      href: '/inbox'
    }
  ],
  journal: [
    {
      id: 'j1',
      kind: 'journal',
      title: '"The chapter is starting to sound like me again."',
      snippet: 'Entry · May 21',
      when: 'today',
      projectTag: null,
      href: '/journal'
    }
  ],
  calendar: [
    {
      id: 'e1',
      kind: 'calendar',
      title: 'Ch.3 outline',
      snippet: 'Thu, May 21 · 10:30',
      when: 'today',
      projectTag: null,
      href: '/calendar'
    },
    {
      id: 'e2',
      kind: 'calendar',
      title: 'Sign lease',
      snippet: 'Wed, May 20',
      when: 'Wed',
      projectTag: null,
      href: '/calendar'
    }
  ],
  wren: [
    {
      id: 'w1',
      kind: 'wren',
      title: 'Tutorial pairs well with Rust frustration',
      snippet: 'Memory note · learned May 18',
      when: 'May 18',
      projectTag: null,
      href: '/wren'
    }
  ]
}

const RECENT = ['chapter 3', 'annika', 'rust', 'lease', 'morning pages']

/**
 * Case-insensitive substring match across each item's title and snippet.
 * Escapes regex metacharacters in `q` so user input cannot blow up the filter.
 * @param {Array<{ title: string, snippet: string }>} arr
 * @param {string} q
 * @returns {Array<object>}
 */
function filter(arr, q) {
  if (!q) return arr
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return arr.filter(it => re.test(it.title) || re.test(it.snippet))
}

export const registry = {
  search: ({ query = '' }) => ({
    search: {
      query,
      recent: RECENT,
      tasks: filter(SEED.tasks, query),
      projects: filter(SEED.projects, query),
      chores: filter(SEED.chores, query),
      inbox: filter(SEED.inbox, query),
      journal: filter(SEED.journal, query),
      calendar: filter(SEED.calendar, query),
      wren: filter(SEED.wren, query)
    }
  }),
  recordSearchQuery: () => ({ recordSearchQuery: true })
}
