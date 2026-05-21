<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__brand">
      <router-link to="/" class="app-sidebar__brand-link">
        <SparklesIcon class="app-sidebar__brand-icon" />
        <span class="app-sidebar__brand-name">All You Plan</span>
      </router-link>
    </div>

    <nav class="app-sidebar__nav">
      <router-link
        to="/"
        class="app-sidebar__nav-item"
        :class="{ 'app-sidebar__nav-item--active': isActive('/') }"
      >
        <HomeIcon class="app-sidebar__nav-icon" />
        <span>{{ t('nav.dashboard') }}</span>
      </router-link>
      <router-link
        to="/briefing"
        class="app-sidebar__nav-item"
        :class="{ 'app-sidebar__nav-item--active': isActive('/briefing') }"
      >
        <CalendarIcon class="app-sidebar__nav-icon" />
        <span>{{ t('nav.briefing') }}</span>
      </router-link>
      <router-link
        to="/settings"
        class="app-sidebar__nav-item"
        :class="{ 'app-sidebar__nav-item--active': isActive('/settings') }"
      >
        <Cog6ToothIcon class="app-sidebar__nav-icon" />
        <span>{{ t('nav.settings') }}</span>
      </router-link>
    </nav>

    <div class="app-sidebar__spaces">
      <p class="app-sidebar__spaces-title">{{ t('nav.spaces') }}</p>
      <div v-if="spacesStore.loading" class="app-sidebar__spaces-loading">
        <span class="app-sidebar__loading-dot" />
        <span class="app-sidebar__loading-dot" />
        <span class="app-sidebar__loading-dot" />
      </div>
      <ul v-else class="app-sidebar__spaces-list">
        <li
          v-for="space in spacesStore.activeSpaces"
          :key="space.id"
          class="app-sidebar__space-item"
        >
          <router-link
            :to="`/spaces/${space.id}`"
            class="app-sidebar__space-link"
            :class="{ 'app-sidebar__space-link--active': isActive(`/spaces/${space.id}`) }"
          >
            <span
              class="app-sidebar__space-dot"
              :style="{ background: space.color || '#3ec4c4' }"
            />
            <span class="app-sidebar__space-name">{{ space.name }}</span>
            <span v-if="space.taskCount" class="app-sidebar__space-count">
              {{ space.taskCount }}
            </span>
          </router-link>
        </li>
      </ul>
    </div>

    <div class="app-sidebar__footer">
      <div class="app-sidebar__user">
        <div class="app-sidebar__avatar">
          {{ userInitial }}
        </div>
        <div class="app-sidebar__user-info">
          <p class="app-sidebar__user-name">{{ authStore.userName }}</p>
        </div>
      </div>
      <button class="app-sidebar__logout" @click="handleLogout">
        <ArrowRightOnRectangleIcon class="app-sidebar__logout-icon" />
        <span>{{ t('settings.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  CalendarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth.store'
import { useSpacesStore } from '@/stores/spaces.store'

export default {
  name: 'AppSidebar',
  components: {
    HomeIcon,
    CalendarIcon,
    Cog6ToothIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
  },
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const spacesStore = useSpacesStore()

    const userInitial = computed(() => {
      const name = authStore.userName
      return name ? name.charAt(0).toUpperCase() : '?'
    })

    function isActive(path) {
      if (path === '/') {
        return route.path === '/'
      }
      return route.path.startsWith(path)
    }

    async function handleLogout() {
      await authStore.logout()
      router.push('/auth/login')
    }

    onMounted(() => {
      spacesStore.fetchSpaces()
    })

    return {
      t,
      authStore,
      spacesStore,
      userInitial,
      isActive,
      handleLogout,
    }
  },
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  @apply flex flex-col h-full overflow-y-auto;
  background: rgba(27, 158, 158, 0.04);
  backdrop-filter: blur(16px);

  &__brand {
    @apply px-5 py-5 border-b border-white/10;
  }

  &__brand-link {
    @apply flex items-center gap-2 no-underline;
  }

  &__brand-icon {
    @apply w-6 h-6 text-primary-400 flex-shrink-0;
  }

  &__brand-name {
    @apply text-lg font-bold text-primary-400 tracking-tight;
  }

  &__nav {
    @apply flex flex-col gap-1 px-3 py-4;
  }

  &__nav-item {
    @apply flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium
           text-secondary-300 no-underline transition-all duration-150;

    &:hover {
      @apply bg-white/5 text-white;
    }

    &--active {
      @apply text-primary-400;
      background: rgba(27, 158, 158, 0.15);
    }
  }

  &__nav-icon {
    @apply w-5 h-5 flex-shrink-0;
  }

  &__spaces {
    @apply flex-1 px-3 pb-4;
  }

  &__spaces-title {
    @apply px-3 mb-2 text-xs font-semibold tracking-widest uppercase text-secondary-500;
  }

  &__spaces-loading {
    @apply flex items-center gap-1.5 px-3 py-2;
  }

  &__loading-dot {
    @apply w-1.5 h-1.5 rounded-full bg-secondary-600 animate-pulse;
  }

  &__spaces-list {
    @apply flex flex-col gap-0.5 list-none m-0 p-0;
  }

  &__space-item {
    @apply m-0 p-0;
  }

  &__space-link {
    @apply flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm
           text-secondary-400 no-underline transition-all duration-150;

    &:hover {
      @apply bg-white/5 text-secondary-200;
    }

    &--active {
      @apply bg-white/10 text-white;
    }
  }

  &__space-dot {
    @apply w-2.5 h-2.5 rounded-full flex-shrink-0;
  }

  &__space-name {
    @apply flex-1 truncate;
  }

  &__space-count {
    @apply text-xs text-secondary-500 flex-shrink-0;
  }

  &__footer {
    @apply px-3 py-4 border-t border-white/10 flex flex-col gap-2;
  }

  &__user {
    @apply flex items-center gap-3 px-2 py-1;
  }

  &__avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary-300 flex-shrink-0;
    background: rgba(27, 158, 158, 0.3);
    border: 1px solid rgba(27, 158, 158, 0.4);
  }

  &__user-info {
    @apply flex-1 min-w-0;
  }

  &__user-name {
    @apply text-sm font-medium text-secondary-200 truncate;
  }

  &__logout {
    @apply flex items-center gap-2.5 w-full px-3 py-2 rounded-btn text-sm
           text-secondary-500 bg-transparent border-0 cursor-pointer transition-all duration-150
           text-left;

    &:hover {
      @apply bg-white/5 text-secondary-300;
    }
  }

  &__logout-icon {
    @apply w-4 h-4 flex-shrink-0;
  }
}
</style>
