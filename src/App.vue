<template>
  <Toaster position="top-right" :theme="isDark ? 'dark' : 'light'" />
  <router-view v-if="isAuthRoute" />
  <AppLayout v-else>
    <router-view />
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
    return { isDark, isAuthRoute }
  },
}
</script>
