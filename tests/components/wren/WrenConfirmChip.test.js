import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WrenConfirmChip from '@/components/wren/WrenConfirmChip.vue'

describe('WrenConfirmChip', () => {
  it('renders summary and both buttons', () => {
    const w = mount(WrenConfirmChip, {
      props: { pending: { confirmToken: 'ct1', summary: 'Delete "X"?' } }
    })

    expect(w.text()).toContain('Delete "X"?')
    const btns = w.findAll('button')
    expect(btns.length).toBe(2)
    expect(btns[0].text()).toBe('Cancel')
    expect(btns[1].text()).toBe('Confirm')
  })

  it('emits confirm with token and shows Confirmed label', async () => {
    const w = mount(WrenConfirmChip, {
      props: { confirmToken: 'ct1', summary: 'X', pending: { confirmToken: 'ct1', summary: 'X' } }
    })

    await w.findAll('button')[1].trigger('click')
    expect(w.emitted('confirm')).toEqual([['ct1']])
    expect(w.text()).toContain('Confirmed')
  })

  it('emits cancel with token and shows Cancelled label', async () => {
    const w = mount(WrenConfirmChip, {
      props: { pending: { confirmToken: 'ct1', summary: 'X' } }
    })

    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('cancel')).toEqual([['ct1']])
    expect(w.text()).toContain('Cancelled')
  })

  // -- Expiry mirroring WrenActionChip pattern --

  it('renders Expired state when pending.expiresAt is in the past at mount', () => {
    const past = new Date(Date.now() - 60_000).toISOString()

    const w = mount(WrenConfirmChip, {
      props: { pending: { confirmToken: 'ct1', summary: 'X', expiresAt: past } }
    })

    expect(w.text()).toContain('Expired')
    // Confirm/Cancel buttons are hidden once expired.
    expect(w.findAll('button')).toHaveLength(0)
  })

  it('hides Confirm/Cancel buttons after pending.expiresAt passes (fake timers)', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    try {
      const future = new Date(now + 5_000).toISOString()

      const w = mount(WrenConfirmChip, {
        props: { pending: { confirmToken: 'ct1', summary: 'X', expiresAt: future } }
      })

      // Pre-expiry: both buttons visible.
      expect(w.findAll('button')).toHaveLength(2)
      expect(w.text()).not.toContain('Expired')

      vi.setSystemTime(now + 6_000)
      vi.advanceTimersByTime(6_000)
      await flushPromises()

      expect(w.findAll('button')).toHaveLength(0)
      expect(w.text()).toContain('Expired')
    } finally {
      vi.useRealTimers()
    }
  })

  it('pre-expiry: Confirm/Cancel still emit normally with a future expiresAt', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    const w = mount(WrenConfirmChip, {
      props: { pending: { confirmToken: 'ct1', summary: 'X', expiresAt: future } }
    })

    const btns = w.findAll('button')
    expect(btns).toHaveLength(2)
    await btns[1].trigger('click')
    expect(w.emitted('confirm')).toEqual([['ct1']])
    expect(w.text()).toContain('Confirmed')
  })

  it('pre-expiry: Cancel still emits normally with a future expiresAt', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    const w = mount(WrenConfirmChip, {
      props: { pending: { confirmToken: 'ct1', summary: 'X', expiresAt: future } }
    })

    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('cancel')).toEqual([['ct1']])
    expect(w.text()).toContain('Cancelled')
  })

  it('clears the expiry timer on unmount so no setState happens after teardown', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    try {
      const future = new Date(Date.now() + 60_000).toISOString()

      const w = mount(WrenConfirmChip, {
        props: { pending: { confirmToken: 'ct1', summary: 'X', expiresAt: future } }
      })

      w.unmount()
      expect(clearSpy).toHaveBeenCalled()
    } finally {
      clearSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})
