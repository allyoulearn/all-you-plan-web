<template>
  <div class="auth-layout">
    <div class="auth-layout__inner">
      <!-- Wordmark -->
      <p class="auth-layout__wordmark">
        all you <em>
          plan
        </em>
      </p>

      <!-- Routed auth screen -->
      <div class="auth-layout__card">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script>
/** AuthLayout — centered card shell wrapping all authentication screens. */
import { RouterView } from 'vue-router'

export default {
  name: 'AuthLayout',
  components: { RouterView }
}
</script>

<style lang="scss" scoped>
.auth-layout {
  @apply grid min-h-screen place-items-center bg-paper px-4;

  &__inner {
    @apply w-full max-w-md;
  }

  &__wordmark {
    @apply mb-6 text-center font-serif text-[28px] italic text-ink;
  }

  &__card {
    @apply rounded-md border border-rule-soft bg-paper-2 p-8 shadow-sm;
  }
}
</style>
