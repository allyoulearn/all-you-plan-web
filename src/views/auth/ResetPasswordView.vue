<template>
  <div>
    <!-- Heading -->
    <h2 class="mb-6 font-serif text-[22px] text-ink">
      Reset your <em>password.</em>
    </h2>

    <!-- Token missing / invalid error state -->
    <div v-if="!token" class="space-y-3 text-center">
      <p class="text-sm text-bad">{{ t('auth.resetTokenInvalid') }}</p>

      <router-link to="/auth/forgot-password" class="text-sm text-accent hover:underline">
        {{ t('auth.forgotPasswordCta') }}
      </router-link>
    </div>

    <!-- Reset form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <!-- New password field -->
      <TextField
        v-model="newPassword"
        type="password"
        :label="t('auth.newPassword')"
        autocomplete="new-password"
      />

      <!-- Confirm password field -->
      <TextField
        v-model="confirmPassword"
        type="password"
        :label="t('auth.confirmPassword')"
        autocomplete="new-password"
      />

      <!-- Password strength hints -->
      <ul class="flex flex-wrap gap-x-3 gap-y-1">
        <li :class="['text-xs transition-colors', hints.length ? 'text-ok' : 'text-muted']">
          8+ characters
        </li>

        <li :class="['text-xs transition-colors', hints.upper ? 'text-ok' : 'text-muted']">
          Uppercase letter
        </li>

        <li :class="['text-xs transition-colors', hints.lower ? 'text-ok' : 'text-muted']">
          Lowercase letter
        </li>

        <li :class="['text-xs transition-colors', hints.digit ? 'text-ok' : 'text-muted']">
          Number
        </li>
      </ul>

      <!-- Error message -->
      <p v-if="error" class="text-sm text-bad">{{ error }}</p>

      <!-- Submit button -->
      <Button variant="accent" type="submit" :disabled="loading || !isPasswordValid" size="md" class="w-full justify-center">
        {{ loading ? t('common.loading') : t('auth.resetPasswordCta') }}
      </Button>

      <!-- Back to login link -->
      <p class="text-center text-sm text-muted">
        <router-link to="/auth/login" class="text-accent hover:underline">
          {{ t('auth.backToLogin') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => route.query.token || '')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

/** Individual password strength checks */
const hints = computed(() => ({
  length: newPassword.value.length >= 8,
  upper: /[A-Z]/.test(newPassword.value),
  lower: /[a-z]/.test(newPassword.value),
  digit: /[0-9]/.test(newPassword.value),
}))

/** True only when all password requirements are satisfied */
const isPasswordValid = computed(() => {
  const h = hints.value
  return h.length && h.upper && h.lower && h.digit
})

/**
 * Validate and submit the password reset.
 * Redirects to dashboard on success.
 */
async function handleSubmit() {
  error.value = ''

  if (!isPasswordValid.value) {
    error.value = t('auth.passwordWeak')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = t('auth.passwordMismatch')
    return
  }

  loading.value = true
  try {
    await authStore.resetPassword(token.value, newPassword.value)
    router.push('/')
  } catch (err) {
    error.value = err?.graphQLErrors?.[0]?.message || t('auth.resetTokenInvalid')
  } finally {
    loading.value = false
  }
}
</script>
