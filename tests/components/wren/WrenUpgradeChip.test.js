import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock the billing composable so the click handler does not need a Pinia
// app context. The chip's default behaviour is to call startUpgrade — we
// verify both the emitted event AND the composable invocation.
const startUpgradeMock = vi.fn()
vi.mock('@/composables/useBilling.js', () => ({
  useBilling: () => ({
    startUpgrade: startUpgradeMock,
    openPortal: vi.fn(),
    currentTier: () => 'free',
    isPaid: () => false
  })
}))

import WrenUpgradeChip from '@/components/wren/WrenUpgradeChip.vue'

describe('WrenUpgradeChip', () => {
  beforeEach(() => {
    startUpgradeMock.mockClear()
  })

  it('renders the action summary text', () => {
    const w = mount(WrenUpgradeChip, {
      props: {
        action: { kind: 'upgrade', summary: 'Upgrade for 200 turns/day', planId: 'wren-pro' }
      }
    })
    expect(w.text()).toContain('Upgrade for 200 turns/day')
  })

  it('falls back to default summary copy when summary is missing', () => {
    const w = mount(WrenUpgradeChip, {
      props: { action: { kind: 'upgrade', planId: 'wren-pro' } }
    })
    expect(w.text()).toContain('Upgrade to Pro')
  })

  it('renders a primary CTA button', () => {
    const w = mount(WrenUpgradeChip, {
      props: { action: { kind: 'upgrade', summary: 'X', planId: 'wren-pro' } }
    })
    const button = w.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Upgrade to Pro')
  })

  it('emits "upgrade" with the planId on click', async () => {
    const w = mount(WrenUpgradeChip, {
      props: { action: { kind: 'upgrade', summary: 'X', planId: 'wren-pro' } }
    })
    await w.find('button').trigger('click')
    expect(w.emitted('upgrade')).toEqual([['wren-pro']])
  })

  it('invokes the billing composable on click (default behaviour)', async () => {
    const w = mount(WrenUpgradeChip, {
      props: { action: { kind: 'upgrade', summary: 'X', planId: 'wren-pro' } }
    })
    await w.find('button').trigger('click')
    expect(startUpgradeMock).toHaveBeenCalledWith('wren-pro')
  })

  it('falls back to "wren-pro" planId when payload omits it', async () => {
    const w = mount(WrenUpgradeChip, {
      props: { action: { kind: 'upgrade', summary: 'X' } }
    })
    await w.find('button').trigger('click')
    expect(w.emitted('upgrade')).toEqual([['wren-pro']])
    expect(startUpgradeMock).toHaveBeenCalledWith('wren-pro')
  })
})
