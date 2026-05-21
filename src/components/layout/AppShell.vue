<script setup>
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import WrenPanel from './WrenPanel.vue'
</script>

<template>
  <div
    class="grid h-screen overflow-hidden bg-paper"
    style="grid-template-columns: 232px 1fr 360px"
  >
    <AppSidebar />
    <main class="flex flex-col overflow-y-auto bg-paper">
      <AppTopBar />
      <div class="mx-auto w-full max-w-[980px] px-7 pb-20 pt-7">
        <RouterView />
      </div>
    </main>
    <WrenPanel />
  </div>
</template>

<style scoped>
@media (max-width: 1280px) {
  div { grid-template-columns: 200px 1fr 320px !important; }
}
@media (max-width: 960px) {
  div { grid-template-columns: 64px 1fr 280px !important; }
}
</style>
