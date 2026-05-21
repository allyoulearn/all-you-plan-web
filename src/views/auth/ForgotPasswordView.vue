<template>
  <div class="forgot-password-view">
    <!-- Heading -->
    <h2 class="text-xl font-semibold text-secondary-100 mb-2">{{ t('auth.forgotPasswordTitle') }}</h2>

    <p class="text-sm text-secondary-400 mb-6">{{ t('auth.forgotPasswordDesc') }}</p>

    <!-- Success state -->
    <div v-if="sent" class="forgot-password-view__success">
      <p class="text-sm text-secondary-200">{{ t('auth.forgotPasswordSuccess') }}</p>

      <router-link to="/auth/login" class="forgot-password-view__back-link">
        {{ t('auth.backToLogin') }}
      </router-link>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Email field -->
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.email') }}</label>

        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="forgot-password-view__input"
        />
      </div>

      <!-- Error message -->
      <p v-if="error" class="text-danger-500 text-sm">{{ error }}</p>

      <!-- Submit button -->
      <button type="submit" :disabled="loading" class="forgot-password-view__btn">
        {{ loading ? t('common.loading') : t('auth.forgotPasswordCta') }}
      </button>

      <!-- Back to login link -->
      <p class="text-center text-sm text-secondary-400">
        <router-link to="/auth/login" class="text-primary-400 hover:underline">
          {{ t('auth.backToLogin') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ForgotPasswordView',
  setup() {
    const { t } = useI18n()
    const authStore = useAuthStore()

    // ── Reactive state ──
    const email = ref('')
    const error = ref('')
    const loading = ref(false)
    const sent = ref(false)

    return {
      t,
      email,
      error,
      loading,
      sent,
      handleSubmit,
    }

    // ── Function definitions ──

    /**
     * Submit the forgot-password request.
     * Always transitions to the success state on completion
     * to avoid leaking whether an email exists.
     */
    async function handleSubmit() {
      error.value = ''
      loading.value = true
      try {
        await authStore.forgotPassword(email.value)
        sent.value = true
      } catch {
        // Show success state regardless to prevent email enumeration
        sent.value = true
      } finally {
        loading.value = false
      }
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.forgot-password-view {
  // ── Input ──
  &__input {
    @apply w-full px-4 py-3 rounded-input border-2 border-white/10 bg-white/5 text-secondary-100;
    @apply focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
    @apply placeholder:text-secondary-500;
  }

  // ── Submit button ──
  &__btn {
    @apply w-full py-3 rounded-btn font-semibold text-white bg-primary-500;
    @apply hover:bg-primary-600 disabled:opacity-50 transition-colors;
  }

  // ── Success state ──
  &__success {
    @apply space-y-4 text-center;
  }

  &__back-link {
    @apply text-primary-400 hover:underline text-sm;
  }
}
</style>
