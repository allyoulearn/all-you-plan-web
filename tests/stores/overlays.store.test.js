import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOverlaysStore } from '@/stores/overlays.store'

describe('overlays.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with both overlays closed', () => {
      const store = useOverlaysStore()
      expect(store.searchOpen).toBe(false)
      expect(store.captureOpen).toBe(false)
      expect(store.captureSeed).toBe('')
    })
  })

  describe('openSearch()', () => {
    it('opens search and forces capture closed', () => {
      const store = useOverlaysStore()
      store.captureOpen = true
      store.openSearch()
      expect(store.searchOpen).toBe(true)
      expect(store.captureOpen).toBe(false)
    })
  })

  describe('closeSearch()', () => {
    it('closes search without touching capture', () => {
      const store = useOverlaysStore()
      store.searchOpen = true
      store.captureOpen = false
      store.closeSearch()
      expect(store.searchOpen).toBe(false)
    })
  })

  describe('openCapture()', () => {
    it('opens capture, sets seed, and forces search closed', () => {
      const store = useOverlaysStore()
      store.searchOpen = true
      store.openCapture('walk the dog')
      expect(store.captureOpen).toBe(true)
      expect(store.captureSeed).toBe('walk the dog')
      expect(store.searchOpen).toBe(false)
    })

    it('defaults seed to empty string when called with no args', () => {
      const store = useOverlaysStore()
      store.openCapture()
      expect(store.captureOpen).toBe(true)
      expect(store.captureSeed).toBe('')
    })
  })

  describe('closeCapture()', () => {
    it('closes capture and clears seed', () => {
      const store = useOverlaysStore()
      store.openCapture('seed text')
      store.closeCapture()
      expect(store.captureOpen).toBe(false)
      expect(store.captureSeed).toBe('')
    })
  })
})
