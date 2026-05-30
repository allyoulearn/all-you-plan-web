<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--open': sidebarOpen }"
    :aria-hidden="!isVisible"
  >
    <!-- Brand + drawer close -->
    <div class="app-sidebar__brand">
      <!-- Wordmark -->
      <span class="app-sidebar__brand-text">
        all you <em>
          plan
        </em>
      </span>

      <!-- Mobile close button -->
      <button
        type="button"
        class="app-sidebar__close"
        :aria-label="t('common.closeMenu')"
        @click="toggleSidebar"
      >
        <AppIcon name="x" :size="18" />
      </button>
    </div>

    <!-- Primary nav -->
    <nav class="app-sidebar__nav">
      <!-- Nav groups -->
      <div v-for="group in navGroups" :key="group.label">
        <!-- Group heading -->
        <h3 class="app-sidebar__group-label">
          {{ group.labelKey ? t(group.labelKey) : group.label }}
        </h3>

        <!-- Group items -->
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          v-slot="{ href, navigate }"
          :to="item.to"
          custom
        >
          <a
            :href="href"
            class="app-sidebar__nav-item"
            :class="{ 'app-sidebar__nav-item--active': isItemActive(item.to) }"
            :title="item.labelKey ? t(item.labelKey) : item.label"
            @click="navigate"
          >
            <AppIcon :name="item.icon" :size="16" />

            <span class="app-sidebar__nav-label">
              {{ item.labelKey ? t(item.labelKey) : item.label }}
            </span>

            <span class="app-sidebar__nav-key">
              {{ item.key }}
            </span>
          </a>
        </RouterLink>
      </div>
    </nav>

    <!-- User identity footer -->
    <div class="app-sidebar__user">
      <!-- Avatar -->
      <span class="app-sidebar__avatar">
        {{ (auth.userName || avatarFallback).charAt(0).toUpperCase() }}
      </span>

      <!-- User name -->
      <span class="app-sidebar__user-name">
        {{ auth.userName || youFallback }}
      </span>
    </div>
  </aside>
</template>

