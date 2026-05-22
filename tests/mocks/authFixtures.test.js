import { describe, it, expect } from 'vitest'
import { registry } from '@/mocks/fixtures/auth.js'

/**
 * The mock user's `settings` must use values the app actually understands.
 * SettingsView reads `settings.checkIns` as an array and binds the other
 * fields to fixed option lists; unexpected values crash the page or render
 * no selection. The valid sets here mirror src/views/SettingsView.vue.
 */
describe('auth mock fixture — user settings', () => {
  const settings = registry.me().me.settings

  it('checkIns is an array of known check-in slots', () => {
    expect(Array.isArray(settings.checkIns)).toBe(true)
    for (const slot of settings.checkIns) {
      expect(['morning', 'midday', 'evening', 'stuck']).toContain(slot)
    }
  })

  it('theme, mode, coachPersonality and journalVisibility are valid options', () => {
    expect(['warm', 'ink', 'blueprint', 'rose']).toContain(settings.theme)
    expect(['light', 'dark']).toContain(settings.mode)
    expect(['gentle', 'direct', 'reflective']).toContain(settings.coachPersonality)
    expect(['private', 'themed', 'open']).toContain(settings.journalVisibility)
  })

  it('stalledNudgeDays is one of the offered values', () => {
    expect([4, 7, 10, null]).toContain(settings.stalledNudgeDays)
  })
})
