<template>
  <div>
    <!-- Heading -->
    <h2 class="mb-2 font-serif text-[22px] text-ink">
      Forgot your <em>
        password?
      </em>
    </h2>

    <p class="mb-6 text-sm text-muted">
      {{ t('auth.forgotPasswordDesc') }}
    </p>

    <!-- Success state -->
    <div v-if="sent" class="space-y-4 text-center">
      <p class="text-sm text-ink">
        {{ t('auth.forgotPasswordSuccess') }}
      </p>

      <router-link to="/auth/login" class="text-sm text-accent hover:underline">
        {{ t('auth.backToLogin') }}
      </router-link>
    </div>

    <!-- Form -->
    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Email field -->
      <TextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
        autocomplete="email"
      />

      <!-- Error message -->
      <p v-if="error" class="text-sm text-bad">
        {{ error }}
      </p>

      <!-- Submit button -->
      <Button
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="w-full justify-center"
      >
        {{ loading ? t('common.loading') : t('auth.forgotPasswordCta') }}
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

/**
 * Submit the forgot-password request.
 * Always transitions to the success state on completion
 * to avoid leaking whether an email exists.
 */
async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await authStore.forgotPassword(email.value)
    sent.value = true
  } catch {
    // Show success state regardless to prevent email enumeration
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
