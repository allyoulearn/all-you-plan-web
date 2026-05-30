<template>
  <div>
    <AppScreenHeading
      :eyebrow="`${t('nav.system')} · ${t('settings.title')}`"
      :title="t('settings.headingPrefix')"
      :emphasis="t('settings.headingEmphasis')"
    />

    <!-- Coach -->
    <AppSectionHeader :label="t('settings.sectionCoach')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.personalityLabel')"
        :description="t('settings.personalityDescription')"
      >
        <AppSegmentedControl
          :model-value="settings.coachPersonality ?? 'gentle'"
          :options="personalityOptions"
          @update:model-value="onPersonalityChange"
        />
      </SettingRow>

      <SettingRow
        :label="t('settings.checkInsLabel')"
        :description="t('settings.checkInsDescription')"
      >
        <div class="settings-view__check-in-row">
          <AppButton
            v-for="opt in checkInOptions"
            :key="opt.value"
            size="sm"
            :variant="hasCheckIn(opt.value) ? 'accent' : 'default'"
            @click="toggleCheckIn(opt.value)"
          >
            {{ opt.label }}
          </AppButton>
        </div>
      </SettingRow>

      <SettingRow
        :label="t('settings.nudgeLabel')"
        :description="t('settings.nudgeDescription')"
      >
        <AppSegmentedControl
          :model-value="stalledNudge"
          :options="nudgeOptions"
          @update:model-value="onNudgeChange"
        />
      </SettingRow>
    </div>

    <!-- Look -->
    <AppSectionHeader :label="t('settings.sectionLook')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.themeLabel')"
        :description="t('settings.themeDescription')"
      >
        <AppSegmentedControl
          :model-value="settings.theme ?? 'warm'"
          :options="themeOptions"
          @update:model-value="onThemeChange"
        />
      </SettingRow>

      <SettingRow
        :label="t('settings.modeLabel')"
        :description="t('settings.modeDescription')"
      >
        <AppSegmentedControl
          :model-value="settings.mode ?? 'light'"
          :options="modeOptions"
          @update:model-value="onModeChange"
        />
      </SettingRow>
    </div>

    <!-- Language -->
    <AppSectionHeader :label="t('settings.sectionLanguage')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.languageLabel')"
        :description="t('settings.languageDescription')"
      >
        <select
          :value="locale"
          class="settings-view__language-select"
          :aria-label="t('settings.languageLabel')"
          data-testid="language-select"
          @change="onLanguageChange($event.target.value)"
        >
          <option v-for="opt in languageOptions" :key="opt.code" :value="opt.code">
            {{ opt.name }}
          </option>
        </select>
      </SettingRow>
    </div>

    <!-- Billing -->
    <AppSectionHeader :label="t('settings.sectionBilling')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.billingPlanLabel')"
        :description="planDescription"
      >
        <div class="settings-view__billing-plan">
          <SparklesIcon
            v-if="isPaid"
            class="settings-view__billing-icon settings-view__billing-icon--paid"
            aria-hidden="true"
          />

          <span class="settings-view__billing-tier">
            {{ planLabel }}
          </span>

          <span v-if="nextBillingLabel" class="settings-view__billing-next">
            {{ nextBillingLabel }}
          </span>
        </div>
      </SettingRow>

      <SettingRow
        v-if="!isPaid"
        :label="t('settings.billingUpgradeLabel')"
        :description="t('settings.billingUpgradeDescription')"
      >
        <AppButton
          variant="primary"
          size="sm"
          class="settings-view__billing-cta"
          @click="onUpgradeClick"
        >
          <SparklesIcon class="settings-view__billing-cta-icon" aria-hidden="true" />
          {{ t('settings.billingUpgradeCta') }}
        </AppButton>
      </SettingRow>

      <SettingRow
        v-if="isPaid"
        :label="t('settings.billingManageLabel')"
        :description="t('settings.billingManageDescription')"
      >
        <AppButton
          variant="default"
          size="sm"
          :disabled="!isPaid"
          @click="onManageClick"
        >
          {{ t('settings.billingManageCta') }}
        </AppButton>
      </SettingRow>

      <SettingRow
        :label="t('settings.calendarSectionLabel')"
        :description="calendarConnectDescription"
      >
        <AppButton
          variant="default"
          size="sm"
          :disabled="calendarConnecting"
          @click="onConnectCalendarClick"
        >
          {{ calendarConnectLabel }}
        </AppButton>
      </SettingRow>
    </div>

    <!-- Privacy -->
    <AppSectionHeader :label="t('settings.sectionPrivacy')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.visibilityLabel')"
        :description="t('settings.visibilityDescription')"
      >
        <AppSegmentedControl
          :model-value="settings.journalVisibility ?? 'private'"
          :options="visibilityOptions"
          @update:model-value="onVisibilityChange"
        />
      </SettingRow>
    </div>

    <!-- Notifications + Onboarding deep links -->
    <AppSectionHeader :label="t('settings.sectionMore')" />

    <div class="settings-view__section-card">
      <RouterLink :to="{ name: 'notifications' }" class="settings-view__link-row">
        <div class="settings-view__link-text">
          <span class="settings-view__link-label">
            {{ t('settings.moreNotificationsLabel') }}
          </span>

          <span class="settings-view__link-desc">
            {{ t('settings.moreNotificationsDesc') }}
          </span>
        </div>

        <ChevronRightIcon class="settings-view__link-arrow" aria-hidden="true" />
      </RouterLink>

      <button type="button" class="settings-view__link-row" @click="onRestartOnboarding">
        <div class="settings-view__link-text">
          <span class="settings-view__link-label">
            {{ t('settings.moreRestartLabel') }}
          </span>

          <span class="settings-view__link-desc">
            {{ t('settings.moreRestartDesc') }}
          </span>
        </div>

        <ChevronRightIcon class="settings-view__link-arrow" aria-hidden="true" />
      </button>
    </div>

    <!-- Upgrade modal -->
    <UpgradeProModal v-model="upgradeModalOpen" />

    <!-- Password -->
    <AppSectionHeader :label="t('settings.passwordSectionLabel')" />

    <div class="settings-view__password">
      <h4>
        {{ t('settings.passwordSectionHeading') }}
      </h4>

      <p>
        {{ t('settings.passwordSectionDescription') }}
      </p>

      <div class="settings-view__password-field">
        <label :for="passwordCurrentId">
          {{ t('settings.currentPasswordLabel') }}
        </label>

        <input
          :id="passwordCurrentId"
          v-model="passwordCurrent"
          type="password"
          autocomplete="current-password"
        />
      </div>

      <div class="settings-view__password-field">
        <label :for="passwordNewId">
          {{ t('settings.newPasswordLabel') }}
        </label>

        <input
          :id="passwordNewId"
          v-model="passwordNew"
          type="password"
          autocomplete="new-password"
        />
      </div>

      <div class="settings-view__password-field">
        <label :for="passwordConfirmId">
          {{ t('settings.confirmPasswordLabel') }}
        </label>

        <input
          :id="passwordConfirmId"
          v-model="passwordConfirm"
          type="password"
          autocomplete="new-password"
        />
      </div>

      <p
        v-if="passwordError"
        class="settings-view__password-error"
        role="alert"
        data-testid="password-error"
      >
        {{ passwordError }}
      </p>

      <p
        v-if="passwordSuccess"
        class="settings-view__password-success"
        data-testid="password-success"
      >
        {{ t('settings.changePasswordSuccess') }}
      </p>

      <AppButton
        variant="primary"
        :disabled="passwordSubmitting || !passwordReady"
        @click="onChangePassword"
      >
        {{ passwordSubmitting ? t('settings.changePasswordCtaSubmitting') : t('settings.changePasswordCta') }}
      </AppButton>
    </div>

    <!-- Danger -->
    <AppSectionHeader :label="t('settings.dangerZone')" />

    <div class="settings-view__danger">
      <h4>
        {{ t('settings.dangerHeading') }}
      </h4>

      <p>
        {{ t('settings.dangerDescription') }}
      </p>

      <div class="settings-view__danger-field">
        <span>
          {{ t('settings.dangerConfirmLabel') }}
        </span>

        <input
          v-model="deleteConfirm"
          type="email"
          :placeholder="t('settings.dangerConfirmPlaceholder')"
        />
      </div>

      <AppButton variant="primary" :disabled="!deleteConfirm" @click="onDelete">
        {{ t('settings.dangerCta') }}
      </AppButton>
    </div>
  </div>
