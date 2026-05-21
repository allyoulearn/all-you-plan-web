<template>
  <div class="reset-password-view">
    <!-- Heading -->
    <h2 class="text-xl font-semibold text-secondary-100 mb-6">{{ t('auth.resetPasswordTitle') }}</h2>

    <!-- Token missing / invalid error state -->
    <div v-if="!token" class="reset-password-view__error-state">
      <p class="text-danger-500 text-sm mb-4">{{ t('auth.resetTokenInvalid') }}</p>

      <router-link to="/auth/forgot-password" class="text-primary-400 hover:underline text-sm">
        {{ t('auth.forgotPasswordCta') }}
      </router-link>
    </div>

    <!-- Reset form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <!-- New password field -->
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">
          {{ t('auth.newPassword') }}
        </label>

        <input
          v-model="newPassword"
          type="password"
          required
          autocomplete="new-password"
          class="reset-password-view__input"
        />
      </div>

      <!-- Confirm password field -->
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">
          {{ t('auth.confirmPassword') }}
        </label>

        <input
          v-model="confirmPassword"
          type="password"
          required
          autocomplete="new-password"
          class="reset-password-view__input"
        />
      </div>

      <!-- Password strength hint -->
      <ul class="reset-password-view__hints">
        <li :class="['reset-password-view__hint', hints.length ? 'reset-password-view__hint--met' : '']">
          8+ characters
        </li>

        <li :class="['reset-password-view__hint', hints.upper ? 'reset-password-view__hint--met' : '']">
          Uppercase letter
        </li>

        <li :class="['reset-password-view__hint', hints.lower ? 'reset-password-view__hint--met' : '']">
          Lowercase letter
        </li>

        <li :class="['reset-password-view__hint', hints.digit ? 'reset-password-view__hint--met' : '']">
          Number
        </li>
      </ul>

      <!-- Error message -->
      <p v-if="error" class="text-danger-500 text-sm">{{ error }}</p>

      <!-- Submit button -->
      <button type="submit" :disabled="loading || !isPasswordValid" class="reset-password-view__btn">
        {{ loading ? t('common.loading') : t('auth.resetPasswordCta') }}
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ResetPasswordView',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    // ── Reactive state ──
    const token = computed(() => route.query.token || '')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const loading = ref(false)

    // ── Computed ──

    /** Individual password strength checks */
    const hints = computed(() => ({
      length: newPassword.value.length >= 8,
      upper: /[A-Z]/.test(newPassword.value),
      lower: /[a-z]/.test(newPassword.value),
      digit: /[0-9]/.test(newPassword.value),
    }))

    /** True only when all password requirements are satisfied */
    const isPasswordValid = computed(() => {
      const h = hints.value
      return h.length && h.upper && h.lower && h.digit
    })

    return {
      t,
      token,
      newPassword,
      confirmPassword,
      error,
      loading,
      hints,
      isPasswordValid,
      handleSubmit,
    }

    // ── Function definitions ──

    /**
     * Validate and submit the password reset.
     * Redirects to dashboard on success.
     */
    async function handleSubmit() {
      error.value = ''

      if (!isPasswordValid.value) {
        error.value = t('auth.passwordWeak')
        return
      }

      if (newPassword.value !== confirmPassword.value) {
        error.value = t('auth.passwordMismatch')
        return
      }

      loading.value = true
      try {
        await authStore.resetPassword(token.value, newPassword.value)
        router.push('/')
      } catch (err) {
        error.value = err?.graphQLErrors?.[0]?.message || t('auth.resetTokenInvalid')
      } finally {
        loading.value = false
      }
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.reset-password-view {
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

  // ── Error state (missing token) ──
  &__error-state {
    @apply text-center space-y-3;
  }

  // ── Password hints ──
  &__hints {
    @apply flex flex-wrap gap-x-3 gap-y-1;
  }

  &__hint {
    @apply text-xs text-secondary-500 transition-colors;

    &--met {
      @apply text-success-500;
    }
  }
}
</style>
