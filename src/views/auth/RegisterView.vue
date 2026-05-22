<template>
  <div>
    <h2 class="mb-6 font-serif text-[22px] text-ink">
      Create your <em>
        account.
      </em>
    </h2>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <TextField
        v-model="name"
        type="text"
        :label="t('auth.name')"
      />

      <TextField
        v-model="email"
        type="email"
        :label="t('auth.email')"
      />

      <TextField
        v-model="password"
        type="password"
        :label="t('auth.password')"
      />

      <p v-if="error" class="text-sm text-bad">
        {{ error }}
      </p>

      <Button
        variant="accent"
        type="submit"
        :disabled="loading"
        size="md"
        class="w-full justify-center"
      >
        {{ loading ? t('common.loading') : t('auth.registerCta') }}
      </Button>

      <p class="text-center text-sm text-muted">
        {{ t('auth.hasAccount') }}
        <router-link to="/auth/login" class="text-accent hover:underline">
          {{ t('auth.loginCta') }}
        </router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

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
</script>
