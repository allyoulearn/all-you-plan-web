/**
 * Layout state.
 *
 * Module-scoped reactive state for the shell's panel affordances:
 *   - `sidebarOpen` / `wrenOpen` control the slide-in drawers below lg
 *   - `wrenCollapsed` hides the docked Wren column at lg+ (persisted)
 *
 * The static dock at lg+ and the slide-in drawer below lg are CSS-driven —
 * `wrenOpen` only matters when the panel is acting as a drawer, and
 * `wrenCollapsed` only matters once it has docked. `toggleWren()` picks the
 * right one based on the current viewport so the top-bar button works at
 * every breakpoint without the caller knowing which mode the panel is in.
 *
 * Lives at module scope (not Pinia) because it's purely UI ephemera and
 * AppShell / AppSidebar / WrenPanel / AppTopBar all read the same instance
 * without ceremony.
 */
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const sidebarOpen = ref(false)
const wrenOpen = ref(false)

/** localStorage key for the user's preference on the docked Wren panel. */
const WREN_COLLAPSED_KEY = 'ayp_wren_collapsed'

/**
 * Read the persisted collapse preference. Returns false on any read failure
 * (private mode, quota, etc.) so first-time users see the panel by default.
 * @returns {boolean}
 */
function readWrenCollapsed() {
  try {
    return localStorage.getItem(WREN_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

const wrenCollapsed = ref(readWrenCollapsed())

// Mirror the preference back to localStorage so the user's choice survives a
// page refresh. Storage write failures are silent — the in-session value still
// works; only the next reload would lose it.
watch(wrenCollapsed, val => {
  try {
    localStorage.setItem(WREN_COLLAPSED_KEY, String(val))
  } catch {
    /* no-op */
  }
})

/** Tailwind's lg breakpoint, mirrored here so the JS dispatch matches CSS. */
const LG_BREAKPOINT = 1024

/**
 * Composable returning the shared panel state plus toggle helpers.
 * @returns {{
 *   sidebarOpen: import('vue').Ref<boolean>,
 *   wrenOpen: import('vue').Ref<boolean>,
 *   wrenCollapsed: import('vue').Ref<boolean>,
 *   toggleSidebar: () => void,
 *   toggleWren: () => void,
 *   closeAll: () => void
 * }}
 */
export function useLayout() {
  return {
    sidebarOpen,
    wrenOpen,
    wrenCollapsed,
    /** Toggle the sidebar drawer. */
    toggleSidebar() {
      sidebarOpen.value = !sidebarOpen.value
    },
    /**
     * Toggle the Wren panel. At lg+ the panel is docked into the grid so the
     * toggle hides / shows the dock and persists the choice. Below lg the
     * panel is a slide-in drawer, so the toggle just flips the drawer flag.
     */
    toggleWren() {
      if (typeof window !== 'undefined' && window.innerWidth >= LG_BREAKPOINT) {
        wrenCollapsed.value = !wrenCollapsed.value
      } else {
        wrenOpen.value = !wrenOpen.value
      }
    },
    /** Close every open drawer. */
    closeAll() {
      sidebarOpen.value = false
      wrenOpen.value = false
    }
  }
}

/**
 * Convenience helper used by the shell to auto-close any open drawer on
 * route change — without this, tapping a sidebar nav link on mobile
 * navigates but leaves the drawer overlay covering the new view.
 *
 * Must be called from a component setup so the watcher is torn down on
 * unmount.
 */
export function useCloseDrawersOnRouteChange() {
  const route = useRoute()

  watch(
    () => route.fullPath,
    () => {
      sidebarOpen.value = false
      wrenOpen.value = false
    }
  )
}
