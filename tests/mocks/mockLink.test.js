import { describe, it, expect, vi } from 'vitest'
import { gql, execute, Observable } from '@apollo/client/core'
import { createMockLink } from '@/mocks/mockLink.js'

function run(link, query, variables) {
  return new Promise((resolve, reject) => {
    execute(link, { query, variables }).subscribe({ next: resolve, error: reject })
  })
}

function collect(link, query, variables) {
  return new Promise((resolve, reject) => {
    const events = []

    execute(link, { query, variables }).subscribe({
      next: v => events.push(v),
      error: reject,
      complete: () => resolve(events)
    })
  })
}

describe('createMockLink', () => {
  // -- happy path: fixture found --

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

  it('passes operation variables to the fixture function', async () => {
    const fixtureFn = vi.fn().mockReturnValue({ widget: { id: '42' } })
    const registry = { widget: fixtureFn }
    const link = createMockLink(registry)

    await run(
      link,
      gql`
        query GetWidget($id: ID!) {
          widget(id: $id) {
            id
          }
        }
      `,
      { id: '42' }
    )

    expect(fixtureFn).toHaveBeenCalledWith({ id: '42' })
  })

  it('passes empty object to fixture when variables is undefined', async () => {
    const fixtureFn = vi.fn().mockReturnValue({ things: [] })
    const registry = { things: fixtureFn }
    const link = createMockLink(registry)

    await run(
      link,
      gql`
        query {
          things {
            id
          }
        }
      `,
      undefined
    )

    expect(fixtureFn).toHaveBeenCalledWith({})
  })

  it('passes empty object to fixture when variables is null', async () => {
    const fixtureFn = vi.fn().mockReturnValue({ things: [] })
    const registry = { things: fixtureFn }
    const link = createMockLink(registry)

    await run(
      link,
      gql`
        query {
          things {
            id
          }
        }
      `,
      null
    )

    expect(fixtureFn).toHaveBeenCalledWith({})
  })

  it('resolves a mutation by root field name', async () => {
    const registry = { sendMessage: vars => ({ sendMessage: { id: '1', text: vars.text } }) }
    const link = createMockLink(registry)

    const result = await run(
      link,
      gql`
        mutation SendMessage($text: String!) {
          sendMessage(text: $text) {
            id
            text
          }
        }
      `,
      { text: 'hello' }
    )

    expect(result.data).toEqual({ sendMessage: { id: '1', text: 'hello' } })
  })

  // -- missing fixture: WEB-T06-005 fix — returns error response --

  it('returns a graphQL errors array (not empty data) for an unmapped operation', async () => {
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

    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toContain('unknownThing')
    expect(result.data).toBeUndefined()
    warn.mockRestore()
  })

  it('includes the missing field name in the error message', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const link = createMockLink({})

    const result = await run(
      link,
      gql`
        query {
          missingField {
            id
          }
        }
      `,
      {}
    )

    expect(result.errors[0].message).toMatch(/missingField/)
    warn.mockRestore()
  })

  it('warns to the console for an unmapped operation', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const link = createMockLink({})

    await run(
      link,
      gql`
        query UnknownQ {
          noSuchField {
            id
          }
        }
      `,
      {}
    )

    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  // -- subscriptions: registry fixture returns an Observable --

  it('forwards subscription events from a fixture Observable', async () => {
    const registry = {
      ticker: () =>
        new Observable(observer => {
          observer.next({ data: { ticker: { t: 1 } } })
          observer.next({ data: { ticker: { t: 2 } } })
          observer.complete()
        })
    }

    const link = createMockLink(registry)

    const events = await collect(
      link,
      gql`
        subscription Ticker {
          ticker {
            t
          }
        }
      `,
      {}
    )

    expect(events).toHaveLength(2)
    expect(events[0].data).toEqual({ ticker: { t: 1 } })
    expect(events[1].data).toEqual({ ticker: { t: 2 } })
  })

  it('emits an error response for a subscription with no fixture', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const link = createMockLink({})

    const result = await run(
      link,
      gql`
        subscription Missing {
          missingThing {
            id
          }
        }
      `,
      {}
    )

    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toContain('missingThing')
    warn.mockRestore()
  })

  it('emits an error response when subscription fixture does not return an Observable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = { bad: () => ({ not: 'observable' }) }
    const link = createMockLink(registry)

    const result = await run(
      link,
      gql`
        subscription B {
          bad {
            x
          }
        }
      `,
      {}
    )

    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toContain('Observable')
    warn.mockRestore()
  })

  it('returns an error response when the root selection is an inline fragment (not a Field)', async () => {
    // An inline fragment at the root level causes getRootFieldName to return null
    // (selection.kind === 'InlineFragment', not 'Field') — covers the non-Field branch.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const link = createMockLink({})

    const result = await run(
      link,
      gql`
        query NoRootField {
          ... on Query {
            __typename
          }
        }
      `,
      {}
    )

    expect(result.errors).toBeDefined()
    warn.mockRestore()
  })
})
