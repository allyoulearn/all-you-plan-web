<template>
  <!-- Toast provider -->
  <Toaster
    position="top-right"
    :theme="mode"
    rich-colors
    close-button
  />

  <!-- Router outlet -->
  <RouterView />

  <!-- Cookie consent banner (Phase 4 Item C). Self-mounts when the user
       has not yet decided, and self-hides after the choice persists. -->
  <CookieConsentBanner />
</template>

<script>
/** App — root application component that mounts the toast provider, the router outlet, and the cookie consent banner. */
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme.js'
import CookieConsentBanner from '@/components/CookieConsentBanner.vue'

export default {
  name: 'App',
  components: { RouterView, Toaster, CookieConsentBanner },
  setup() {
    // Wire the Toaster's theme to the user's current mode so toasts adapt to
    // dark mode (CLAUDE.md "Dark mode required") and enable rich-colors plus
    // a close button for accessibility.
    const { mode } = useTheme()
    return { mode }
  }
}
</script>
