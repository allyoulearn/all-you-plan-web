<template>
  <div class="settings-view">
    <h1 class="settings-view__title">{{ t('settings.title') }}</h1>

    <!-- Profile section -->
    <GlassCard class="settings-view__section">
      <h2 class="settings-view__section-title">{{ t('settings.profile') }}</h2>

      <div class="settings-view__field">
        <label class="settings-view__label" for="settings-name">Name</label>
        <input
          id="settings-name"
          v-model="form.name"
          type="text"
          class="settings-view__input"
          placeholder="Your name"
        />
      </div>

      <div class="settings-view__field">
        <label class="settings-view__label" for="settings-timezone">{{ t('settings.timezone') }}</label>
        <select id="settings-timezone" v-model="form.timezone" class="settings-view__select">
          <option v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
        </select>
      </div>

      <div class="settings-view__field">
        <label class="settings-view__label" for="settings-briefing-time">{{ t('settings.briefingTime') }}</label>
        <input
          id="settings-briefing-time"
          v-model="form.briefingTime"
          type="time"
          class="settings-view__input settings-view__input--short"
        />
      </div>
    </GlassCard>

    <!-- Notifications section -->
    <GlassCard class="settings-view__section">
      <h2 class="settings-view__section-title">{{ t('settings.notifications') }}</h2>

      <div class="settings-view__field">
        <label class="settings-view__label" for="settings-nudge">{{ t('settings.nudgeFrequency') }}</label>
        <select id="settings-nudge" v-model="form.nudgeFrequency" class="settings-view__select">
          <option value="normal">Normal</option>
          <option value="minimal">Minimal</option>
          <option value="off">Off</option>
        </select>
      </div>

      <div class="settings-view__field">
        <label class="settings-view__label">{{ t('settings.quietHours') }}</label>
        <div class="settings-view__time-range">
          <input
            v-model="form.quietStart"
            type="time"
            class="settings-view__input settings-view__input--short"
            aria-label="Quiet hours start"
          />
          <span class="settings-view__time-sep">to</span>
          <input
            v-model="form.quietEnd"
            type="time"
            class="settings-view__input settings-view__input--short"
            aria-label="Quiet hours end"
          />
        </div>
      </div>
    </GlassCard>

    <!-- Appearance section -->
    <GlassCard class="settings-view__section">
      <h2 class="settings-view__section-title">{{ t('settings.theme') }}</h2>

      <div class="settings-view__field">
        <label class="settings-view__label">{{ t('settings.darkMode') }}</label>
        <p class="settings-view__static-value">Dark (default)</p>
      </div>

      <div class="settings-view__field">
        <label class="settings-view__label" for="settings-language">{{ t('settings.language') }}</label>
        <select id="settings-language" v-model="form.language" class="settings-view__select settings-view__select--short">
          <option value="en">English</option>
        </select>
      </div>
    </GlassCard>

    <!-- Save button -->
    <button
      class="settings-view__save"
      :disabled="saving"
      @click="handleSave"
    >
      <span v-if="saving">
        <span class="settings-view__save-spinner" />
      </span>
      <span v-else>{{ t('settings.save') }}</span>
    </button>

    <!-- Logout -->
    <div class="settings-view__logout-wrap">
      <button class="settings-view__logout" @click="handleLogout">
        <ArrowRightOnRectangleIcon class="settings-view__logout-icon" />
        {{ t('settings.logout') }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth.store'
import GlassCard from '@/components/common/GlassCard.vue'

// Common timezone list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (ART)' },
  { value: 'Europe/London', label: 'GMT / London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)' },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Karachi', label: 'Pakistan Time (PKT)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Time (BST)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)' },
]

