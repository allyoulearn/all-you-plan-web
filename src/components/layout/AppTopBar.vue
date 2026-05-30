<template>
  <header class="app-top-bar">
    <!-- Hamburger: opens the sidebar drawer below xl. Persistent docked
         sidebar takes over at xl+, so the button disappears there. -->
    <AppIconButton
      icon="menu"
      :size="34"
      class="app-top-bar__menu-btn"
      :aria-label="t('common.openMenu')"
      @click="toggleSidebar"
    />

    <nav class="app-top-bar__crumbs" :aria-label="t('common.breadcrumb')">
      <template v-for="(c, idx) in crumbs" :key="c.label + idx">
        <span v-if="idx > 0" class="app-top-bar__crumb-sep" aria-hidden="true">
          ·
        </span>

        <RouterLink
          v-if="c.to && idx < crumbs.length - 1"
          :to="c.to"
          class="app-top-bar__crumb app-top-bar__crumb--link"
        >
          {{ c.label }}
        </RouterLink>

        <span v-else class="app-top-bar__crumb">
          {{ c.label }}
        </span>
      </template>
    </nav>

    <span class="app-top-bar__spacer" />

    <span class="app-top-bar__date">
      {{ today }}
    </span>

    <!--
      Search and Add are placeholder affordances (no handler yet). Marked
      disabled per the convention from WEB-T08-016 so they don't appear
      interactive. Hidden below sm so the top bar stays usable
      on narrow phones — the affordances will still be reachable at md+.
    -->
    <AppIconButton
      icon="search"
      :size="34"
      class="app-top-bar__optional-btn"
      :aria-label="t('common.search')"
      :title="$t('search.tooltip')"
      @click="overlays.openSearch"
    />

    <AppIconButton
      icon="plus"
      :size="34"
      class="app-top-bar__optional-btn"
      :aria-label="t('common.add')"
      :title="$t('capture.tooltip')"
      @click="overlays.openCapture()"
    />

    <AppIconButton
      :icon="mode === 'dark' ? 'sun' : 'moon'"
      :size="34"
      :aria-label="t('common.toggleDarkMode')"
      @click="toggleMode"
    />

    <!-- Wren toggle: opens the Wren drawer below lg. Persistent docked panel
         takes over at lg+. -->
    <AppIconButton
      icon="sparkles"
      :size="34"
      class="app-top-bar__wren-btn"
      :aria-label="t('common.openWren')"
      @click="toggleWren"
    />
  </header>
</template>

<script>
/** AppTopBar — sticky top navigation bar showing breadcrumbs, current date,
 *  and action buttons. The leftmost hamburger opens the sidebar drawer on
 *  narrow viewports; the rightmost sparkles opens the Wren drawer. */
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import { useTheme } from '@/composables/useTheme.js'
import { useLayout } from '@/composables/useLayout.js'
import { useOverlaysStore } from '@/stores/overlays.store.js'

/**
 * Maps each known breadcrumb label to the route it should navigate to when
 * clicked. Labels NOT in the map render as plain text (categories like
 * "Workspaces" don't have a single target — they're just grouping). The last
 * crumb in the trail also stays plain text because it represents the current
 * page (no point linking to where you already are).
 */
const CRUMB_TARGETS = {
  Today: '/',
  Goals: '/goals',
  Chores: '/chores',
  Projects: '/projects',
  Calendar: '/calendar',
  Stats: '/stats',
  Journal: '/journal',
  Inbox: '/inbox',
  Chat: '/wren',
  'Daily review': '/review',
  Settings: '/settings'
}

export default {
  name: 'AppTopBar',
  components: { AppIconButton, RouterLink },
  setup() {
    // -- State --
    const route = useRoute()
    const { mode, toggleMode } = useTheme()
    const { t } = useI18n()
    const { toggleSidebar, toggleWren } = useLayout()
    const overlays = useOverlaysStore()

    // -- Computed --

    /**
     * Breadcrumb trail built from `route.meta.crumbs`. Each entry carries a
     * label plus an optional `to` derived from CRUMB_TARGETS — the template
     * renders the link form only when both `to` is set AND the crumb isn't
     * the last one (so the current-page crumb is plain text).
     */
    const crumbs = computed(() =>
      (route.meta.crumbs || []).map(label => ({
        label,
        to: CRUMB_TARGETS[label] ?? null
      }))
    )

    /** Today's date formatted as a human-readable string */
    const today = computed(() =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    )

    return { crumbs, today, mode, toggleMode, t, toggleSidebar, toggleWren, overlays }
  }
}
</script>

<style lang="scss" scoped>
.app-top-bar {
  // Tighter horizontal padding on phones; original 32px breathing room at md+.
  @apply sticky top-0 z-10 flex items-center gap-2 bg-paper px-3 py-3;

  @media (min-width: 768px) {
    @apply gap-3.5 px-8 py-4;
  }

  &__menu-btn {
    // Hamburger is only useful while the sidebar is a drawer. At xl+ the
    // sidebar docks permanently.
    @media (min-width: 1280px) {
      @apply hidden;
    }
  }

  // Wren toggle stays visible at every breakpoint. Below lg it opens / closes
  // the drawer; at lg+ it collapses / restores the docked column (see
  // useLayout.toggleWren — dispatch happens there based on viewport width).

  &__optional-btn {
    // Hide the placeholder search/add buttons on very narrow viewports so the
    // bar doesn't wrap or push the date out of view.
    @apply hidden;

    @media (min-width: 768px) {
      @apply inline-grid;
    }
  }

  &__crumbs {
    // Truncate breadcrumbs rather than wrap — the full route is visible in
    // the sidebar and the URL itself, this line is just a hint.
    @apply flex min-w-0 flex-1 items-center gap-1.5 truncate text-[13px] text-muted;
  }

  &__crumb {
    @apply truncate;

    &--link {
      @apply transition-colors hover:text-ink;
    }
  }

  &__crumb-sep {
    @apply text-muted;
  }

  &__spacer {
    @apply flex-1;

    // The crumbs already eat any leftover space on small screens (flex-1
    // there); the dedicated spacer is only needed once the date and action
    // buttons want to push to the right of a comfortable layout.
    @apply hidden md:block;
  }

  &__date {
    @apply hidden text-[13px] text-muted md:inline;
  }
}
</style>