<script>
/**
 * AppSidebar — persistent left navigation panel with brand, nav groups, and
 * user identity.
 *
 * Responsive modes:
 *   - <md  : hidden by default; slides in as a drawer when the top bar's
 *            hamburger toggles `sidebarOpen`.
 *   - md/lg: docked icon-only column. Labels collapse to icon-only via a
 *            CSS class so layout doesn't shift when the drawer state flips.
 *   - xl+  : docked full column with labels + nav shortcuts visible.
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { navGroups } from './navConfig.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useLayout } from '@/composables/useLayout.js'

export default {
  name: 'AppSidebar',
  components: { RouterLink, AppIcon },
  setup() {
    const auth = useAuthStore()
    const { t } = useI18n()
    const route = useRoute()
    const { sidebarOpen, toggleSidebar } = useLayout()

    // the fallback display name and avatar letter are routed
    // through i18n. The avatar letter is derived from the localized "You"
    // string so it stays consistent in any locale (e.g. "T" for "Tú").

    /** Localized fallback display name shown when the auth store has no userName. */
    const youFallback = computed(() => t('nav.youFallback'))
    /** First letter of the localized "You" fallback, used for the avatar glyph. */
    const avatarFallback = computed(() => (t('nav.youFallback') || 'U').charAt(0))

    /**
     * Whether the sidebar is on-screen for assistive tech (drives aria-hidden).
     * True when the mobile drawer is open or the viewport is wide enough to
     * dock the sidebar (md+).
     */
    const isVisible = computed(() => sidebarOpen.value || window.innerWidth >= 768)

    return {
      navGroups,
      auth,
      t,
      youFallback,
      avatarFallback,
      sidebarOpen,
      toggleSidebar,
      isVisible,
      isItemActive
    }

    // -- Function definitions --

    /**
     * Whether a nav item's `to` should render in the active state.
     *
     * The router is flat (`/projects`, `/projects/:id`, and
     * `/projects/:id/board` are siblings, not nested), so vue-router's
     * built-in `isActive` won't light up "Projects" while the user is on a
     * board. We do the path-prefix check ourselves so a Projects sub-route
     * still highlights its parent in the sidebar.
     *
     * The Today nav (`/`) is special: prefix matching against `/` would
     * highlight Today on every route, so we require an exact match there.
     */
    function isItemActive(to) {
      const path = route.path
      if (to === '/') return path === '/'
      return path === to || path.startsWith(to + '/')
    }
  }
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  // Mobile drawer: fixed-position panel slid off-screen until `--open`.
  // The transform/transition combo gives a snappy slide-in without
  // re-mounting the nav (state is preserved across opens).
  @apply fixed inset-y-0 left-0 z-30 flex h-screen w-[260px] -translate-x-full flex-col overflow-hidden border-r border-rule-soft bg-paper shadow-lg transition-transform duration-200;

  &--open {
    @apply translate-x-0;
  }

  // md: dock as a static icon-only column. Reset the fixed positioning,
  // shrink to 64px so only icons show, and drop the drawer shadow.
  @media (min-width: 768px) {
    @apply static z-auto w-16 translate-x-0 shadow-none;
  }

  // xl: expand back to the full label-bearing width.
  @media (min-width: 1280px) {
    @apply w-[232px];
  }

  &__brand {
    @apply flex items-baseline gap-2 px-[22px] pb-[18px] pt-[22px];

    @media (min-width: 768px) and (max-width: 1279px) {
      @apply px-2 pt-4 justify-center;
    }
  }

  &__brand-text {
    @apply font-serif text-[26px] italic leading-none tracking-[-0.01em] text-ink;

    // Collapse the multi-line brand to a single glyph in icon-only mode so
    // the column stays 64px wide without overflowing.
    @media (min-width: 768px) and (max-width: 1279px) {
      @apply text-[18px];

      // Hide everything but the first letter via a pseudo-trick: the
      // bracketed CSS keeps the text but visually clips to the first glyph.
      @apply overflow-hidden whitespace-nowrap;
      max-width: 1.2em;
    }
  }

  &__close {
    @apply ml-auto inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-paper-2 hover:text-ink;

    // The close button only makes sense for the drawer — once the sidebar
    // is docked there's nothing to close.
    @media (min-width: 768px) {
      @apply hidden;
    }
  }

  &__nav {
    @apply flex-1 overflow-y-auto py-2;
  }

  &__group-label {
    @apply px-5 pb-1.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted;

    // Hide group headings in icon-only mode — the icons themselves are
    // labels and the headings would only add noise.
    @media (min-width: 768px) and (max-width: 1279px) {
      @apply hidden;
    }
  }

  &__nav-item {
    @apply mx-2.5 my-px flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-ink transition-colors;

    &:not(&--active):hover {
      @apply bg-paper-3;
    }

    &--active {
      @apply font-medium;
      background-color: var(--ink);
      color: var(--paper);
    }

    @media (min-width: 768px) and (max-width: 1279px) {
      @apply mx-2 justify-center px-2 py-2.5;
    }
  }

  &__nav-label {
    @media (min-width: 768px) and (max-width: 1279px) {
      @apply hidden;
    }
  }

  &__nav-key {
    @apply ml-auto font-mono text-[10px] text-muted;

    @media (min-width: 768px) and (max-width: 1279px) {
      @apply hidden;
    }
  }

  &__user {
    @apply flex items-center gap-2.5 border-t border-rule-soft px-[22px] py-3.5 text-[13px];

    @media (min-width: 768px) and (max-width: 1279px) {
      @apply justify-center px-2;
    }
  }

  &__avatar {
    @apply grid h-8 w-8 place-items-center rounded-pill bg-accent text-[13px] font-semibold text-accent-ink;
  }

  &__user-name {
    @apply text-ink;

    @media (min-width: 768px) and (max-width: 1279px) {
      @apply hidden;
    }
  }
}
</style>
