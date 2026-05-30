import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WrenSettingsPanel from '@/components/wren/WrenSettingsPanel.vue'
import { useWrenStore } from '@/stores/wren.store.js'

vi.mock('@/api/apollo.js', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}))

describe('WrenSettingsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads existing settings on mount and populates form', async () => {
    const store = useWrenStore()

    vi.spyOn(store, 'loadSettings').mockImplementation(async () => {
      store.settings = { displayName: 'Lucas', tone: 'direct', enabled: true, dailyTurnCap: 50 }
    })

    const w = mount(WrenSettingsPanel)
    await flushPromises()
    expect(w.find('input[type=text]').element.value).toBe('Lucas')
    expect(w.find('select').element.value).toBe('direct')
  })

  it('calls updateSettings on save and shows Saved', async () => {
    const store = useWrenStore()
    vi.spyOn(store, 'loadSettings').mockResolvedValue()

    const update = vi
      .spyOn(store, 'updateSettings')
      .mockResolvedValue({ displayName: null, tone: 'warm', enabled: true, dailyTurnCap: null })

    const w = mount(WrenSettingsPanel)
    await flushPromises()
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(update).toHaveBeenCalled()
    expect(w.text()).toContain('Saved')
  })

  it('shows error when updateSettings returns null', async () => {
    const store = useWrenStore()
    vi.spyOn(store, 'loadSettings').mockResolvedValue()
    vi.spyOn(store, 'updateSettings').mockResolvedValue(null)
    const w = mount(WrenSettingsPanel)
    await flushPromises()
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(w.text()).toContain('Save failed')
  })

  it('inputs are disabled while loading=true (before loadSettings resolves)', () => {
    const store = useWrenStore()
    // Block loadSettings so loading stays true throughout this test.
    vi.spyOn(store, 'loadSettings').mockImplementation(() => new Promise(() => {}))
    const w = mount(WrenSettingsPanel)
    // Form rendered, but the inputs are disabled.
    expect(w.find('input[type=text]').attributes('disabled')).toBeDefined()
    expect(w.find('select').attributes('disabled')).toBeDefined()
  })

  it('clears displayName when the user leaves the input empty (sends null, not "")', async () => {
    const store = useWrenStore()

    vi.spyOn(store, 'loadSettings').mockImplementation(async () => {
      store.settings = { displayName: 'Lucas', tone: 'warm', enabled: true, dailyTurnCap: null }
    })

    const update = vi
      .spyOn(store, 'updateSettings')
      .mockResolvedValue({ displayName: null, tone: 'warm', enabled: true, dailyTurnCap: null })

    const w = mount(WrenSettingsPanel)
    await flushPromises()
    await w.find('input[type=text]').setValue('')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ displayName: null }))
  })

  it('sends null for dailyTurnCap when the number input is blank', async () => {
    const store = useWrenStore()

    vi.spyOn(store, 'loadSettings').mockImplementation(async () => {
      store.settings = { displayName: 'Lucas', tone: 'warm', enabled: true, dailyTurnCap: 50 }
    })

    const update = vi
      .spyOn(store, 'updateSettings')
      .mockResolvedValue({ displayName: null, tone: 'warm', enabled: true, dailyTurnCap: null })

    const w = mount(WrenSettingsPanel)
    await flushPromises()
    await w.find('input[type=number]').setValue('')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ dailyTurnCap: null }))
  })

  it('falls back to defaults when store.settings is null after loadSettings', async () => {
    const store = useWrenStore()
    vi.spyOn(store, 'loadSettings').mockResolvedValue() // settings stays null
    const w = mount(WrenSettingsPanel)
    await flushPromises()
    // The form keeps initial defaults instead of crashing.
    expect(w.find('select').element.value).toBe('warm')
    expect(w.find('input[type=text]').element.value).toBe('')
  })
})
