<template>
  <div>
    <ScreenHeading eyebrow="System · Settings" title="Tune the" emphasis="experience." />

    <!-- Coach -->
    <SectionHeader :label="t('settings.sectionCoach')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.personalityLabel')"
        :description="t('settings.personalityDescription')"
      >
        <SegmentedControl
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
          <Button
            v-for="opt in checkInOptions"
            :key="opt.value"
            size="sm"
            :variant="hasCheckIn(opt.value) ? 'accent' : 'default'"
            @click="toggleCheckIn(opt.value)"
          >
            {{ opt.label }}
          </Button>
        </div>
      </SettingRow>

      <SettingRow
        :label="t('settings.nudgeLabel')"
        :description="t('settings.nudgeDescription')"
      >
        <SegmentedControl
          :model-value="stalledNudge"
          :options="nudgeOptions"
          @update:model-value="onNudgeChange"
        />
      </SettingRow>
    </div>

    <!-- Look -->
    <SectionHeader :label="t('settings.sectionLook')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.themeLabel')"
        :description="t('settings.themeDescription')"
      >
        <SegmentedControl
          :model-value="settings.theme ?? 'warm'"
          :options="themeOptions"
          @update:model-value="onThemeChange"
        />
      </SettingRow>

      <SettingRow
        :label="t('settings.modeLabel')"
        :description="t('settings.modeDescription')"
      >
        <SegmentedControl
          :model-value="settings.mode ?? 'light'"
          :options="modeOptions"
          @update:model-value="onModeChange"
        />
      </SettingRow>
    </div>

    <!-- Billing -->
    <SectionHeader label="Billing" />

    <div class="settings-view__section-card">
      <SettingRow
        label="Current plan"
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
        label="Upgrade to Pro"
        description="200 Wren turns/day, calendar sync, and everything we ship next."
      >
        <Button
          variant="primary"
          size="sm"
          class="settings-view__billing-cta"
          @click="onUpgradeClick"
        >
          <SparklesIcon class="settings-view__billing-cta-icon" aria-hidden="true" />
          Upgrade to Pro
        </Button>
      </SettingRow>

      <SettingRow
        v-if="isPaid"
        label="Manage subscription"
        description="Update your card, view invoices, or cancel via Stripe."
      >
        <Button
          variant="default"
          size="sm"
          :disabled="!isPaid"
          title="Stripe portal coming soon"
          @click="onManageClick"
        >
          Open Stripe portal
        </Button>
      </SettingRow>
    </div>

    <!-- Privacy -->
    <SectionHeader :label="t('settings.sectionPrivacy')" />

    <div class="settings-view__section-card">
      <SettingRow
        :label="t('settings.visibilityLabel')"
        :description="t('settings.visibilityDescription')"
      >
        <SegmentedControl
          :model-value="settings.journalVisibility ?? 'private'"
          :options="visibilityOptions"
          @update:model-value="onVisibilityChange"
        />
      </SettingRow>
    </div>

    <!-- Notifications, Household, Onboarding deep links -->
    <SectionHeader label="More" />

    <div class="settings-view__section-card">
      <RouterLink :to="{ name: 'notifications' }" class="settings-view__link-row">
        <span class="settings-view__link-label">
          Notifications
        </span>

        <span class="settings-view__link-desc">
          Channels, per-category, quiet hours, devices
        </span>

        <span class="settings-view__link-arrow">
          →
        </span>
      </RouterLink>

      <RouterLink :to="{ name: 'household' }" class="settings-view__link-row">
        <span class="settings-view__link-label">
          Household
        </span>

        <span class="settings-view__link-desc">
          Plan with one other person
        </span>

        <span class="settings-view__link-arrow">
          →
        </span>
      </RouterLink>

      <button type="button" class="settings-view__link-row" @click="onRestartOnboarding">
        <span class="settings-view__link-label">
          Restart onboarding
        </span>

        <span class="settings-view__link-desc">
          Walk through setup again
        </span>

        <span class="settings-view__link-arrow">
          →
        </span>
      </button>
    </div>

    <!-- Danger -->
    <SectionHeader label="Danger zone" />

    <div class="settings-view__danger">
      <h4>
        Delete your account
      </h4>

      <p>
        Permanently removes your tasks, projects, chores, journal, inbox, calendar, and Wren
        memory. Data is purged within 30 days. There is no undo.
      </p>

      <div class="settings-view__danger-field">
        <span>
          Type your email to confirm
        </span>

        <input v-model="deleteConfirm" type="email" placeholder="you@example.com" />
      </div>

      <Button variant="primary" :disabled="!deleteConfirm" @click="onDelete">
        Permanently delete account
      </Button>
    </div>
  </div>
