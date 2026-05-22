<template>
  <div>
    <ScreenHeading eyebrow="System · Settings" title="Tune the" emphasis="experience." />

    <!-- Coach -->
    <SectionHeader label="Coach" />

    <div class="settings-view__section-card">
      <SettingRow
        label="Wren's personality"
        description="How Wren speaks and coaches you."
      >
        <SegmentedControl
          :model-value="settings.coachPersonality ?? 'gentle'"
          :options="personalityOptions"
          @update:model-value="onPersonalityChange"
        />
      </SettingRow>

      <SettingRow
        label="Proactive check-ins"
        description="When Wren pings you during the day."
      >
        <div class="settings-view__check-in-row">
          <Button
            v-for="opt in CHECK_IN_OPTIONS"
            :key="opt"
            size="sm"
            :variant="hasCheckIn(opt) ? 'accent' : 'default'"
            @click="toggleCheckIn(opt)"
          >
            {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
          </Button>
        </div>
      </SettingRow>

      <SettingRow
        label="Stalled-project nudges"
        description="Remind you when a project has gone quiet."
      >
        <SegmentedControl
          :model-value="stalledNudge"
          :options="nudgeOptions"
          @update:model-value="onNudgeChange"
        />
      </SettingRow>
    </div>

    <!-- Look -->
    <SectionHeader label="Look" />

    <div class="settings-view__section-card">
      <SettingRow
        label="Theme"
        description="The color palette used across the app."
      >
        <SegmentedControl
          :model-value="settings.theme ?? 'warm'"
          :options="themeOptions"
          @update:model-value="onThemeChange"
        />
      </SettingRow>

      <SettingRow
        label="Appearance"
        description="Light or dark interface."
      >
        <SegmentedControl
          :model-value="settings.mode ?? 'light'"
          :options="modeOptions"
          @update:model-value="onModeChange"
        />
      </SettingRow>
    </div>

    <!-- Privacy -->
    <SectionHeader label="Privacy" />

    <div class="settings-view__section-card">
      <SettingRow
        label="Journal visibility"
        description="Who can see your journal entries."
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
import { useAuthStore } from '@/stores/auth.store.js'
import { useTheme } from '@/composables/useTheme.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SettingRow from '@/components/settings/SettingRow.vue'

// -- Coach --
const personalityOptions = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'direct', label: 'Direct' },
  { value: 'reflective', label: 'Reflective' },
]

const CHECK_IN_OPTIONS = ['morning', 'midday', 'evening', 'stuck']

const nudgeOptions = [
  { value: 4, label: '4 days' },
  { value: 7, label: '7 days' },
  { value: 10, label: '10 days' },
  { value: null, label: 'Never' },
]

// -- Look --
const themeOptions = [
  { value: 'warm', label: 'Warm' },
  { value: 'ink', label: 'Ink' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'rose', label: 'Rose' },
]

const modeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// -- Privacy --
const visibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'themed', label: 'Themed' },
  { value: 'open', label: 'Open' },
]

export default {
  name: 'SettingsView',
  components: { ScreenHeading, SectionHeader, Button, SegmentedControl, SettingRow },
  setup() {
    // -- State --
    const authStore = useAuthStore()
    const { setTheme, setMode } = useTheme()
    const { toastError } = useErrorToast()

    // -- Computed --

    /** Shorthand for the current user's settings object. */
    const settings = computed(() => authStore.user?.settings ?? {})

    /** Current stalled-nudge days value derived from settings. */
    const stalledNudge = computed(() => settings.value.stalledNudgeDays ?? null)

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
        toastError(e, 'Failed to update personality setting')
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
        toastError(e, 'Failed to update check-in setting')
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
        toastError(e, 'Failed to update nudge setting')
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
        toastError(e, 'Failed to update theme setting')
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
        toastError(e, 'Failed to update appearance setting')
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
        toastError(e, 'Failed to update visibility setting')
      }
    }

    return {
      authStore,
      settings,
      personalityOptions,
      CHECK_IN_OPTIONS,
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
