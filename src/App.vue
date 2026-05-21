<template>
  <Toaster position="top-right" :theme="isDark ? 'dark' : 'light'" />
  <router-view v-if="isAuthRoute" />
  <AppLayout v-else>
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </AppLayout>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useDarkMode } from '@/composables/useDarkMode'
import AppLayout from '@/components/layout/AppLayout.vue'

export default {
  name: 'App',
  components: { Toaster, AppLayout },
  setup() {
    const route = useRoute()
    const { isDark } = useDarkMode()
    const isAuthRoute = computed(() => route.path.startsWith('/auth'))
    return { route, isDark, isAuthRoute }
  },
}
</script>

<style>
/* Unscoped: these classes are applied to route component roots, which are
   outside App.vue's scoped style scope. */
.page-enter-active,
.page-leave-active {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.page-enter-from {
  transform: translateY(8px);
  opacity: 0;
}
.page-leave-to {
  opacity: 0;
}
</style>
