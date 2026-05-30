<template>
  <div class="app-shell" :class="{ 'app-shell--wren-collapsed': wrenCollapsed }">
    <AppSidebar />

    <main class="app-shell__main">
      <AppTopBar />

      <div
        class="app-shell__content"
        :class="{ 'app-shell__content--full': $route.meta.fullWidth }"
      >
        <RouterView />
      </div>
    </main>

    <WrenPanel />

    <SearchOverlay />

    <CaptureOverlay />

    <!-- Mock-mode only: fires a proactive Wren toast every 30s. Renders a no-op
         outside mock mode because the composable guards on VITE_USE_MOCKS. -->
    <WrenMockNotificationToast
      v-if="mockMode"
      :notification="mockNotification"
      :wren-open="wrenOpen"
      :wren-collapsed="wrenCollapsed"
      @dismiss="dismissMockNotification"
    />

    <!-- Drawer scrim — covers content and dismisses any open drawer. Pointer
         events stay off while both drawers are closed so the underlying view
         is interactive at every breakpoint. -->
    <button
      type="button"
      class="app-shell__scrim"
      :class="{ 'app-shell__scrim--visible': sidebarOpen || wrenOpen }"
      :aria-hidden="!(sidebarOpen || wrenOpen)"
      :tabindex="sidebarOpen || wrenOpen ? 0 : -1"
      :aria-label="t('common.closeMenu')"
      @click="closeAll"
    />
  </div>
</template>

