<template>
  <header class="app-top-bar">
    <span class="app-top-bar__crumbs">
      {{ crumbs }}
    </span>

    <span class="app-top-bar__spacer" />

    <span class="app-top-bar__date">
      {{ today }}
    </span>

    <IconButton icon="search" :size="34" aria-label="Search" />

    <IconButton icon="plus" :size="34" aria-label="Add" />

    <IconButton
      :icon="mode === 'dark' ? 'sun' : 'moon'"
      :size="34"
      aria-label="Toggle dark mode"
      @click="toggleMode"
    />
  </header>
</template>

<script>
/** AppTopBar — sticky top navigation bar showing breadcrumbs, current date, and action buttons. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import { useTheme } from '@/composables/useTheme.js'

export default {
  name: 'AppTopBar',
  components: { IconButton },
  setup() {
    // -- State --
    const route = useRoute()
    const { mode, toggleMode } = useTheme()

    // -- Computed --

    /** Breadcrumb string built from the current route's meta.crumbs array */
    const crumbs = computed(() => (route.meta.crumbs || ['all you plan']).join(' · '))

    /** Today's date formatted as a human-readable string */
    const today = computed(() =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    )

    return { crumbs, today, mode, toggleMode }
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
