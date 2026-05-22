<template>
  <div class="app-shell">
    <AppSidebar />

    <main class="app-shell__main">
      <AppTopBar />

      <div class="app-shell__content">
        <RouterView />
      </div>
    </main>

    <WrenPanel />
  </div>
</template>

<script>
/** AppShell — root layout grid that composes sidebar, main content area, and Wren panel. */
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import WrenPanel from './WrenPanel.vue'

export default {
  name: 'AppShell',
  components: { RouterView, AppSidebar, AppTopBar, WrenPanel }
}
</script>

<style lang="scss" scoped>
.app-shell {
  @apply grid h-screen overflow-hidden bg-paper;
  grid-template-columns: 232px 1fr 360px;

  @media (min-width: 1024px) {
    grid-template-columns: 64px 1fr 280px;
  }

  @media (min-width: 1280px) {
    grid-template-columns: 200px 1fr 320px;
  }

  &__main {
    @apply flex flex-col overflow-y-auto bg-paper;
  }

  &__content {
    @apply mx-auto w-full max-w-[980px] px-7 pb-20 pt-7;
  }
}
</style>
