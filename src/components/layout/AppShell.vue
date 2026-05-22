<script setup>
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import WrenPanel from './WrenPanel.vue'
</script>

<template>
  <div
    class="grid h-screen overflow-hidden bg-paper [grid-template-columns:232px_1fr_360px] xl:[grid-template-columns:200px_1fr_320px] lg:[grid-template-columns:64px_1fr_280px]"
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
