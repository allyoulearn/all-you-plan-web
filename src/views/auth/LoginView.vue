<template>
  <div class="login-view">
    <!-- Heading -->
    <h2 class="text-xl font-semibold text-secondary-100 mb-4">{{ t('auth.login') }}</h2>

    <!-- Login form -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email field -->
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.email') }}</label>

        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="login-view__input"
        />
      </div>

      <!-- Password field + forgot link -->
      <div>
        <div class="login-view__password-header">
          <label class="block text-sm font-medium text-secondary-300">{{ t('auth.password') }}</label>

          <router-link to="/auth/forgot-password" class="login-view__forgot-link">
            {{ t('auth.forgotPassword') }}
          </router-link>
        </div>

        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="login-view__input mt-1"
        />
      </div>

      <!-- Error message -->
      <p v-if="error" class="text-danger-500 text-sm">{{ error }}</p>

      <!-- Submit button -->
      <button type="submit" :disabled="loading" class="login-view__btn">
        {{ loading ? t('common.loading') : t('auth.loginCta') }}
      </button>

      <!-- Register link -->
      <p class="text-center text-sm text-secondary-400">
        {{ t('auth.noAccount') }}
        <router-link to="/auth/register" class="text-primary-400 hover:underline">
          {{ t('auth.registerCta') }}
        </router-link>
      </p>
    </form>

    <!-- Google sign-in section (only rendered when client ID is configured) -->
    <template v-if="googleClientId">
      <!-- Divider -->
      <div class="login-view__divider">
        <span class="login-view__divider-label">{{ t('auth.orContinueWith') }}</span>
      </div>

      <!-- Google button container -->
      <div ref="googleBtnRef" class="login-view__google-btn"></div>

      <!-- Google sign-in error -->
      <p v-if="googleError" class="text-danger-500 text-sm text-center mt-2">{{ googleError }}</p>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'LoginView',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    // ── Reactive state ──
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)
    const googleError = ref('')
    const googleBtnRef = ref(null)

    /** Google OAuth client ID from env — falsy when not configured */
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

    // ── Lifecycle ──
    onMounted(() => {
      if (!googleClientId) return
      loadGoogleScript()
    })

    return {
      t,
      email,
      password,
      error,
      loading,
      googleError,
      googleBtnRef,
      googleClientId,
      handleLogin,
    }

    // ── Function definitions ──

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

    /**
     * Handle the credential response from Google Identity Services.
     * @param {Object} response - GSI credential response object
     * @param {string} response.credential - The JWT id token
     */
    async function handleGoogleCallback(response) {
      googleError.value = ''
      try {
        await authStore.googleLogin(response.credential)
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (err) {
        googleError.value = err?.graphQLErrors?.[0]?.message || 'Google sign-in failed'
      }
    }

    /**
     * Dynamically load the Google Identity Services script and
     * initialize the sign-in button once it is ready.
     */
    function loadGoogleScript() {
      const existing = document.getElementById('gsi-script')
      if (existing) {
        initGoogleButton()
        return
      }

      const script = document.createElement('script')
      script.id = 'gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = initGoogleButton
      document.head.appendChild(script)
    }

    /**
     * Initialize the Google Identity Services library and render
     * the sign-in button into the ref'd container element.
     */
    function initGoogleButton() {
      if (!window.google || !googleBtnRef.value) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      })

      window.google.accounts.id.renderButton(googleBtnRef.value, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
      })
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.login-view {
  // ── Input ──
  &__input {
    @apply w-full px-4 py-3 rounded-input border-2 border-white/10 bg-white/5 text-secondary-100;
    @apply focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
    @apply placeholder:text-secondary-500;
  }

  // ── Password row (label + forgot link) ──
  &__password-header {
    @apply flex items-center justify-between;
  }

  &__forgot-link {
    @apply text-xs text-primary-400 hover:underline;
  }

  // ── Submit button ──
  &__btn {
    @apply w-full py-3 rounded-btn font-semibold text-white bg-primary-500;
    @apply hover:bg-primary-600 disabled:opacity-50 transition-colors;
  }

  // ── Divider ──
  &__divider {
    @apply relative flex items-center my-5;

    &::before,
    &::after {
      content: '';
      @apply flex-1 border-t border-white/10;
    }
  }

  &__divider-label {
    @apply px-3 text-xs text-secondary-500 shrink-0;
  }

  // ── Google button container ──
  &__google-btn {
    @apply flex justify-center;
  }
}
</style>
