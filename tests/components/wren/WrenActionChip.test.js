import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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
})
