<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SettingRow from '@/components/settings/SettingRow.vue'

const authStore = useAuthStore()
const { setTheme, setMode } = useTheme()

const settings = computed(() => authStore.user?.settings ?? {})

// --- Coach ---
const personalityOptions = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'direct', label: 'Direct' },
  { value: 'reflective', label: 'Reflective' },
]

const CHECK_IN_OPTIONS = ['morning', 'midday', 'evening', 'stuck']

function hasCheckIn(val) {
  return (settings.value.checkIns ?? []).includes(val)
}

async function toggleCheckIn(val) {
  const current = settings.value.checkIns ?? []
  const next = current.includes(val)
    ? current.filter((v) => v !== val)
    : [...current, val]
  await authStore.updateSettings({ checkIns: next })
}

const nudgeOptions = [
  { value: 4, label: '4 days' },
  { value: 7, label: '7 days' },
  { value: 10, label: '10 days' },
  { value: null, label: 'Never' },
]

const stalledNudge = computed(() => settings.value.stalledNudgeDays ?? null)

async function onNudgeChange(val) {
  await authStore.updateSettings({ stalledNudgeDays: val })
}

// --- Look ---
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

async function onThemeChange(val) {
  setTheme(val)
  await authStore.updateSettings({ theme: val })
}

async function onModeChange(val) {
  setMode(val)
  await authStore.updateSettings({ mode: val })
}

// --- Privacy ---
const visibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'themed', label: 'Themed' },
  { value: 'open', label: 'Open' },
]
</script>

<template>
  <div>
    <ScreenHeading eyebrow="System · Settings" title="Tune the" emphasis="experience." />

    <!-- Coach -->
    <SectionHeader label="Coach" />
    <div class="rounded-md bg-paper-2 px-4 shadow-sm divide-y divide-rule-soft">
      <SettingRow
        label="Wren's personality"
        description="How Wren speaks and coaches you."
      >
        <SegmentedControl
          :model-value="settings.coachPersonality ?? 'gentle'"
          :options="personalityOptions"
          @update:model-value="authStore.updateSettings({ coachPersonality: $event })"
        />
      </SettingRow>

      <SettingRow
        label="Proactive check-ins"
        description="When Wren pings you during the day."
      >
        <div class="flex gap-1.5">
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
    <div class="rounded-md bg-paper-2 px-4 shadow-sm divide-y divide-rule-soft">
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
    <div class="rounded-md bg-paper-2 px-4 shadow-sm divide-y divide-rule-soft">
      <SettingRow
        label="Journal visibility"
        description="Who can see your journal entries."
      >
        <SegmentedControl
          :model-value="settings.journalVisibility ?? 'private'"
          :options="visibilityOptions"
          @update:model-value="authStore.updateSettings({ journalVisibility: $event })"
        />
      </SettingRow>
    </div>
  </div>
</template>
