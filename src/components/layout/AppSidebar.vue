<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__brand">
      <span class="app-sidebar__brand-text">
        all you <em>
          plan
        </em>
      </span>
    </div>

    <nav class="app-sidebar__nav">
      <div v-for="group in navGroups" :key="group.label">
        <p class="app-sidebar__group-label">
          {{ group.label }}
        </p>

        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="app-sidebar__nav-item"
          active-class="app-sidebar__nav-item--active"
        >
          <Icon :name="item.icon" :size="16" />

          <span>
            {{ item.label }}
          </span>

          <span class="app-sidebar__nav-key">
            {{ item.key }}
          </span>
        </RouterLink>
      </div>
    </nav>

    <div class="app-sidebar__user">
      <span class="app-sidebar__avatar">
        {{ (auth.userName || 'U').charAt(0).toUpperCase() }}
      </span>

      <span class="app-sidebar__user-name">
        {{ auth.userName || 'You' }}
      </span>
    </div>
  </aside>
</template>

<script>
/** AppSidebar — persistent left navigation panel with brand, nav groups, and user identity. */
import { RouterLink } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import { navGroups } from './navConfig.js'
import { useAuthStore } from '@/stores/auth.store.js'

export default {
  name: 'AppSidebar',
  components: { RouterLink, Icon },
  setup() {
    // -- State --
    const auth = useAuthStore()

    return { navGroups, auth }
  }
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  @apply flex h-screen flex-col overflow-hidden border-r border-rule-soft bg-paper;

  &__brand {
    @apply flex items-baseline gap-2 px-[22px] pb-[18px] pt-[22px];
  }

  &__brand-text {
    @apply font-serif text-[26px] italic leading-none tracking-[-0.01em] text-ink;
  }

  &__nav {
    @apply flex-1 overflow-y-auto py-2;
  }

  &__group-label {
    @apply px-5 pb-1.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted;
  }

  &__nav-item {
    @apply mx-2.5 my-px flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-ink transition-colors hover:bg-paper-3;

    &--active {
      @apply font-medium;
      background-color: var(--ink) !important;
      color: var(--paper) !important;
    }
  }

  &__nav-key {
    @apply ml-auto font-mono text-[10px] text-muted;
  }

  &__user {
    @apply flex items-center gap-2.5 border-t border-rule-soft px-[22px] py-3.5 text-[13px];
  }

  &__avatar {
    @apply grid h-8 w-8 place-items-center rounded-pill bg-accent text-[13px] font-semibold text-accent-ink;
  }

  &__user-name {
    @apply text-ink;
  }
}
</style>
