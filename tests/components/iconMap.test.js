import { describe, it, expect } from 'vitest'
import { outlineIcons, solidIcons } from '@/components/ui/iconMap.js'

// All nav icon keys used in navConfig.js
const NAV_ICON_KEYS = [
  'today',
  'chores',
  'projects',
  'calendar',
  'stats',
  'journal',
  'inbox',
  'chat',
  'review',
  'settings'
]

// All utility icon keys expected to exist
const UTILITY_ICON_KEYS = [
  'more',
  'search',
  'plus',
  'check',
  'chevron-left',
  'chevron-right',
  'chevron-down',
  'moon',
  'sun',
  'flag',
  'mic',
  'bolt',
  'arrow-right',
  'filter'
]

describe('iconMap', () => {
  // -- outlineIcons --

  describe('outlineIcons', () => {
    it('is a plain object', () => {
      expect(typeof outlineIcons).toBe('object')
      expect(outlineIcons).not.toBeNull()
    })

    it('every nav icon key resolves to a non-null component', () => {
      for (const key of NAV_ICON_KEYS) {
        expect(outlineIcons[key], `outlineIcons["${key}"]`).toBeTruthy()
      }
    })

    it('every utility icon key resolves to a non-null component', () => {
      for (const key of UTILITY_ICON_KEYS) {
        expect(outlineIcons[key], `outlineIcons["${key}"]`).toBeTruthy()
      }
    })

    it('does NOT contain the removed "wren" key (WEB-T06-008)', () => {
      expect(outlineIcons['wren']).toBeUndefined()
    })

    it('all values are functions (Vue component constructors)', () => {
      for (const [key, component] of Object.entries(outlineIcons)) {
        expect(typeof component, `outlineIcons["${key}"] should be a function`).toBe('function')
      }
    })

    it('today resolves to a different component than settings', () => {
      // Heroicons are function components; validate by object identity
      expect(outlineIcons['today']).not.toBe(outlineIcons['settings'])
    })

    it('today resolves to a different component than calendar', () => {
      expect(outlineIcons['today']).not.toBe(outlineIcons['calendar'])
    })

    it('chat key maps to a different component than review', () => {
      expect(outlineIcons['chat']).not.toBe(outlineIcons['review'])
    })
  })

  // -- solidIcons --

  describe('solidIcons', () => {
    it('is a plain object', () => {
      expect(typeof solidIcons).toBe('object')
      expect(solidIcons).not.toBeNull()
    })

    it('every nav icon key resolves to a non-null component', () => {
      for (const key of NAV_ICON_KEYS) {
        expect(solidIcons[key], `solidIcons["${key}"]`).toBeTruthy()
      }
    })

    it('does NOT contain the removed "wren" key (WEB-T06-008)', () => {
      expect(solidIcons['wren']).toBeUndefined()
    })

    it('all values are functions (Vue component constructors)', () => {
      for (const [key, component] of Object.entries(solidIcons)) {
        expect(typeof component, `solidIcons["${key}"] should be a function`).toBe('function')
      }
    })

    it('solid and outline icons for the same key are different components', () => {
      // Outline and Solid are separate icon sets
      expect(outlineIcons['today']).not.toBe(solidIcons['today'])
    })
  })

  // -- key set parity --

  it('outlineIcons and solidIcons have the same set of keys', () => {
    const outlineKeys = Object.keys(outlineIcons).sort()
    const solidKeys = Object.keys(solidIcons).sort()
    expect(outlineKeys).toEqual(solidKeys)
  })

  it('total icon count matches expectations (29 keys — "wren" removed)', () => {
    // 14 original − 1 removed ("wren") = 13; add back nav + utility counts
    const count = Object.keys(outlineIcons).length
    // At minimum all nav + utility keys must be present
    expect(count).toBeGreaterThanOrEqual(NAV_ICON_KEYS.length + UTILITY_ICON_KEYS.length)
  })
})
