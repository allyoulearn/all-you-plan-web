<template>
  <div class="app-layout">
    <!-- Desktop sidebar -->
    <div class="app-layout__sidebar-wrapper">
      <AppSidebar />
    </div>

    <!-- Mobile sidebar overlay -->
    <transition name="sidebar-overlay">
      <div
        v-if="sidebarOpen"
        class="app-layout__overlay"
        @click="sidebarOpen = false"
      />
    </transition>
    <transition name="sidebar-slide">
      <div v-if="sidebarOpen" class="app-layout__sidebar-mobile">
        <AppSidebar />
      </div>
    </transition>

    <!-- Right-hand content -->
    <div class="app-layout__body">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="app-layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

export default {
  name: 'AppLayout',
  components: {
    AppSidebar,
    AppHeader,
  },
  setup() {
    const sidebarOpen = ref(false)

    return {
      sidebarOpen,
    }
  },
}
</script>

<style lang="scss" scoped>
.app-layout {
  @apply flex min-h-screen;

  &__sidebar-wrapper {
    @apply hidden lg:flex lg:w-64 flex-col flex-shrink-0;
  }

  &__overlay {
    @apply fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden;
  }

  &__sidebar-mobile {
    @apply fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/10 lg:hidden;
    background: rgba(13, 26, 45, 0.97);
    backdrop-filter: blur(16px);
  }

  &__body {
    @apply flex flex-col flex-1 min-w-0;
  }

  &__main {
    @apply flex-1 p-6;
  }
}

// Mobile sidebar transitions
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.25s ease;
}
.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}
</style>
