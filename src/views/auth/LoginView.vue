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
      <AppTextField
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

        <AppTextField
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
      <AppButton
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="login-view__submit"
      >
        {{ loading ? t('common.loading') : t('auth.loginCta') }}
      </AppButton>

      <!-- Register link -->
      <p class="login-view__footer">
        {{ t('auth.noAccount') }}
        <router-link to="/auth/register" class="login-view__register-link">
          {{ t('auth.registerCta') }}
        </router-link>
      </p>
    </form>

    <!--
      Dev-only quick login: skips the backend, dev builds only. Rendered via
      the <DevSignIn> component below — NOT inline markup — because a template
      literal placed here would be hoisted by the Vue compiler as a static
      string constant that survives `v-if="import.meta.env.DEV"`. Building the
      vnode inside a DIRECT `import.meta.env.DEV` branch in <script> lets Vite
      fold the guard to `false` and Rollup strip the button text + handler from
      the prod bundle entirely.
    -->
    <component :is="DevSignIn" />
  </div>
</template>

<script>
/** LoginView — email/password sign-in form with redirect-on-success behaviour. */
import { ref, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'LoginView',
  components: { AppTextField, AppButton },
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

    // Dev-only quick-login control. Built as a render-function component inside
    // a DIRECT `import.meta.env.DEV` branch (no optional chaining) so Vite
    // replaces the guard with the literal `false` in a production build and
    // Rollup strips the whole branch — including the "Dev sign-in" button text,
    // its click handler, and the `authStore.devLogin` reference. In prod this
    // is `null`, so `<component :is="DevSignIn" />` renders nothing. Keeping the
    // markup AND the handler inside this branch (not in <template>, not as a
    // hoisted setup-level function) avoids the Vue compiler hoisting the button
    // text as a static string constant, and keeps `authStore.devLogin` from
    // surviving as an unreferenced function body after the branch is removed.
    let DevSignIn = null

    if (import.meta.env.DEV) {
      const handleDevLogin = () => {
        authStore.devLogin()
        router.push('/')
      }

      DevSignIn = {
        name: 'DevSignIn',
        render() {
          return h(
            AppButton,
            {
              variant: 'ghost',
              class: 'login-view__dev',
              onClick: handleDevLogin,
            },
            () => 'Dev sign-in (skip backend)'
          )
        },
      }
    }

    return {
      t,
      DevSignIn,
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
