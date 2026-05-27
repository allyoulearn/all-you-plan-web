import { describe, it, expect } from 'vitest'
import { composeSendoff } from '@/components/review/sendoffComposer.js'

describe('composeSendoff', () => {
  const base = {
    mood: 'steady',
    doneCount: 3,
    totalCount: 5,
    streak: 1,
    topWinTitle: '',
    tomorrowIntent: '',
    frictionTagCount: 0
  }

  it('returns a headline and body for every supported mood', () => {
    for (const mood of ['heavy', 'low', 'steady', 'good', 'lit']) {
      const out = composeSendoff({ ...base, mood })
      expect(typeof out.headline).toBe('string')
      expect(out.headline.length).toBeGreaterThan(0)
      expect(typeof out.body).toBe('string')
      expect(out.body.length).toBeGreaterThan(0)
    }
  })

  it('mentions the top win when one is provided and completion is partial', () => {
    const out = composeSendoff({
      ...base,
      mood: 'steady',
      doneCount: 3,
      totalCount: 5,
      topWinTitle: 'Mentor call prep'
    })
    expect(out.body).toContain('Mentor call prep')
  })

  it('mentions tomorrow intent when present', () => {
    const out = composeSendoff({
      ...base,
      tomorrowIntent: 'blog draft'
    })
    expect(out.body).toContain('blog draft')
  })

  it('does not mention an intent when the intent string is empty or whitespace', () => {
    const out = composeSendoff({ ...base, tomorrowIntent: '   ' })
    expect(out.body).not.toMatch(/tomorrow you said/i)
  })

  it('mentions streak only when streak is >= 3', () => {
    const low = composeSendoff({ ...base, streak: 2 })
    expect(low.body).not.toMatch(/days/i)

    const high = composeSendoff({ ...base, streak: 5 })
    expect(high.body).toMatch(/5 days/i)
  })

  it('uses an "all done" voice when doneCount equals totalCount and totalCount > 0', () => {
    const out = composeSendoff({
      ...base,
      mood: 'lit',
      doneCount: 4,
      totalCount: 4
    })
    expect(out.headline.toLowerCase()).not.toContain('some days')
    expect(out.body.toLowerCase()).toMatch(/everything|all of it|the whole list/)
  })

  it('uses a "nothing done" voice when doneCount is 0 and totalCount > 0', () => {
    const out = composeSendoff({
      ...base,
      mood: 'heavy',
      doneCount: 0,
      totalCount: 4
    })
    expect(out.body.toLowerCase()).toMatch(/some days|the day won|tomorrow is a clean page/)
  })

  it('handles an empty day (totalCount = 0) without crashing', () => {
    const out = composeSendoff({ ...base, doneCount: 0, totalCount: 0 })
    expect(typeof out.headline).toBe('string')
    expect(typeof out.body).toBe('string')
  })

  it('returns deterministic output for identical input', () => {
    const a = composeSendoff(base)
    const b = composeSendoff(base)
    expect(a).toEqual(b)
  })

  it('strips a trailing period from the intent so the appended sentence does not double-punctuate', () => {
    const out = composeSendoff({ ...base, tomorrowIntent: 'Finish the blog draft.' })
    expect(out.body).toContain('Finish the blog draft. ')
    expect(out.body).not.toContain('Finish the blog draft.. ')
  })

  it('strips a trailing period from the top win as well', () => {
    const out = composeSendoff({
      ...base,
      mood: 'steady',
      doneCount: 3,
      totalCount: 5,
      topWinTitle: 'Mentor call prep.'
    })
    expect(out.body).toContain('Mentor call prep mattered.')
  })
})
