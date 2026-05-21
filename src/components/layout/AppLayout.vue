<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="p-4 text-lg font-bold text-primary-400">All You Plan</div>
    </aside>
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<script>
export default {
  name: 'AppLayout',
}
</script>

<style lang="scss" scoped>
.app-layout {
  @apply flex min-h-screen;

  &__sidebar {
    @apply hidden lg:flex lg:w-64 flex-col border-r border-white/10;
    background: rgba(27, 158, 158, 0.04);
    backdrop-filter: blur(16px);
  }

  &__main {
    @apply flex-1 p-6;
  }
}
</style>
