<template>
  <header class="app-header">
    <button class="app-header__menu-btn" @click="$emit('toggle-sidebar')">
      <Bars3Icon class="app-header__menu-icon" />
    </button>

    <h1 class="app-header__title">{{ pageTitle }}</h1>

    <div class="app-header__actions">
      <button class="app-header__bell-btn" @click="handleBellClick">
        <BellIcon class="app-header__bell-icon" />
        <span v-if="nudgesStore.unreadCount > 0" class="app-header__badge">
          {{ nudgesStore.unreadCount > 99 ? '99+' : nudgesStore.unreadCount }}
        </span>
      </button>

      <div class="app-header__avatar">
        {{ userInitial }}
      </div>
    </div>
  </header>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { BellIcon, Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth.store'
import { useNudgesStore } from '@/stores/nudges.store'

export default {
  name: 'AppHeader',
  components: {
    BellIcon,
    Bars3Icon,
  },
  emits: ['toggle-sidebar'],
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const authStore = useAuthStore()
    const nudgesStore = useNudgesStore()

    const pageTitle = computed(() => {
      const title = route.meta?.title
      return title ? t(`nav.${title.toLowerCase()}`, title) : 'All You Plan'
    })

    const userInitial = computed(() => {
      const name = authStore.userName
      return name ? name.charAt(0).toUpperCase() : '?'
    })

    function handleBellClick() {
      // Future: open nudges panel
    }

    onMounted(() => {
      nudgesStore.fetchNudges(true)
    })

    return {
      t,
      nudgesStore,
      pageTitle,
      userInitial,
      handleBellClick,
    }
  },
}
</script>

<style lang="scss" scoped>
.app-header {
  @apply flex items-center gap-3 px-4 py-3 border-b border-white/10;
  background: rgba(13, 26, 45, 0.8);
  backdrop-filter: blur(16px);

  &__menu-btn {
    @apply flex items-center justify-center w-9 h-9 rounded-btn bg-transparent border-0
           cursor-pointer text-secondary-400 transition-colors duration-150 flex-shrink-0;

    &:hover {
      @apply bg-white/5 text-white;
    }
  }

  &__menu-icon {
    @apply w-5 h-5;
  }

  &__title {
    @apply flex-1 text-base font-semibold text-white m-0;
  }

  &__actions {
    @apply flex items-center gap-2 flex-shrink-0;
  }

  &__bell-btn {
    @apply relative flex items-center justify-center w-9 h-9 rounded-btn bg-transparent
           border-0 cursor-pointer text-secondary-400 transition-colors duration-150;

    &:hover {
      @apply bg-white/5 text-white;
    }
  }

  &__bell-icon {
    @apply w-5 h-5;
  }

  &__badge {
    @apply absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
           bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center
           leading-none;
  }

  &__avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary-300
           cursor-pointer flex-shrink-0 select-none;
    background: rgba(27, 158, 158, 0.3);
    border: 1px solid rgba(27, 158, 158, 0.4);
  }
}
</style>
