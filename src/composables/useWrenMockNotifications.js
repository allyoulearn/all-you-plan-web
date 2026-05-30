/**
 * Mock-mode proactive Wren notifications.
 *
 * Fires a randomized Wren toast every `WREN_MOCK_NOTIFY_INTERVAL_MS` so the
 * mock build feels alive. Pauses while the tab is hidden so a user returning
 * after lunch is not blasted with a backlog of toasts.
 *
 * Only active when `import.meta.env.VITE_USE_MOCKS === 'true'` — calling this
 * outside mock mode is a no-op so consumers can mount it unconditionally.
 *
 * Returns:
 *   - current: ref of the active notification (or null when none on screen)
 *   - dismiss(): clear the current toast
 *   - start() / stop(): manual control if a consumer wants to pause
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { pickRandomNotification } from '@/mocks/fixtures/wrenNotifications.js'

const WREN_MOCK_NOTIFY_INTERVAL_MS = 30_000

// Show the very first toast a few seconds after mount so the user does not
// have to sit through a full interval before seeing anything.
const WREN_MOCK_NOTIFY_FIRST_MS = 4_000

export function useWrenMockNotifications() {
  const current = ref(null)
  let intervalId = null
  let firstFireTimeout = null
  let lastTypeId = null
  let mounted = false

  function isMockMode() {
    return import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'
  }

  function fire() {
    if (document.hidden) return
    const next = pickRandomNotification(lastTypeId)
    lastTypeId = next.id

    current.value = {
      ...next,
      // Unique key per fire so Vue treats each toast as a fresh node — drives
      // the enter/exit transition reliably even when consecutive toasts share
      // the same type id.
      key: `${next.id}-${Date.now()}`,
      firedAt: Date.now()
    }
  }

  function dismiss() {
    current.value = null
  }

  function start() {
    if (!isMockMode() || intervalId !== null) return

    // First fire after a short delay so the toast feels reactive to load.
    firstFireTimeout = setTimeout(fire, WREN_MOCK_NOTIFY_FIRST_MS)
    intervalId = setInterval(fire, WREN_MOCK_NOTIFY_INTERVAL_MS)
  }

  function stop() {
    if (firstFireTimeout) {
      clearTimeout(firstFireTimeout)
      firstFireTimeout = null
    }

    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function onVisibilityChange() {
    if (!mounted) return

    if (document.hidden) {
      stop()
    } else {
      start()
    }
  }

  onMounted(() => {
    mounted = true
    if (!isMockMode()) return
    document.addEventListener('visibilitychange', onVisibilityChange)
    start()
  })

  onBeforeUnmount(() => {
    mounted = false
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stop()
  })

  return { current, dismiss, start, stop }
}