export default {
  name: 'SettingsView',
  components: {
    ArrowRightOnRectangleIcon,
    GlassCard,
  },
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const authStore = useAuthStore()

    // ── State ──

    /** Whether a save request is in flight */
    const saving = ref(false)

    /** Editable form values populated from the current user object */
    const form = ref({
      name: '',
      timezone: 'UTC',
      briefingTime: '08:00',
      nudgeFrequency: 'normal',
      quietStart: '22:00',
      quietEnd: '08:00',
      language: 'en',
    })

    // ── Lifecycle ──

    onMounted(() => {
      const user = authStore.user
      if (!user) return
      form.value.name = user.name || ''
      form.value.timezone = user.timezone || 'UTC'
      form.value.briefingTime = user.briefingTime || '08:00'
      form.value.nudgeFrequency = user.nudgeFrequency || 'normal'
      form.value.quietStart = user.quietStart || '22:00'
      form.value.quietEnd = user.quietEnd || '08:00'
      form.value.language = user.language || 'en'
    })

    // ── Handlers ──

    /** Save changed profile fields and show a success toast. */
    async function handleSave() {
      saving.value = true
      try {
        await authStore.updateProfile({ ...form.value })
        toast.success('Settings saved')
      } catch {
        toast.error(t('common.error'))
      } finally {
        saving.value = false
      }
    }

    /** Log out and redirect to the login screen. */
    async function handleLogout() {
      await authStore.logout()
      router.push('/auth/login')
    }

    return {
      t,
      TIMEZONES,
      form,
      saving,
      handleSave,
      handleLogout,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.settings-view {
  @apply flex flex-col gap-5 p-4 max-w-xl;

  // ── Title ──
  &__title {
    @apply text-xl font-bold text-primary-400 m-0;
  }

  // ── Section card ──
  &__section {
    @apply px-5 py-5 flex flex-col gap-4;
  }

  &__section-title {
    @apply text-sm font-semibold text-secondary-300 m-0 uppercase tracking-wider;
  }

  // ── Field ──
  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-xs font-medium text-secondary-500 uppercase tracking-wider;
  }

  &__static-value {
    @apply text-sm text-secondary-400 m-0;
  }

  // ── Inputs ──
  &__input {
    @apply w-full bg-white/5 border border-white/10 rounded-input;
    @apply px-3 py-2 text-sm text-secondary-200 outline-none;
    @apply transition-all duration-150;
    color-scheme: dark;

    &:focus {
      @apply border-primary-400/50 bg-white/[0.08];
    }

    &--short {
      @apply w-40;
    }
  }

  &__select {
    @apply w-full bg-white/5 border border-white/10 rounded-input;
    @apply px-3 py-2 text-sm text-secondary-200 outline-none;
    @apply transition-all duration-150;
    color-scheme: dark;

    &:focus {
      @apply border-primary-400/50;
    }

    option {
      @apply bg-secondary-900 text-secondary-200;
    }

    &--short {
      @apply w-40;
    }
  }

  // ── Time range ──
  &__time-range {
    @apply flex items-center gap-2;
  }

  &__time-sep {
    @apply text-xs text-secondary-500;
  }

  // ── Save button ──
  &__save {
    @apply w-full py-2.5 rounded-btn text-sm font-semibold cursor-pointer;
    @apply bg-primary-500 text-white border-none;
    @apply flex items-center justify-center gap-2;
    @apply transition-all duration-150;

    &:hover:not(:disabled) {
      @apply bg-primary-400;
    }

    &:disabled {
      @apply opacity-60 cursor-not-allowed;
    }
  }

  &__save-spinner {
    @apply w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin;
    display: inline-block;
  }

  // ── Logout section ──
  &__logout-wrap {
    @apply flex justify-center pt-2;
  }

  &__logout {
    @apply flex items-center gap-2 px-4 py-2 rounded-btn text-sm cursor-pointer;
    @apply bg-transparent border border-white/10 text-secondary-500;
    @apply transition-all duration-150;

    &:hover {
      @apply border-white/20 text-secondary-300 bg-white/5;
    }
  }

  &__logout-icon {
    @apply w-4 h-4;
  }
}
</style>
