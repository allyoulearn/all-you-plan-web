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

      <!-- Public legal links so signed-out users can reach the policy and
           terms (gate G-05). -->
      <AppFooter class="auth-layout__footer" />
    </div>
  </div>
</template>

<script>
/** AuthLayout — centered card shell wrapping all authentication screens. */
import { RouterView } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'

export default {
  name: 'AuthLayout',
  components: { RouterView, AppFooter }
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

  &__footer {
    // The auth screens are a centered card, not a full-height app frame, so
    // drop the top rule and tighten the spacing — the links read as a quiet
    // caption under the card rather than a page-spanning footer bar.
    @apply mt-6;
    border-top: 0;
  }
}
</style>
