<template>
  <div class="auth-layout">
    <div class="auth-layout__inner">
      <p class="auth-layout__wordmark">
        all you <em>
          plan
        </em>
      </p>

      <div class="auth-layout__card">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
/** AuthLayout — centered card shell wrapping all authentication screens. */

export default {
  name: 'AuthLayout',
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