</template>

<script>
/** SettingsView — user preferences for coach personality, check-ins, theme, privacy,
 *  and deep-link entries for the notifications, onboarding, and danger sub-pages. */
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import { useTheme } from '@/composables/useTheme.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { useOnboardingStore } from '@/stores/onboarding.store.js'
import { SparklesIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import UpgradeProModal from '@/components/billing/UpgradeProModal.vue'
import { useBilling } from '@/composables/useBilling.js'
import { SUPPORTED_LOCALES, setLocale } from '@/i18n/index.js'

/**
 * Resolve the i18n key for a billing tier identifier. Falls back to free
 * label key when tier is missing or unknown. Resolution happens inside the
 * component setup so the label tracks locale changes.
 * @param {string} tier
 * @returns {string} i18n key
 */
function tierLabelKey(tier) {
  if (tier === 'pro') return 'settings.billingPlanPro'
  if (tier === 'family') return 'settings.billingPlanFamily'
  return 'settings.billingPlanFree'
}

// Internal check-in slot values; labels are resolved via i18n inside setup
// so they react to locale changes.
const CHECK_IN_VALUES = ['morning', 'midday', 'evening', 'stuck']

export default {
  name: 'SettingsView',
  components: { AppScreenHeading, AppSectionHeader, AppButton, AppSegmentedControl, SettingRow, RouterLink, SparklesIcon, ChevronRightIcon, UpgradeProModal },
  setup() {
    // -- State --
    const { t, locale } = useI18n()
    const authStore = useAuthStore()
    const onboardingStore = useOnboardingStore()
    const router = useRouter()
    const { setTheme, setMode } = useTheme()
    const { toastError } = useErrorToast()
    const billing = useBilling()
    const deleteConfirm = ref('')
    const upgradeModalOpen = ref(false)

    // -- Change password state --
    const passwordCurrent = ref('')
    const passwordNew = ref('')
    const passwordConfirm = ref('')
    const passwordError = ref('')
    const passwordSuccess = ref(false)
    const passwordSubmitting = ref(false)
    // Unique field ids so multiple SettingsView instances (unlikely but safe)
    // and stacked label/input pairs do not collide.
    const passwordCurrentId = 'settings-password-current'
    const passwordNewId = 'settings-password-new'
    const passwordConfirmId = 'settings-password-confirm'

    /** True when all three password fields are non-empty — submit gate. */
    const passwordReady = computed(() =>
      passwordCurrent.value.length > 0 &&
      passwordNew.value.length > 0 &&
      passwordConfirm.value.length > 0
    )

    // -- Computed --

    /** Shorthand for the current user's settings object. */
    const settings = computed(() => authStore.user?.settings ?? {})

    /** Current stalled-nudge days value derived from settings. */
    const stalledNudge = computed(() => settings.value.stalledNudgeDays ?? null)

    /** Localised AppSegmentedControl option lists. */
    const personalityOptions = computed(() => [
      { value: 'gentle', label: t('settings.personalityGentle') },
      { value: 'direct', label: t('settings.personalityDirect') },
      { value: 'reflective', label: t('settings.personalityReflective') },
    ])

    const checkInOptions = computed(() => [
      { value: 'morning', label: t('settings.checkInMorning') },
      { value: 'midday', label: t('settings.checkInMidday') },
      { value: 'evening', label: t('settings.checkInEvening') },
      { value: 'stuck', label: t('settings.checkInStuck') },
    ])

    const nudgeOptions = computed(() => [
      { value: 4, label: t('settings.nudge4Days') },
      { value: 7, label: t('settings.nudge7Days') },
      { value: 10, label: t('settings.nudge10Days') },
      { value: null, label: t('settings.nudgeNever') },
    ])

    const themeOptions = computed(() => [
      { value: 'warm', label: t('settings.themeWarm') },
      { value: 'ink', label: t('settings.themeInk') },
      { value: 'blueprint', label: t('settings.themeBlueprint') },
      { value: 'rose', label: t('settings.themeRose') },
    ])

    const modeOptions = computed(() => [
      { value: 'light', label: t('settings.modeLight') },
      { value: 'dark', label: t('settings.modeDark') },
    ])

    const visibilityOptions = computed(() => [
      { value: 'private', label: t('settings.visibilityPrivate') },
      { value: 'themed', label: t('settings.visibilityThemed') },
      { value: 'open', label: t('settings.visibilityOpen') },
    ])

    // Language options come from the i18n module's exported metadata so the
    // picker stays in lockstep with the shipped locale bundles. Native names
    // are intentional — a user who can't read the current UI language still
    // recognises their own.
    const languageOptions = computed(() => SUPPORTED_LOCALES)

    // -- Billing computeds --
    // Read directly off the auth store so the screen stays reactive after a
    // future webhook push updates the cached User. The subscription field is
    // server-managed (see API resolver in src/domains/auth/resolvers.ts) and
    // defaults to a Free shape for legacy users with no subdocument.
    const subscription = computed(() => authStore.user?.subscription ?? {})
    const planLabel = computed(() => t(tierLabelKey(subscription.value.tier)))
    const isPaid = computed(() => billing.isPaid())

    /**
     * Format the renewal/expiry date for the Plan row description. Returns an
     * empty string when no period end is set (Free tier or stale cache).
     * The "Ends"/"Renews" verbs are i18n keys so cancel confirmation copy
     * tracks the active locale.
     */
    const nextBillingLabel = computed(() => {
      const end = subscription.value.currentPeriodEnd
      if (!end) return ''
      const d = new Date(end)
      if (Number.isNaN(d.getTime())) return ''

      const formatted = d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      const status = subscription.value.status
      // 'canceled' (Stripe's past-spelling) → "Ends" framing so cancel
      // confirmation is unambiguous. Everything else renews.
      const key = status === 'canceled' ? 'settings.billingEndsOn' : 'settings.billingRenewsOn'
      return t(key, { date: formatted })
    })

    const planDescription = computed(() => {
      if (subscription.value.tier === 'pro') return t('settings.billingPlanProDesc')
      if (subscription.value.tier === 'family') return t('settings.billingPlanFamilyDesc')
      return t('settings.billingPlanFreeDesc')
    })

    // -- Google Calendar connect --

    /**
     * Tracks whether the OAuth round-trip is in flight so we can disable the
     * button and prevent a double-click from opening two consent windows.
     */
    const calendarConnecting = ref(false)

    /** Label flips between tiers so Free users see "Available on Pro" rather
     *  than a confusing "Connect" that would just bounce them to checkout. */
    const calendarConnectLabel = computed(() => {
      if (calendarConnecting.value) return t('settings.calendarConnectingCta')
      return isPaid.value
        ? t('settings.calendarConnectCta')
        : t('settings.calendarConnectFreeCta')
    })

    const calendarConnectDescription = computed(() => {
      return isPaid.value
        ? t('settings.calendarConnectProDesc')
        : t('settings.calendarConnectFreeDesc')
    })

    // OAuth callback handler. The API redirects back to
    // /settings?connection=success or ?connection=error&message=... after
    // the user accepts/denies on Google. We surface a toast and strip the
    // query params via router.replace so a refresh doesn't re-trigger.
    const route = useRoute()

    onMounted(() => {
      const status = route.query.connection

      if (status === 'success') {
        toast.success(t('settings.calendarConnectSuccessTitle'), {
          description: t('settings.calendarConnectSuccessDesc'),
        })
      } else if (status === 'error') {
        // The `message` slug is informational only — already sanitised by
        // the API route. Surfaced inside an i18n template so the framing
        // copy tracks the active locale.
        const message = typeof route.query.message === 'string' ? route.query.message : ''

        toast.error(t('settings.calendarConnectErrorTitle'), {
          description: message
            ? t('settings.calendarConnectErrorCode', { code: message })
            : t('settings.calendarConnectErrorRetry'),
        })
      }

      if (status) {
        // Remove the query so a refresh / back-button doesn't re-fire the
        // toast. Replace not push so the back-stack stays clean.
        router.replace({ name: 'settings' })
      }
    })

    return {
      t,
      locale,
      authStore,
      settings,
      personalityOptions,
      languageOptions,
      onLanguageChange,
      // Billing
      planLabel,
      planDescription,
      isPaid,
      nextBillingLabel,
      upgradeModalOpen,
      onUpgradeClick,
      onManageClick,
      // Calendar connect
      calendarConnecting,
      calendarConnectLabel,
      calendarConnectDescription,
      onConnectCalendarClick,
      // CHECK_IN_OPTIONS retained for backwards-compatible tests that still
      // reference the raw value list ( keeps the slot names internal
      // but exposes the localised labels via checkInOptions).
      CHECK_IN_OPTIONS: CHECK_IN_VALUES,
      checkInOptions,
      nudgeOptions,
      stalledNudge,
      themeOptions,
      modeOptions,
      visibilityOptions,
      hasCheckIn,
      onPersonalityChange,
      toggleCheckIn,
      onNudgeChange,
      onThemeChange,
      onModeChange,
      onVisibilityChange,
      deleteConfirm,
      onRestartOnboarding,
      onDelete,
      // Change password
      passwordCurrent,
      passwordNew,
      passwordConfirm,
      passwordError,
      passwordSuccess,
      passwordSubmitting,
      passwordReady,
      passwordCurrentId,
      passwordNewId,
      passwordConfirmId,
      onChangePassword
    }

    // -- Function definitions --

    /**
     * Validates the change-password form and calls the auth store. Inline
     * validation matches the reset-password flow: minimum length is 8, and
     * `confirm` must equal `new`. Server errors (wrong current password,
     * weak password rejected upstream) surface via passwordError.value.
     */
    async function onChangePassword() {
      passwordError.value = ''
      passwordSuccess.value = false

      if (passwordNew.value.length < 8) {
        passwordError.value = t('settings.changePasswordErrorLength')
        return
      }

      if (passwordNew.value !== passwordConfirm.value) {
        passwordError.value = t('settings.changePasswordErrorMatch')
        return
      }

      passwordSubmitting.value = true

      try {
        await authStore.changePassword(passwordCurrent.value, passwordNew.value)
        passwordSuccess.value = true
        passwordCurrent.value = ''
        passwordNew.value = ''
        passwordConfirm.value = ''
      } catch (e) {
        passwordError.value = e?.message || t('settings.changePasswordErrorGeneric')
      } finally {
        passwordSubmitting.value = false
      }
    }

    /** Confirm with the user, then reset the onboarding flow and route into it. */
    async function onRestartOnboarding() {
      if (!window.confirm(t('settings.moreRestartConfirm'))) return
      await onboardingStore.restart()
      router.push({ name: 'onboarding' })
    }

    /**
     * Permanently delete the user's account after a two-step confirmation
     * (matching email in the input + native confirm dialog). On success the
     * store has already torn down local auth, so we just route to /login.
     */
    async function onDelete() {
      const value = deleteConfirm.value.trim()
      if (!value) return
      if (!window.confirm(t('settings.dangerConfirmPrompt'))) return

      try {
        // Store action mutates the server, then clears local auth so the SPA
        // is in a clean signed-out state before we route to /login.
        await authStore.deleteAccount(value)
        router.push({ name: 'login' })
      } catch (e) {
        toastError(e, t('settings.dangerError'))
      }
    }

    /**
     * Returns true if the given check-in slot is currently enabled.
     * @param {string} val - Check-in slot name.
     * @returns {boolean}
     */
    function hasCheckIn(val) {
      return (settings.value.checkIns ?? []).includes(val)
    }

    /**
     * Persists the coach personality setting.
     * @param {string} val - Personality option value.
     */
    async function onPersonalityChange(val) {
      try {
        await authStore.updateSettings({ coachPersonality: val })
      } catch (e) {
        toastError(e, t('settings.errorPersonality'))
      }
    }

    /**
     * Toggles the given check-in slot on or off and persists the change.
     * @param {string} val - Check-in slot name.
     */
    async function toggleCheckIn(val) {
      const current = settings.value.checkIns ?? []

      const next = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val]

      try {
        await authStore.updateSettings({ checkIns: next })
      } catch (e) {
        toastError(e, t('settings.errorCheckIn'))
      }
    }

    /**
     * Persists the stalled-nudge days setting.
     * @param {number|null} val - Days threshold, or null for never.
     */
    async function onNudgeChange(val) {
      try {
        await authStore.updateSettings({ stalledNudgeDays: val })
      } catch (e) {
        toastError(e, t('settings.errorNudge'))
      }
    }

    /**
     * Applies the theme and persists the setting.
     * @param {string} val - Theme name.
     */
    async function onThemeChange(val) {
      setTheme(val)

      try {
        await authStore.updateSettings({ theme: val })
      } catch (e) {
        toastError(e, t('settings.errorTheme'))
      }
    }

    /**
     * Applies the color mode and persists the setting.
     * @param {string} val - Mode name ('light' or 'dark').
     */
    async function onModeChange(val) {
      setMode(val)

      try {
        await authStore.updateSettings({ mode: val })
      } catch (e) {
        toastError(e, t('settings.errorMode'))
      }
    }

    /**
     * Persists the journal visibility setting.
     * @param {string} val - Visibility option value.
     */
    async function onVisibilityChange(val) {
      try {
        await authStore.updateSettings({ journalVisibility: val })
      } catch (e) {
        toastError(e, t('settings.errorVisibility'))
      }
    }

    /**
     * Switch the active UI language. Persistence lives in the i18n module
     * (localStorage + <html lang>) so a hard refresh keeps the choice.
     * @param {string} code - Supported locale code (e.g. 'en', 'es', 'pt-BR').
     */
    function onLanguageChange(code) {
      setLocale(code)
    }

    /** Open the upgrade modal so the user can pick a billing cadence before
     *  bouncing to Stripe Checkout. */
    function onUpgradeClick() {
      upgradeModalOpen.value = true
    }

    /** Open the Stripe Billing portal for the current subscription. */
    function onManageClick() {
      billing.openPortal()
    }

    /**
     * Single entry point for the calendar-connect button. On Free we
     * delegate to the upgrade flow (the server would error anyway), on Pro
     * we open the OAuth consent URL. The server-side `connectGoogleCalendar`
     * mutation is idempotent so double-click is safe; the local
     * `calendarConnecting` ref just prevents a second consent window.
     */
    async function onConnectCalendarClick() {
      if (calendarConnecting.value) return

      // Short-circuit free users to the upgrade flow — keeps the click
      // single-purpose for analytics ("calendar-connect intent" vs
      // "upgrade intent" both attribute to this surface) and avoids the
      // round-trip-to-error pattern.
      if (!isPaid.value) {
        upgradeModalOpen.value = true
        return
      }

      calendarConnecting.value = true

      try {
        await billing.connectGoogleCalendar()
      } finally {
        calendarConnecting.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-view {
  &__section-card {
    @apply rounded-md bg-paper-2 px-4 shadow-sm divide-y divide-rule-soft;
  }

  &__check-in-row {
    @apply flex gap-1.5;
  }

  &__language-select {
    @apply rounded-xl border border-rule-soft px-3 py-2 text-[13px];
    background: var(--paper);
    color: var(--ink);
    min-width: 9rem;

    &:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
  }

  &__billing-plan {
    @apply flex items-center gap-2;
  }
  &__billing-icon {
    @apply h-4 w-4;

    &--paid {
      color: var(--accent);
    }
  }
  &__billing-tier {
    @apply text-[14px] font-medium;
  }
  &__billing-next {
    @apply font-mono uppercase tracking-wider;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.14em;
  }
  &__billing-cta {
    @apply inline-flex items-center gap-1.5;
  }
  &__billing-cta-icon {
    @apply h-4 w-4;
  }
  &__link-row {
    @apply flex w-full items-center justify-between gap-4 border-b border-rule-soft px-1 py-3.5 text-left transition-colors;
    color: var(--ink);

    &:hover { color: var(--accent); }
    &:hover .settings-view__link-arrow { color: var(--accent); }
    &:last-child { @apply border-b-0; }
  }
  &__link-text {
    @apply flex min-w-0 flex-col gap-0.5;
  }
  &__link-label {
    @apply text-[14px] font-medium;
  }
  &__link-desc {
    @apply text-[12px] leading-snug;
    color: var(--muted);
  }
  &__link-arrow {
    @apply h-4 w-4 shrink-0 transition-colors;
    color: var(--muted);
  }
  &__password {
    @apply mt-4 flex flex-col gap-3 rounded-[14px] p-5;
    background: var(--paper-2);
    border: 1px solid var(--rule-soft);

    h4 {
      @apply m-0 text-[15px];
      color: var(--ink);
    }
    p {
      @apply m-0 text-[13px] leading-snug;
      color: var(--ink-2);
    }
  }
  &__password-field {
    @apply flex flex-col gap-1.5;

    label {
      @apply font-mono uppercase;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 0.14em;
    }
    input {
      @apply w-full rounded-xl border border-rule-soft px-4 py-3 text-[14px];
      background: var(--paper);
      color: var(--ink);
    }
  }
  &__password-error {
    @apply m-0 text-[13px] leading-snug;
    color: var(--bad);
  }
  &__password-success {
    @apply m-0 text-[13px] leading-snug;
    color: var(--ok);
  }
  &__danger {
    @apply mt-4 flex flex-col gap-2.5 rounded-[14px] p-5;
    background: color-mix(in oklab, var(--bad) 6%, var(--paper-2));
    border: 1px solid color-mix(in oklab, var(--bad) 25%, var(--rule-soft));

    h4 {
      @apply m-0 text-[15px];
      color: var(--bad);
    }
    p {
      @apply m-0 text-[13px] leading-snug;
      color: var(--ink-2);
    }
  }
  &__danger-field {
    @apply mt-2 flex flex-col gap-1.5;

    span {
      @apply font-mono uppercase;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 0.14em;
    }
    input {
      @apply w-full rounded-xl border border-rule-soft px-4 py-3 text-[14px];
      background: var(--paper);
    }
  }
}
</style>
