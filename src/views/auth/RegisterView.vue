<template>
  <div class="register-view">
    <h2 class="text-xl font-semibold text-secondary-100 mb-4">{{ t('auth.register') }}</h2>
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.name') }}</label>
        <input v-model="name" type="text" required
          class="register-view__input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.email') }}</label>
        <input v-model="email" type="email" required
          class="register-view__input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-300 mb-1">{{ t('auth.password') }}</label>
        <input v-model="password" type="password" required
          class="register-view__input" />
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <button type="submit" :disabled="loading"
        class="register-view__btn">
        {{ loading ? t('common.loading') : t('auth.registerCta') }}
      </button>
      <p class="text-center text-sm text-secondary-400">
        {{ t('auth.hasAccount') }}
        <router-link to="/auth/login" class="text-primary-400 hover:underline">
          {{ t('auth.loginCta') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'RegisterView',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const authStore = useAuthStore()

    const name = ref('')
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    async function handleRegister() {
      error.value = ''
      loading.value = true
      try {
        await authStore.register(email.value, password.value, name.value)
        router.push('/')
      } catch (err) {
        error.value = err?.graphQLErrors?.[0]?.message || 'Registration failed'
      } finally {
        loading.value = false
      }
    }

    return {
      t, name, email, password, error, loading,
      handleRegister,
    }
  },
}
</script>

<style lang="scss" scoped>
.register-view {
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
