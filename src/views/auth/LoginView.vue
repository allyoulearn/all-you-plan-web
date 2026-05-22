<template>
  <div>
    <!-- Heading -->
    <h2 class="login-view__heading">
      Welcome <em>
        back.
      </em>
    </h2>

    <!-- Login form -->
    <form class="login-view__form" @submit.prevent="handleLogin">
      <!-- Email field -->
      <TextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
        autocomplete="email"
      />

      <!-- Password field + forgot link -->
      <div>
        <div class="login-view__password-header">
          <span class="login-view__password-label">
            {{ t('auth.password') }}
          </span>

          <router-link to="/auth/forgot-password" class="login-view__forgot-link">
            {{ t('auth.forgotPassword') }}
          </router-link>
        </div>

        <TextField
          v-model="password"
          type="password"
          autocomplete="current-password"
        />
      </div>

      <!-- Error message -->
      <p v-if="error" class="login-view__error">
        {{ error }}
      </p>

      <!-- Submit button -->
      <Button
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="login-view__submit"
      >
        {{ loading ? t('common.loading') : t('auth.loginCta') }}
      </Button>

      <!-- Register link -->
      <p class="login-view__footer">
        {{ t('auth.noAccount') }}
        <router-link to="/auth/register" class="login-view__register-link">
          {{ t('auth.registerCta') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
/** LoginView — email/password sign-in form with redirect-on-success behaviour. */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'LoginView',
  components: { TextField, Button },
  setup() {
    // -- State --
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    return {
      t,
      email,
      password,
      error,
      loading,
      handleLogin,
    }

    // -- Function definitions --

    /**
     * Submit the email/password login form.
     * Redirects to the originally requested route on success.
     */
    async function handleLogin() {
      error.value = ''
      loading.value = true
      try {
        await authStore.login(email.value, password.value)
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (err) {
        error.value = err?.graphQLErrors?.[0]?.message || 'Login failed'
      } finally {
        loading.value = false
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.login-view {
  &__heading {
    @apply mb-6 font-serif text-[22px] text-ink;
  }

  &__form {
    @apply space-y-4;
  }

  &__password-header {
    @apply mb-1.5 flex items-center justify-between;
  }

  &__password-label {
    @apply text-[12px] font-medium text-muted;
  }

  &__forgot-link {
    @apply text-xs text-accent hover:underline;
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

  &__register-link {
    @apply text-accent hover:underline;
  }
}
</style>
