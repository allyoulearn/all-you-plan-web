<template>
  <header class="app-top-bar">
    <span class="app-top-bar__crumbs">
      {{ crumbs }}
    </span>

    <span class="app-top-bar__spacer" />

    <span class="app-top-bar__date">
      {{ today }}
    </span>

    <!--
      Search and Add are placeholder affordances (no handler yet). Marked
      disabled per the convention from WEB-T08-016 so they don't appear
      interactive (WEB-W3-11). Wire up + remove disabled when the features
      land. Aria-labels route through i18n via common.* keys.
    -->
    <IconButton
      icon="search"
      :size="34"
      :aria-label="t('common.search')"
      disabled
    />

    <IconButton
      icon="plus"
      :size="34"
      :aria-label="t('common.add')"
      disabled
    />

    <IconButton
      :icon="mode === 'dark' ? 'sun' : 'moon'"
      :size="34"
      :aria-label="t('common.toggleDarkMode')"
      @click="toggleMode"
    />
  </header>
</template>

<script>
/** AppTopBar — sticky top navigation bar showing breadcrumbs, current date, and action buttons. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/ui/IconButton.vue'
import { useTheme } from '@/composables/useTheme.js'

export default {
  name: 'AppTopBar',
  components: { IconButton },
  setup() {
    // -- State --
    const route = useRoute()
    const { mode, toggleMode } = useTheme()
    const { t } = useI18n()

    // -- Computed --

    /**
     * Breadcrumb string built from the current route's meta.crumbs array.
     * When a route has no crumbs we render an empty string instead of the
     * duplicated brand label that already appears in the sidebar (WEB-W3-12).
     */
    const crumbs = computed(() => (route.meta.crumbs || []).join(' · '))

    /** Today's date formatted as a human-readable string */
    const today = computed(() =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    )

    return { crumbs, today, mode, toggleMode, t }
  }
}
</script>

<style lang="scss" scoped>
.app-top-bar {
  @apply sticky top-0 z-10 flex items-center gap-3.5 bg-paper px-8 py-4;

  &__crumbs {
    @apply text-[13px] text-muted;
  }

  &__spacer {
    @apply flex-1;
  }

  &__date {
    @apply text-[13px] text-muted;
  }
}
</style>
