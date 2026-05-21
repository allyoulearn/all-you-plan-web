<template>
  <div class="login-view">
    <h2 class="text-xl font-semibold text-secondary-100 mb-4">{{ t('auth.login') }}</h2>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.email') }}</label>
        <input v-model="email" type="email" required
          class="login-view__input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.password') }}</label>
        <input v-model="password" type="password" required
          class="login-view__input" />
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <button type="submit" :disabled="loading"
        class="login-view__btn">
        {{ loading ? t('common.loading') : t('auth.loginCta') }}
      </button>
      <p class="text-center text-sm text-secondary-400">
        {{ t('auth.noAccount') }}
        <router-link to="/auth/register" class="text-primary-400 hover:underline">
          {{ t('auth.registerCta') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
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

    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

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

    return {
      t, email, password, error, loading,
      handleLogin,
    }
  },
}
</script>

<style lang="scss" scoped>
.login-view {
  &__input {
    @apply w-full px-4 py-3 rounded-input border-2 border-white/10 bg-white/5 text-secondary-100;
    @apply focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
    @apply placeholder:text-secondary-500;
  }

  &__btn {
    @apply w-full py-3 rounded-btn font-semibold text-white bg-primary-500;
    @apply hover:bg-primary-600 disabled:opacity-50 transition-colors;
  }
}
</style>
