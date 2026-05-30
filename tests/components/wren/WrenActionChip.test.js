import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WrenActionChip from '@/components/wren/WrenActionChip.vue'

describe('WrenActionChip', () => {
  it('renders summary text', () => {
    const w = mount(WrenActionChip, { props: { action: { summary: 'Added "Buy milk"' } } })
    expect(w.text()).toContain('Added "Buy milk"')
  })

  it('shows Undo button when undoToken present and not expired', () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    const w = mount(WrenActionChip, {
      props: { action: { summary: 'X', undoToken: 't1', undoExpiresAt: future } }
    })

    expect(w.text()).toContain('Undo')
  })

  it('emits undo with token on Undo click and switches to Undone label', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    const w = mount(WrenActionChip, {
      props: { action: { summary: 'X', undoToken: 't1', undoExpiresAt: future } }
    })

    await w.find('button').trigger('click')
    expect(w.emitted('undo')).toEqual([['t1']])
    expect(w.text()).toContain('Undone')
  })

  it('does not show Undo when undoExpiresAt is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString()

    const w = mount(WrenActionChip, {
      props: { action: { summary: 'X', undoToken: 't1', undoExpiresAt: past } }
    })

    expect(w.text()).not.toContain('Undo')
  })

  it('renders pending class when action.pending is true', () => {
    const w = mount(WrenActionChip, { props: { action: { summary: 'Adding…', pending: true } } })
    expect(w.find('.wren-action-chip--pending').exists()).toBe(true)
  })

  it('hides Undo after the undoExpiresAt timer fires', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    try {
      const future = new Date(now + 5_000).toISOString()

      const w = mount(WrenActionChip, {
        props: { action: { summary: 'X', undoToken: 't1', undoExpiresAt: future } }
      })

      expect(w.text()).toContain('Undo')

      // Advance system time + run the pending timeout.
      vi.setSystemTime(now + 6_000)
      vi.advanceTimersByTime(6_000)
      await flushPromises()
      expect(w.text()).not.toContain('Undo')
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears the expiry timer on unmount so no setState happens after teardown', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    try {
      const future = new Date(Date.now() + 60_000).toISOString()

      const w = mount(WrenActionChip, {
        props: { action: { summary: 'X', undoToken: 't1', undoExpiresAt: future } }
      })

      w.unmount()
      expect(clearSpy).toHaveBeenCalled()
    } finally {
      clearSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})

describe('WrenActionChip — non-expiry edge cases', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows no Undo when undoToken is missing even if undoExpiresAt is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    const w = mount(WrenActionChip, {
      props: { action: { summary: 'X', undoExpiresAt: future } }
    })

    expect(w.text()).not.toContain('Undo')
  })
})
