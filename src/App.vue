<template>
  <Toaster
    position="top-right"
    :theme="mode"
    rich-colors
    close-button
  />

  <RouterView />
</template>

<script>
/** App — root application component that mounts the toast provider and the router outlet. */
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme.js'

export default {
  name: 'App',
  components: { RouterView, Toaster },
  setup() {
    // Wire the Toaster's theme to the user's current mode so toasts adapt to
    // dark mode (CLAUDE.md "Dark mode required") and enable rich-colors plus
    // a close button for accessibility (WEB-W4-36).
    const { mode } = useTheme()
    return { mode }
  }
}
</script>
