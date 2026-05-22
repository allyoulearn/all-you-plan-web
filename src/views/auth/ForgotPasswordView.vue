<template>
  <div>
    <!-- Heading -->
    <h2 class="forgot-password-view__heading">
      Forgot your <em>
        password?
      </em>
    </h2>

    <p class="forgot-password-view__description">
      {{ t('auth.forgotPasswordDesc') }}
    </p>

    <!-- Success state -->
    <div v-if="sent" class="forgot-password-view__success">
      <p class="forgot-password-view__success-text">
        {{ t('auth.forgotPasswordSuccess') }}
      </p>

      <router-link to="/auth/login" class="forgot-password-view__link">
        {{ t('auth.backToLogin') }}
      </router-link>
    </div>

    <!-- Form -->
    <form v-else class="forgot-password-view__form" @submit.prevent="handleSubmit">
      <!-- Email field -->
      <TextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
        autocomplete="email"
      />

      <!-- Error message -->
      <p v-if="error" class="forgot-password-view__error">
        {{ error }}
      </p>

      <!-- Submit button -->
      <Button
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="forgot-password-view__submit"
      >
        {{ loading ? t('common.loading') : t('auth.forgotPasswordCta') }}
      </Button>

      <!-- Back to login link -->
      <p class="forgot-password-view__footer">
        <router-link to="/auth/login" class="forgot-password-view__link">
          {{ t('auth.backToLogin') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
/** ForgotPasswordView — email entry form that initiates a password-reset flow. */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'ForgotPasswordView',
  components: { TextField, Button },
  setup() {
    // -- State --
    const { t } = useI18n()
    const authStore = useAuthStore()

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

    // -- Function definitions --

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
.forgot-password-view {
  &__heading {
    @apply mb-2 font-serif text-[22px] text-ink;
  }

  &__description {
    @apply mb-6 text-sm text-muted;
  }

  &__success {
    @apply space-y-4 text-center;
  }

  &__success-text {
    @apply text-sm text-ink;
  }

  &__form {
    @apply space-y-4;
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
