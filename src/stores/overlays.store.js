/**
 * Overlays store. Single source of truth for whether the search palette or
 * the quick-capture sheet is open. Components dispatch open/close through
 * here so global keyboard shortcuts (⌘K, ⌘⇧Space) and the topbar buttons
 * stay in sync.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOverlaysStore = defineStore('overlays', () => {
  const searchOpen = ref(false)
  const captureOpen = ref(false)
  const captureSeed = ref('')

  /** Open the search palette and dismiss any open capture sheet. */
  function openSearch() {
    searchOpen.value = true
    captureOpen.value = false
  }

  /** Close the search palette. */
  function closeSearch() {
    searchOpen.value = false
  }

  /**
   * Open the quick-capture sheet, optionally pre-filled with `seed` text.
   * Also dismisses the search palette so only one overlay shows at a time.
   * @param {string} [seed]
   */
  function openCapture(seed = '') {
    captureSeed.value = seed
    captureOpen.value = true
    searchOpen.value = false
  }

  /** Close the quick-capture sheet and clear any pre-filled seed text. */
  function closeCapture() {
    captureOpen.value = false
    captureSeed.value = ''
  }

  return {
    searchOpen,
    captureOpen,
    captureSeed,
    openSearch,
    closeSearch,
    openCapture,
    closeCapture
  }
})
