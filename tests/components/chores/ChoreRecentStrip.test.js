import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoreRecentStrip from '@/components/chores/ChoreRecentStrip.vue'

const strip = [
  { iso: '2026-05-12', state: 'done' },
  { iso: '2026-05-13', state: 'missed' },
  { iso: '2026-05-14', state: 'not-due' },
  { iso: '2026-05-15', state: 'done' },
  { iso: '2026-05-16', state: 'done' },
  { iso: '2026-05-17', state: 'missed' },
  { iso: '2026-05-18', state: 'done' }
]

describe('ChoreRecentStrip', () => {
  it('renders 7 dots', () => {
    const wrapper = mount(ChoreRecentStrip, { props: { strip } })
    expect(wrapper.findAll('.chore-recent-strip__dot')).toHaveLength(7)
  })

  it('applies state modifiers', () => {
    const wrapper = mount(ChoreRecentStrip, { props: { strip } })
    expect(wrapper.findAll('.chore-recent-strip__dot--done')).toHaveLength(4)
    expect(wrapper.findAll('.chore-recent-strip__dot--missed')).toHaveLength(2)
    expect(wrapper.findAll('.chore-recent-strip__dot--not-due')).toHaveLength(1)
  })

  it('puts each iso date in the dot title for screen readers', () => {
    const wrapper = mount(ChoreRecentStrip, { props: { strip } })
    const titles = wrapper.findAll('.chore-recent-strip__dot').map(d => d.attributes('title'))
    expect(titles).toEqual(strip.map(d => d.iso))
  })
})
