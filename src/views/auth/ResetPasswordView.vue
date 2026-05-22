<template>
  <div>
    <!-- Heading -->
    <h2 class="reset-password-view__heading">
      Reset your <em>
        password.
      </em>
    </h2>

    <!-- Token missing / invalid error state -->
    <div v-if="!token" class="reset-password-view__invalid">
      <p class="reset-password-view__invalid-text">
        {{ t('auth.resetTokenInvalid') }}
      </p>

      <router-link to="/auth/forgot-password" class="reset-password-view__link">
        {{ t('auth.forgotPasswordCta') }}
      </router-link>
    </div>

    <!-- Reset form -->
    <form v-else class="reset-password-view__form" @submit.prevent="handleSubmit">
      <!-- New password field -->
      <TextField
        v-model="newPassword"
        type="password"
        :label="t('auth.newPassword')"
        autocomplete="new-password"
      />

      <!-- Confirm password field -->
      <TextField
        v-model="confirmPassword"
        type="password"
        :label="t('auth.confirmPassword')"
        autocomplete="new-password"
      />

      <!-- Password strength hints -->
      <ul class="reset-password-view__hints">
        <li :class="['reset-password-view__hint', hints.length ? 'reset-password-view__hint--ok' : 'reset-password-view__hint--muted']">
          8+ characters
        </li>

        <li :class="['reset-password-view__hint', hints.upper ? 'reset-password-view__hint--ok' : 'reset-password-view__hint--muted']">
          Uppercase letter
        </li>

        <li :class="['reset-password-view__hint', hints.lower ? 'reset-password-view__hint--ok' : 'reset-password-view__hint--muted']">
          Lowercase letter
        </li>

        <li :class="['reset-password-view__hint', hints.digit ? 'reset-password-view__hint--ok' : 'reset-password-view__hint--muted']">
          Number
        </li>
      </ul>

      <!-- Error message -->
      <p v-if="error" class="reset-password-view__error">
        {{ error }}
      </p>

      <!-- Submit button -->
      <Button
        variant="accent"
        type="submit"
        :disabled="loading || !isPasswordValid"
        size="md"
        class="reset-password-view__submit"
      >
        {{ loading ? t('common.loading') : t('auth.resetPasswordCta') }}
      </Button>

      <!-- Back to login link -->
      <p class="reset-password-view__footer">
        <router-link to="/auth/login" class="reset-password-view__link">
          {{ t('auth.backToLogin') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
/** ResetPasswordView — password-reset form that validates strength and submits with the one-time token. */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'ResetPasswordView',
  components: { TextField, Button },
  setup() {
    // -- State --
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const newPassword = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const loading = ref(false)

    // -- Computed --

    /** One-time reset token read from the route query string. */
    const token = computed(() => route.query.token || '')

    /** Individual password strength checks. */
    const hints = computed(() => ({
      length: newPassword.value.length >= 8,
      upper: /[A-Z]/.test(newPassword.value),
      lower: /[a-z]/.test(newPassword.value),
      digit: /[0-9]/.test(newPassword.value),
    }))

    /** True only when all password requirements are satisfied. */
    const isPasswordValid = computed(() => {
      const h = hints.value
      return h.length && h.upper && h.lower && h.digit
    })

    return {
      t,
      newPassword,
      confirmPassword,
      error,
      loading,
      token,
      hints,
      isPasswordValid,
      handleSubmit,
    }

    // -- Function definitions --

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
.reset-password-view {
  &__heading {
    @apply mb-6 font-serif text-[22px] text-ink;
  }

  &__invalid {
    @apply space-y-3 text-center;
  }

  &__invalid-text {
    @apply text-sm text-bad;
  }

  &__form {
    @apply space-y-4;
  }

  &__hints {
    @apply flex flex-wrap gap-x-3 gap-y-1;
  }

  &__hint {
    @apply text-xs transition-colors;

    &--ok {
      @apply text-ok;
    }

    &--muted {
      @apply text-muted;
    }
  }

  &__error {
    @apply text-sm text-bad;
  }

  &__submit {
    @apply w-full justify-center;
  }

  &__footer {
    @apply text-center text-sm text-muted;
  }

  &__link {
    @apply text-sm text-accent hover:underline;
  }
}
</style>
