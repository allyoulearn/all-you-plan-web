<template>
  <div>
    <!-- Heading -->
    <h2 class="mb-6 font-serif text-[22px] text-ink">
      Welcome <em>back.</em>
    </h2>

    <!-- Login form -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email field -->
      <TextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
        autocomplete="email"
      />

      <!-- Password field + forgot link -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-[12px] font-medium text-muted">{{ t('auth.password') }}</span>
          <router-link to="/auth/forgot-password" class="text-xs text-accent hover:underline">
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
      <p v-if="error" class="text-sm text-bad">{{ error }}</p>

      <!-- Submit button -->
      <Button variant="accent" type="submit" :disabled="loading" size="md" class="w-full justify-center">
        {{ loading ? t('common.loading') : t('auth.loginCta') }}
      </Button>

      <!-- Register link -->
      <p class="text-center text-sm text-muted">
        {{ t('auth.noAccount') }}
        <router-link to="/auth/register" class="text-accent hover:underline">
          {{ t('auth.registerCta') }}
        </router-link>
      </p>
    </form>

    <!-- Google sign-in section (only rendered when client ID is configured) -->
    <template v-if="googleClientId">
      <!-- Divider -->
      <div class="relative my-5 flex items-center">
        <div class="flex-1 border-t border-rule-soft"></div>
        <span class="shrink-0 px-3 text-xs text-muted">{{ t('auth.orContinueWith') }}</span>
        <div class="flex-1 border-t border-rule-soft"></div>
      </div>

      <!-- Google button container -->
      <div ref="googleBtnRef" class="flex justify-center"></div>

      <!-- Google sign-in error -->
      <p v-if="googleError" class="mt-2 text-center text-sm text-bad">{{ googleError }}</p>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'LoginView',
  components: { TextField, Button },
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
