import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useWrenSync } from '@/composables/useWrenSync.js'
import { useWrenStore } from '@/stores/wren.store'
import { useTodayStore } from '@/stores/today.store'
import { useProjectsStore } from '@/stores/projects.store'
import { useChoresStore } from '@/stores/chores.store'
import { useCalendarStore } from '@/stores/calendar.store'
import { useJournalStore } from '@/stores/journal.store'
import { useInboxStore } from '@/stores/inbox.store'

vi.mock('@/api/apollo.js', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}))

vi.mock('@/composables/useErrorToast.js', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

/**
 * Mount useWrenSync inside a minimal component so the watch() effect attaches
 * to a real component lifecycle.
 */
function mountSync() {
  return mount({
    setup() {
      useWrenSync()
      return {}
    },
    template: '<div />'
  })
}

async function triggerAction(action) {
  const wren = useWrenStore()
  wren.lastAction = action
  await nextTick()
}

describe('useWrenSync', () => {
  let wren, today, projects, chores, calendar, journal, inbox

  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    wren = useWrenStore()
    today = useTodayStore()
    projects = useProjectsStore()
    chores = useChoresStore()
    calendar = useCalendarStore()
    journal = useJournalStore()
    inbox = useInboxStore()

    today.load = vi.fn().mockResolvedValue(undefined)
    projects.loadBoard = vi.fn().mockResolvedValue(undefined)
    projects.loadProjects = vi.fn().mockResolvedValue(undefined)
    chores.load = vi.fn().mockResolvedValue(undefined)
    calendar.load = vi.fn().mockResolvedValue(undefined)
    journal.load = vi.fn().mockResolvedValue(undefined)
    inbox.load = vi.fn().mockResolvedValue(undefined)

    wren.lastAction = null
  })

  it('does nothing when lastAction has no refType', async () => {
    mountSync()
    await triggerAction({})
    expect(today.load).not.toHaveBeenCalled()
    expect(projects.loadBoard).not.toHaveBeenCalled()
    expect(chores.load).not.toHaveBeenCalled()
  })

  it('does nothing when lastAction is null', async () => {
    mountSync()
    await triggerAction(null)
    expect(today.load).not.toHaveBeenCalled()
  })

  describe('refType=task', () => {
    it('reloads today when today.view is hydrated', async () => {
      today.view = { date: '2026-05-25' }
      mountSync()
      await triggerAction({ refType: 'task' })
      expect(today.load).toHaveBeenCalledWith('2026-05-25')
    })

    it('reloads project board when projects.board is hydrated', async () => {
      projects.board = { project: { id: 'p1' } }
      mountSync()
      await triggerAction({ refType: 'task' })
      expect(projects.loadBoard).toHaveBeenCalledWith('p1')
    })

    it('does not reload today when today.view is empty', async () => {
      today.view = null
      mountSync()
      await triggerAction({ refType: 'task' })
      expect(today.load).not.toHaveBeenCalled()
    })
  })

  describe('refType=project', () => {
    it('reloads project list when projects.projects is non-empty', async () => {
      projects.projects = [{ id: 'p1' }]
      mountSync()
      await triggerAction({ refType: 'project' })
      expect(projects.loadProjects).toHaveBeenCalled()
    })

    it('reloads board when projects.board is open', async () => {
      projects.board = { project: { id: 'p2' } }
      mountSync()
      await triggerAction({ refType: 'project' })
      expect(projects.loadBoard).toHaveBeenCalledWith('p2')
    })

    it('does nothing when neither list nor board are loaded', async () => {
      projects.projects = []
      projects.board = null
      mountSync()
      await triggerAction({ refType: 'project' })
      expect(projects.loadProjects).not.toHaveBeenCalled()
      expect(projects.loadBoard).not.toHaveBeenCalled()
    })
  })

  describe('refType=chore', () => {
    it('reloads chores when chores list is hydrated', async () => {
      chores.chores = [{ id: 'c1' }]
      mountSync()
      await triggerAction({ refType: 'chore' })
      expect(chores.load).toHaveBeenCalled()
    })

    it('reloads chores when chores.loading is true', async () => {
      chores.chores = []
      chores.loading = true
      mountSync()
      await triggerAction({ refType: 'chore' })
      expect(chores.load).toHaveBeenCalled()
    })

    it('does not reload chores when store is cold', async () => {
      chores.chores = []
      chores.loading = false
      mountSync()
      await triggerAction({ refType: 'chore' })
      expect(chores.load).not.toHaveBeenCalled()
    })
  })

  describe('refType=calendar_event', () => {
    it('reloads calendar when events are present', async () => {
      calendar.events = [{ id: 'e1' }]
      mountSync()
      await triggerAction({ refType: 'calendar_event' })
      expect(calendar.load).toHaveBeenCalled()
    })

    it('does not reload calendar when store is cold', async () => {
      calendar.events = []
      calendar.loading = false
      mountSync()
      await triggerAction({ refType: 'calendar_event' })
      expect(calendar.load).not.toHaveBeenCalled()
    })
  })

  describe('refType=journal_entry', () => {
    it('reloads journal when entries are present', async () => {
      journal.entries = [{ id: 'j1' }]
      mountSync()
      await triggerAction({ refType: 'journal_entry' })
      expect(journal.load).toHaveBeenCalled()
    })

    it('does not reload journal when store is cold', async () => {
      journal.entries = []
      journal.loading = false
      mountSync()
      await triggerAction({ refType: 'journal_entry' })
      expect(journal.load).not.toHaveBeenCalled()
    })
  })

  describe('refType=inbox_item', () => {
    it('reloads inbox when items are present', async () => {
      inbox.items = [{ id: 'i1' }]
      mountSync()
      await triggerAction({ refType: 'inbox_item' })
      expect(inbox.load).toHaveBeenCalled()
    })

    it('does not reload inbox when store is cold', async () => {
      inbox.items = []
      inbox.loading = false
      mountSync()
      await triggerAction({ refType: 'inbox_item' })
      expect(inbox.load).not.toHaveBeenCalled()
    })
  })

  it('ignores unknown refType values', async () => {
    today.view = { date: '2026-05-25' }
    projects.projects = [{ id: 'p1' }]
    chores.chores = [{ id: 'c1' }]
    calendar.events = [{ id: 'e1' }]
    journal.entries = [{ id: 'j1' }]
    inbox.items = [{ id: 'i1' }]
    mountSync()
    await triggerAction({ refType: 'something_new' })
    expect(today.load).not.toHaveBeenCalled()
    expect(projects.loadProjects).not.toHaveBeenCalled()
    expect(chores.load).not.toHaveBeenCalled()
    expect(calendar.load).not.toHaveBeenCalled()
    expect(journal.load).not.toHaveBeenCalled()
    expect(inbox.load).not.toHaveBeenCalled()
  })

  it('swallows rejections from store reloads (fire-and-forget)', async () => {
    today.view = { date: '2026-05-25' }
    today.load = vi.fn().mockRejectedValue(new Error('reload failed'))
    mountSync()
    await expect(triggerAction({ refType: 'task' })).resolves.toBeUndefined()
  })
})