</template>

<script>
/** SettingsView — user preferences for coach personality, check-ins, theme, privacy,
 *  and deep-link entries for the notifications, household, onboarding, and danger sub-pages. */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import { useTheme } from '@/composables/useTheme.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { useOnboardingStore } from '@/stores/onboarding.store.js'
import { apolloClient } from '@/api/apollo.js'
import { DELETE_ACCOUNT } from '@/api/operations/index.js'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import { useBilling } from '@/composables/useBilling.js'

/**
 * Capitalise the first character of a tier identifier for display.
 * `free` -> `Free`, `pro` -> `Pro`, `family` -> `Family`.
 * @param {string} tier
 * @returns {string}
 */
function tierLabel(tier) {
  if (!tier) return 'Free'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

// Internal check-in slot values; labels are resolved via i18n inside setup
// so they react to locale changes (WEB-W4-09).
const CHECK_IN_VALUES = ['morning', 'midday', 'evening', 'stuck']

export default {
  name: 'SettingsView',
  components: { ScreenHeading, SectionHeader, Button, SegmentedControl, SettingRow, RouterLink, SparklesIcon },
  setup() {
    // -- State --
    const { t } = useI18n()
    const authStore = useAuthStore()
    const onboardingStore = useOnboardingStore()
    const router = useRouter()
    const { setTheme, setMode } = useTheme()
    const { toastError } = useErrorToast()
    const billing = useBilling()
    const deleteConfirm = ref('')

    async function onRestartOnboarding() {
      if (!window.confirm('Restart onboarding? Your data stays put.')) return
      await onboardingStore.restart()
      router.push({ name: 'onboarding' })
    }

    async function onDelete() {
      const value = deleteConfirm.value.trim()
      if (!value) return
      if (!window.confirm('Delete your account permanently?')) return
      try {
        await apolloClient.mutate({
          mutation: DELETE_ACCOUNT,
          variables: { emailConfirmation: value }
        })
        await authStore.logout?.()
        router.push({ name: 'login' })
      } catch (e) {
        toastError(e, 'Failed to delete account')
      }
    }

    // -- Computed --

    /** Shorthand for the current user's settings object. */
    const settings = computed(() => authStore.user?.settings ?? {})

    /** Current stalled-nudge days value derived from settings. */
    const stalledNudge = computed(() => settings.value.stalledNudgeDays ?? null)

    /** Localised SegmentedControl option lists (WEB-W4-09). */
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

    // -- Function definitions --

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

    // -- Billing computeds --
    // Read directly off the auth store so the screen stays reactive after a
    // future webhook push updates the cached User. The subscription field is
    // server-managed (see API resolver in src/domains/auth/resolvers.ts) and
    // defaults to a Free shape for legacy users with no subdocument.
    const subscription = computed(() => authStore.user?.subscription ?? {})
    const planLabel = computed(() => tierLabel(subscription.value.tier))
    const isPaid = computed(() => billing.isPaid())

    /**
     * Format the renewal/expiry date for the Plan row description. Returns an
     * empty string when no period end is set (Free tier or stale cache).
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
      // 'canceled' (past Stripe spelling) means the user opted out — frame the
      // date as "ends on" rather than "renews on" so cancel confirmation is
      // unambiguous.
      const verb = status === 'canceled' ? 'Ends' : 'Renews'
      return `${verb} ${formatted}`
    })

    const planDescription = computed(() => {
      if (subscription.value.tier === 'pro') return 'Pro · 200 Wren turns/day, calendar sync, all paid features.'
      if (subscription.value.tier === 'family') return 'Family · up to 5 seats sharing one plan.'
      return 'Free · 5 Wren turns/day, single-user, no calendar sync.'
    })

    function onUpgradeClick() {
      billing.startUpgrade('wren-pro')
    }

    function onManageClick() {
      billing.openPortal()
    }

    return {
      t,
      authStore,
      settings,
      personalityOptions,
      // Billing
      planLabel,
      planDescription,
      isPaid,
      nextBillingLabel,
      onUpgradeClick,
      onManageClick,
      // CHECK_IN_OPTIONS retained for backwards-compatible tests that still
      // reference the raw value list (WEB-W4-09 keeps the slot names internal
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
      onDelete
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
    @apply flex w-full items-center gap-3 border-b border-rule-soft px-4 py-3 text-left;

    &:last-child { @apply border-b-0; }
  }
  &__link-label { @apply text-[14px] font-medium; }
  &__link-desc {
    @apply flex-1 text-xs;
    color: var(--muted);
  }
  &__link-arrow {
    color: var(--muted);
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