<script>
/**
 * AppShell — root layout grid that composes sidebar, main content area, and
 * Wren panel.
 *
 * Breakpoints (mobile-first):
 *   - default (<768): single column; sidebar and Wren slide in as drawers
 *     triggered from the top bar.
 *   - md (≥768): icon-only sidebar + content; Wren still a drawer.
 *   - lg (≥1024): icon-only sidebar + content + Wren panel.
 *   - xl (≥1280): full sidebar + content + Wren panel.
 *
 * The sidebar and Wren panel still render at every breakpoint — they switch
 * between "fixed drawer" and "in-grid column" via CSS only. That keeps state
 * (open conversations, scroll positions) intact across viewport changes.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import WrenPanel from './WrenPanel.vue'
import SearchOverlay from '@/components/overlays/SearchOverlay.vue'
import CaptureOverlay from '@/components/overlays/CaptureOverlay.vue'
import WrenMockNotificationToast from '@/components/wren/WrenMockNotificationToast.vue'
import { useWrenSync } from '@/composables/useWrenSync.js'
import { useLayout, useCloseDrawersOnRouteChange } from '@/composables/useLayout.js'
import { useWrenMockNotifications } from '@/composables/useWrenMockNotifications.js'
import { useOverlaysStore } from '@/stores/overlays.store.js'

export default {
  name: 'AppShell',
  components: {
    RouterView,
    AppSidebar,
    AppTopBar,
    WrenPanel,
    SearchOverlay,
    CaptureOverlay,
    WrenMockNotificationToast
  },
  setup() {
    const { t } = useI18n()
    useWrenSync()
    useCloseDrawersOnRouteChange()
    const { sidebarOpen, wrenOpen, wrenCollapsed, closeAll } = useLayout()
    const overlays = useOverlaysStore()
    // Active in mock mode only — the composable returns a null `current` and
    // sets up no timers when VITE_USE_MOCKS is off, so this stays cheap in
    // real builds. The `mockMode` flag is just a render guard to keep the
    // component tree out of the DOM entirely in production.
    const mockMode = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'

    const { current: mockNotification, dismiss: dismissMockNotification } =
      useWrenMockNotifications()

    onMounted(() => window.addEventListener('keydown', onKey))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

    return {
      t,
      sidebarOpen,
      wrenOpen,
      wrenCollapsed,
      closeAll,
      mockMode,
      mockNotification,
      dismissMockNotification
    }

    // -- Function definitions --

    /**
     * Global keyboard shortcut handler.
     * - Cmd/Ctrl+K toggles the search overlay.
     * - Cmd/Ctrl+Shift+Space toggles the capture overlay.
     *
     * @param {KeyboardEvent} e - The keydown event.
     */
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return

      // Cmd+K opens search
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        if (overlays.searchOpen) overlays.closeSearch()
        else overlays.openSearch()
        return
      }

      // Cmd+Shift+Space opens capture
      if (e.shiftKey && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault()
        if (overlays.captureOpen) overlays.closeCapture()
        else overlays.openCapture()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-shell {
  // Default (mobile-first): main content takes the full width. Sidebar and
  // Wren overlay the content as drawers — see their components for the
  // slide-in behaviour. One column means main has all the room while both
  // panels are absolutely positioned overlays.
  @apply relative grid h-screen overflow-hidden bg-paper;
  grid-template-columns: 1fr;

  // md: icon sidebar docks into a fixed-width column to the left of main.
  @media (min-width: 768px) {
    grid-template-columns: 64px 1fr;
  }

  // lg: Wren joins the grid as a persistent right column.
  @media (min-width: 1024px) {
    grid-template-columns: 64px 1fr 320px;
  }

  // xl: Full sidebar widens to bring labels back.
  @media (min-width: 1280px) {
    grid-template-columns: 232px 1fr 360px;
  }

  // When the user collapses the docked Wren panel, drop the rightmost column
  // so main reclaims the space instead of leaving a 320/360px gap. The panel
  // itself hides via its own modifier; this just adjusts the grid track list.
  &--wren-collapsed {
    @media (min-width: 1024px) {
      grid-template-columns: 64px 1fr;
    }

    @media (min-width: 1280px) {
      grid-template-columns: 232px 1fr;
    }
  }

  &__main {
    @apply flex flex-col overflow-y-auto bg-paper;
  }

  &__content {
    // Tighter horizontal padding on phones, restore breathing room on md+.
    // No global max-width — views take the full main column so collapsing
    // the Wren panel actually reclaims usable space rather than just adding
    // empty gutters on either side. Views that need a reading-width cap on
    // a specific section (long-form text, narrow forms) apply that locally
    // via their own internal max-width rules.
    @apply mx-auto w-full px-4 pb-16 pt-4;

    @media (min-width: 768px) {
      @apply px-7 pb-20 pt-7;
    }

    // Routes that set `meta.fullWidth: true` turn the content into a flex
    // column that fills the main scroll area — this lets the view's own
    // children (a kanban board frame, for instance) `flex: 1` to reach the
    // bottom of the viewport without hardcoded min-height math. Width-wise
    // it's the same as the default now that the global cap is gone. The
    // bottom padding is trimmed so the view's own surface reaches close to
    // the viewport edge — these routes (board, calendar week, wren chat)
    // are intentionally edge-to-edge.
    &--full {
      @apply flex flex-1 flex-col pb-4;
      min-height: 0;

      @media (min-width: 768px) {
        @apply pb-6;
      }
    }
  }

  &__scrim {
    // Full-viewport dismiss surface for open drawers. The button is always in
    // the DOM but only becomes interactive (and visible) when a drawer is
    // open — keeps the dismiss affordance reachable by keyboard. Tailwind's
    // colour-with-opacity syntax (`bg-ink/40`) doesn't compose with CSS-var
    // colour tokens, so we set background via color-mix directly.
    @apply pointer-events-none fixed inset-0 z-20 opacity-0 transition-opacity;
    background-color: color-mix(in oklab, var(--ink) 40%, transparent);

    &--visible {
      @apply pointer-events-auto opacity-100;
    }

    // Scrim has no purpose once the static grid takes over — Wren and the
    // sidebar are persistent columns, not drawers.
    @media (min-width: 1280px) {
      @apply hidden;
    }
  }
}
</style>
