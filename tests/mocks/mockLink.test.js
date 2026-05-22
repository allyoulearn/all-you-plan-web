import { describe, it, expect, vi } from 'vitest'
import { gql, execute } from '@apollo/client/core'
import { createMockLink } from '@/mocks/mockLink.js'

function run(link, query, variables) {
  return new Promise((resolve, reject) => {
    execute(link, { query, variables }).subscribe({ next: resolve, error: reject })
  })
}

describe('createMockLink', () => {
  it('resolves an operation from the registry by root field name', async () => {
    const registry = { today: vars => ({ today: { date: vars.date } }) }
    const link = createMockLink(registry)
    const result = await run(
      link,
      gql`
        query Today($date: String) {
          today(date: $date) {
            date
          }
        }
      `,
      { date: '2026-05-22' }
    )
    expect(result.data).toEqual({ today: { date: '2026-05-22' } })
  })

  it('resolves anonymous operations by root field name', async () => {
    const registry = { chores: () => ({ chores: [] }) }
    const link = createMockLink(registry)
    const result = await run(
      link,
      gql`
        query {
          chores {
            id
          }
        }
      `,
      {}
    )
    expect(result.data).toEqual({ chores: [] })
  })

  it('returns empty data and warns for an unmapped operation', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const link = createMockLink({})
    const result = await run(
      link,
      gql`
        query Unknown {
          unknownThing {
            id
          }
        }
      `,
      {}
    )
    expect(result.data).toEqual({})
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
