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
  </div>
</template>

<script>
/** SettingsView — user preferences for coach personality, check-ins, theme, and privacy. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'
import { useTheme } from '@/composables/useTheme.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SettingRow from '@/components/settings/SettingRow.vue'

// Internal check-in slot values; labels are resolved via i18n inside setup
// so they react to locale changes (WEB-W4-09).
const CHECK_IN_VALUES = ['morning', 'midday', 'evening', 'stuck']

export default {
  name: 'SettingsView',
  components: { ScreenHeading, SectionHeader, Button, SegmentedControl, SettingRow },
  setup() {
    // -- State --
    const { t } = useI18n()
    const authStore = useAuthStore()
    const { setTheme, setMode } = useTheme()
    const { toastError } = useErrorToast()

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

    return {
      t,
      authStore,
      settings,
      personalityOptions,
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
}
</style>
