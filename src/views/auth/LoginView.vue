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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
</script>
