import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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
      props: { pending: { confirmToken: 'ct1', summary: 'X' } }
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
})
