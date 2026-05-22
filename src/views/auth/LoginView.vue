<template>
  <div>
    <!-- Heading -->
    <h2 class="login-view__heading">
      {{ t('auth.loginHeadingPrefix') }}
      <em>
        {{ t('auth.loginHeadingEmphasis') }}
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
          :label="t('auth.password')"
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

    <!-- Dev-only quick login: skips the backend, dev builds only -->
    <Button
      v-if="isDev"
      variant="ghost"
      class="login-view__dev"
      @click="handleDevLogin"
    >
      Dev sign-in (skip backend)
    </Button>
  </div>
</template>

<script>
/** LoginView — email/password sign-in form with redirect-on-success behaviour. */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
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
    const { resolveErrorMessage } = useErrorToast()

    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)
    const isDev = import.meta.env.DEV

    return {
      t,
      isDev,
      email,
      password,
      error,
      loading,
      handleLogin,
      handleDevLogin,
    }

    // -- Function definitions --

    /**
     * Submit the email/password login form.
     * Redirects to the originally requested route on success.
     * The redirect param is validated to be a relative path to prevent open-redirect attacks.
     */
    async function handleLogin() {
      error.value = ''
      loading.value = true
      try {
        await authStore.login(email.value, password.value)
        const raw = route.query.redirect || '/'
        const redirect =
          typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')
            ? raw
            : '/'
        router.push(redirect)
      } catch (err) {
        error.value = resolveErrorMessage(err, 'Login failed')
      } finally {
        loading.value = false
      }
    }

    /**
     * Development-only sign-in. Establishes a mock session via the auth
     * store, then navigates into the app. The triggering button renders
     * only in dev builds.
     */
    function handleDevLogin() {
      authStore.devLogin()
      router.push('/')
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

  &__dev {
    @apply mt-3 w-full justify-center;
  }
}
</style>
