<template>
  <div class="auth-layout">
    <div class="auth-layout__card glass-elevated">
      <h1 class="text-2xl font-bold text-primary-400 text-center mb-6">All You Plan</h1>
      <router-view />
    </div>
  </div>
</template>

<script>
export default { name: 'AuthLayout' }
</script>

<style lang="scss" scoped>
.auth-layout {
  @apply flex items-center justify-center min-h-screen p-4;

  &__card {
    @apply w-full max-w-md p-8;
  }
}
</style>
