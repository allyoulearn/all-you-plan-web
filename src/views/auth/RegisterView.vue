<template>
  <div>
    <!-- Heading -->
    <h2 class="register-view__heading">
      {{ t('auth.registerHeadingPrefix') }}
      <em>
        {{ t('auth.registerHeadingEmphasis') }}
      </em>
    </h2>

    <!-- Register form -->
    <form class="register-view__form" @submit.prevent="handleRegister">
      <!-- Name field -->
      <AppTextField
        v-model="name"
        type="text"
        :label="t('auth.name')"
      />

      <!-- Email field -->
      <AppTextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
      />

      <!-- Password field -->
      <AppTextField
        v-model="password"
        type="password"
        :label="t('auth.password')"
      />

      <!-- Error message -->
      <p v-if="error" class="register-view__error">
        {{ error }}
      </p>

      <!-- Submit button -->
      <AppButton
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="register-view__submit"
      >
        {{ loading ? t('common.loading') : t('auth.registerCta') }}
      </AppButton>

      <!-- Login link -->
      <p class="register-view__footer">
        {{ t('auth.hasAccount') }}
        <router-link to="/auth/login" class="register-view__login-link">
          {{ t('auth.loginCta') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
/** RegisterView — new-user registration form that creates an account and redirects to the dashboard. */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'RegisterView',
  components: { AppTextField, AppButton },
  setup() {
    // -- State --
    const { t } = useI18n()
    const router = useRouter()
    const authStore = useAuthStore()
    const { resolveErrorMessage } = useErrorToast()

    const name = ref('')
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    return {
      t,
      name,
      email,
      password,
      error,
      loading,
      handleRegister,
    }

    // -- Function definitions --

    /**
     * Submit the registration form.
     * Redirects to the dashboard on success.
     */
    async function handleRegister() {
      error.value = ''
      loading.value = true

      try {
        await authStore.register(email.value, password.value, name.value)
        router.push('/')
      } catch (err) {
        error.value = resolveErrorMessage(err, 'Registration failed')
      } finally {
        loading.value = false
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.register-view {
  &__heading {
    @apply mb-6 font-serif text-[22px] text-ink;
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

  &__login-link {
    @apply text-accent hover:underline;
  }
}
</style>
