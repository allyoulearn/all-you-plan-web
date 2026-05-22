import { describe, it, expect } from 'vitest'
import { navGroups } from '@/components/layout/navConfig.js'

describe('navConfig — navGroups', () => {
  // -- shape --

  it('exports an array', () => {
    expect(Array.isArray(navGroups)).toBe(true)
  })

  it('contains exactly four groups', () => {
    expect(navGroups).toHaveLength(4)
  })

  it('every group has a string label', () => {
    for (const group of navGroups) {
      expect(typeof group.label).toBe('string')
      expect(group.label.length).toBeGreaterThan(0)
    }
  })

  it('every group has a non-empty items array', () => {
    for (const group of navGroups) {
      expect(Array.isArray(group.items)).toBe(true)
      expect(group.items.length).toBeGreaterThan(0)
    }
  })

  it('every item has the required fields: to, icon, label, key', () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        expect(typeof item.to).toBe('string')
        expect(typeof item.icon).toBe('string')
        expect(typeof item.label).toBe('string')
        expect(typeof item.key).toBe('string')
      }
    }
  })

  it('every item.to starts with a slash', () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        expect(item.to).toMatch(/^\//)
      }
    }
  })

  // -- group labels --

  it('groups are labelled Workspaces, Looking back, With Wren, System', () => {
    const labels = navGroups.map(g => g.label)
    expect(labels).toEqual(['Workspaces', 'Looking back', 'With Wren', 'System'])
  })

  // -- Workspaces group --

  describe('Workspaces group', () => {
    const group = navGroups.find(g => g.label === 'Workspaces')

    it('exists', () => {
      expect(group).toBeDefined()
    })

    it('contains Today, Chores, Projects', () => {
      const labels = group.items.map(i => i.label)
      expect(labels).toContain('Today')
      expect(labels).toContain('Chores')
      expect(labels).toContain('Projects')
    })

    it('Today route is /', () => {
      const today = group.items.find(i => i.label === 'Today')
      expect(today.to).toBe('/')
    })

    it('keyboard shortcut keys are single characters', () => {
      for (const item of group.items) {
        expect(item.key.length).toBe(1)
      }
    })
  })

  // -- Looking back group --

  describe('Looking back group', () => {
    const group = navGroups.find(g => g.label === 'Looking back')

    it('contains Calendar, Stats, Journal, Inbox', () => {
      const labels = group.items.map(i => i.label)
      expect(labels).toContain('Calendar')
      expect(labels).toContain('Stats')
      expect(labels).toContain('Journal')
      expect(labels).toContain('Inbox')
    })
  })

  // -- With Wren group --

  describe('With Wren group', () => {
    const group = navGroups.find(g => g.label === 'With Wren')

    it('contains Chat and Daily review', () => {
      const labels = group.items.map(i => i.label)
      expect(labels).toContain('Chat')
      expect(labels).toContain('Daily review')
    })

    it('Chat item uses the "chat" icon key (not "wren")', () => {
      const chat = group.items.find(i => i.label === 'Chat')
      expect(chat.icon).toBe('chat')
    })
  })

  // -- System group --

  describe('System group', () => {
    const group = navGroups.find(g => g.label === 'System')

    it('contains Settings', () => {
      const labels = group.items.map(i => i.label)
      expect(labels).toContain('Settings')
    })

    it('Settings shortcut key is a comma', () => {
      const settings = group.items.find(i => i.label === 'Settings')
      expect(settings.key).toBe(',')
    })
  })

  // -- no duplicate keys across all items --

  it('all keyboard shortcut keys are unique across all items', () => {
    const allKeys = navGroups.flatMap(g => g.items.map(i => i.key))
    const uniqueKeys = new Set(allKeys)
    expect(uniqueKeys.size).toBe(allKeys.length)
  })

  // -- no duplicate routes --

  it('all route paths are unique', () => {
    const allPaths = navGroups.flatMap(g => g.items.map(i => i.to))
    const uniquePaths = new Set(allPaths)
    expect(uniquePaths.size).toBe(allPaths.length)
  })
})
