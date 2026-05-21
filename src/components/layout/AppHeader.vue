<template>
  <header class="app-header">
    <button class="app-header__menu-btn" @click="$emit('toggle-sidebar')">
      <Bars3Icon class="app-header__menu-icon" />
    </button>

    <h1 :key="pageTitle" class="app-header__title">{{ pageTitle }}</h1>

    <div class="app-header__actions">
      <button class="app-header__bell-btn" @click="handleBellClick">
        <BellIcon
          class="app-header__bell-icon"
          :class="{ 'app-header__bell-icon--wiggle': bellWiggle }"
        />
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
import { computed, onMounted, ref, watch } from 'vue'
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

    /** Briefly true after the unread count rises, to trigger the bell wiggle. */
    const bellWiggle = ref(false)

    const pageTitle = computed(() => {
      const title = route.meta?.title
      return title ? t(`nav.${title.toLowerCase()}`, title) : 'All You Plan'
    })

    const userInitial = computed(() => {
      const name = authStore.userName
      return name ? name.charAt(0).toUpperCase() : '?'
    })

    /**
     * Wiggle the bell once whenever the unread nudge count increases.
     * Note: if the user already has unread nudges, this also fires once when
     * the initial fetchNudges() resolves (0 -> N) — an intentional attention cue.
     */
    watch(
      () => nudgesStore.unreadCount,
      (next, prev) => {
        if (next > prev) {
          bellWiggle.value = true
          setTimeout(() => {
            bellWiggle.value = false
          }, 400)
        }
      }
    )

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
      bellWiggle,
      handleBellClick,
    }
  },
}
</script>

<style lang="scss" scoped>
.app-header {
  @apply relative flex items-center gap-3 px-4 py-3;
  background: rgba(13, 26, 45, 0.8);
  backdrop-filter: blur(16px);

  &::after {
    content: '';
    @apply absolute left-0 right-0 bottom-0 h-px;
    background: linear-gradient(90deg, rgba(27, 158, 158, 0.4) 0%, transparent 70%);
  }

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
    animation: fadeIn 0.15s ease-out;
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

    &--wiggle {
      animation: bellWiggle 0.4s ease-in-out;
    }
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

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes bellWiggle {
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-12deg); }
  40%      { transform: rotate(10deg); }
  60%      { transform: rotate(-6deg); }
  80%      { transform: rotate(3deg); }
}
</style>
