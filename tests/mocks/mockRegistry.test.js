import { describe, it, expect } from 'vitest'
import { mockRegistry } from '@/mocks/index.js'

// Root field names contributed by each fixture domain
const EXPECTED_KEYS = [
  // auth
  'login',
  'register',
  'refreshToken',
  'resetPassword',
  'me',
  'updateProfile',
  'logout',
  'forgotPassword',
  // today
  'today',
  'completeTask',
  'createTask',
  'rescheduleTask',
  'moveUnfinishedToTomorrow',
  // chores
  'chores',
  'completeChore',
  // projects
  'projects',
  'projectBoard',
  // calendar
  'calendarEvents',
  // stats
  'stats',
  // journal
  'journalEntries',
  'createJournalEntry',
  // inbox
  'inboxItems',
  'createInboxItem',
  // review
  'dailyReview',
  'saveDailyReview',
  // wren
  'wrenMessages',
  'sendWrenMessage'
]

describe('mockRegistry', () => {
  // -- shape --

  it('is a plain object', () => {
    expect(typeof mockRegistry).toBe('object')
    expect(mockRegistry).not.toBeNull()
  })

  it('all values are functions', () => {
    for (const [key, fn] of Object.entries(mockRegistry)) {
      expect(typeof fn, `mockRegistry["${key}"] should be a function`).toBe('function')
    }
  })

  // -- completeness: every domain contributes its keys --

  it('contains all expected root field names', () => {
    for (const key of EXPECTED_KEYS) {
      expect(mockRegistry, `key "${key}" missing`).toHaveProperty(key)
    }
  })

  // -- fixture return values: auth --

  describe('auth fixtures', () => {
    it('login returns an accessToken and user', () => {
      const result = mockRegistry.login({})
      expect(result.login.accessToken).toBeDefined()
      expect(result.login.user).toBeDefined()
    })

    it('register returns an accessToken and user', () => {
      const result = mockRegistry.register({})
      expect(result.register.accessToken).toBeDefined()
    })

    it('me returns a user with id and email', () => {
      const result = mockRegistry.me({})
      expect(result.me.id).toBeDefined()
      expect(result.me.email).toBeDefined()
    })

    it('logout returns true', () => {
      const result = mockRegistry.logout({})
      expect(result.logout).toBe(true)
    })

    it('updateProfile merges the provided name', () => {
      const result = mockRegistry.updateProfile({ name: 'New Name' })
      expect(result.updateProfile.name).toBe('New Name')
    })

    it('forgotPassword returns true', () => {
      const result = mockRegistry.forgotPassword({})
      expect(result.forgotPassword).toBe(true)
    })
  })

  // -- fixture return values: today --

  describe('today fixtures', () => {
    it('today returns a view with a date', () => {
      const result = mockRegistry.today({ date: '2026-05-22' })
      expect(result.today.date).toBe('2026-05-22')
    })

    it('today falls back to a default date when none is provided', () => {
      const result = mockRegistry.today({})
      expect(result.today.date).toBeDefined()
    })

    it('today includes tasks and kpis', () => {
      const result = mockRegistry.today({})
      expect(Array.isArray(result.today.tasks)).toBe(true)
      expect(result.today.kpis).toBeDefined()
    })

    it('completeTask returns the task id with done: true', () => {
      const result = mockRegistry.completeTask({ id: 't1' })
      expect(result.completeTask.id).toBe('t1')
      expect(result.completeTask.done).toBe(true)
    })

    it('createTask returns an object with an id', () => {
      const result = mockRegistry.createTask({})
      expect(result.createTask.id).toBeDefined()
    })

    it('moveUnfinishedToTomorrow returns an array of tasks', () => {
      const result = mockRegistry.moveUnfinishedToTomorrow({})
      expect(Array.isArray(result.moveUnfinishedToTomorrow)).toBe(true)
    })
  })

  // -- fixture return values: chores --

  describe('chores fixtures', () => {
    it('chores returns an array', () => {
      const result = mockRegistry.chores({})
      expect(Array.isArray(result.chores)).toBe(true)
    })

    it('completeChore returns a chore object', () => {
      const result = mockRegistry.completeChore({ id: 'c1' })
      expect(result.completeChore).toBeDefined()
    })
  })

  // -- fixture return values: wren --

  describe('wren fixtures', () => {
    it('wrenMessages returns an array', () => {
      const result = mockRegistry.wrenMessages({})
      expect(Array.isArray(result.wrenMessages)).toBe(true)
    })

    it('sendWrenMessage returns a message object', () => {
      const result = mockRegistry.sendWrenMessage({ text: 'hello' })
      expect(result.sendWrenMessage).toBeDefined()
    })
  })

  // -- fixture return values: stats --

  describe('stats fixtures', () => {
    it('stats returns an object with heatmap and rankedHabits', () => {
      const result = mockRegistry.stats({})
      expect(result.stats.heatmap).toBeDefined()
      expect(result.stats.rankedHabits).toBeDefined()
    })
  })

  // -- all fixture functions accept a variables argument --

  it('every fixture function accepts an empty object without throwing', () => {
    for (const [key, fn] of Object.entries(mockRegistry)) {
      expect(() => fn({}), `mockRegistry["${key}"]({}) should not throw`).not.toThrow()
    }
  })
})
