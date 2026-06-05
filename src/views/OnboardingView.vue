<template>
  <div class="onb">
    <!-- Top bar with stepper -->
    <header class="onb__bar">
      <span class="onb__mark">
        {{ t('onboarding.barMark') }} <em>
          {{ t('onboarding.barMarkEmphasis') }}
        </em>
      </span>

      <!-- Step indicator -->
      <div class="onb__stepper">
        <template v-for="s in STEP_COUNT" :key="s">
          <span
            :class="[
              'onb__dot',
              { 'onb__dot--now': step === s, 'onb__dot--done': step > s }
            ]"
          />

          <span v-if="s < STEP_COUNT" class="onb__line" />
        </template>
      </div>

      <!-- Skip button -->
      <button
        type="button"
        class="onb__skip"
        :disabled="busy"
        @click="next"
      >
        {{ t('onboarding.skip') }}
      </button>
    </header>

    <!-- Step card -->
    <section class="onb__card" :class="{ 'onb__card--ready': step === STEP_COUNT }">
      <!-- Initial-load skeleton: shown only before the first state resolves -->
      <AppSkeleton
        v-if="initialLoading"
        variant="card"
        :rows="3"
        :aria-label="t('common.loading')"
      />

      <!-- Initial-load failure: retryable error card -->
      <AppErrorState
        v-else-if="store.error"
        :message="store.error || t('common.loadError')"
        :retry-label="t('common.retry')"
        @retry="store.load()"
      />

      <!-- Step 1: welcome -->
      <template v-else-if="step === 1">
        <div class="onb__num">
          {{ t('onboarding.step1Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step1HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step1HeadingEmphasis') }}
          </em>
        </h2>

        <p class="onb__lede">
          {{ t('onboarding.step1Lede') }}
        </p>
      </template>

      <!-- Step 2: profile basics -->
      <template v-else-if="step === 2">
        <div class="onb__num">
          {{ t('onboarding.step2Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step2HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step2HeadingEmphasis') }}
          </em>
        </h2>

        <div class="onb__row">
          <label class="onb__field">
            <span class="onb__label">
              {{ t('onboarding.step2NameLabel') }}
            </span>

            <input v-model="form.name" class="onb__input" />
          </label>

          <label class="onb__field">
            <span class="onb__label">
              {{ t('onboarding.step2TimezoneLabel') }}
            </span>

            <input v-model="form.timezone" class="onb__input" />
          </label>
        </div>

        <div class="onb__field">
          <span class="onb__label">
            {{ t('onboarding.step2ThemeLabel') }}
          </span>

          <div class="onb__themes">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              :class="['onb__theme', { 'onb__theme--active': form.theme === theme.id }]"
              :style="{ '--swatch': theme.c }"
              @click="form.theme = theme.id"
            >
              <span class="onb__swatch" />
              {{ theme.name }}
            </button>
          </div>
        </div>
      </template>

      <!-- Step 3: tone picker -->
      <template v-else-if="step === 3">
        <div class="onb__num">
          {{ t('onboarding.step3Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step3HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step3HeadingEmphasis') }}
          </em>
        </h2>

        <p class="onb__lede">
          {{ t('onboarding.step3Lede') }}
        </p>

        <div class="onb__tones">
          <button
            v-for="tone in tones"
            :key="tone.id"
            type="button"
            :class="['onb__tone', { 'onb__tone--active': form.tone === tone.id }]"
            @click="form.tone = tone.id"
          >
            <span class="onb__tone-tag">
              {{ tone.tag }}
            </span>

            <span class="onb__tone-name">
              {{ tone.name }}
            </span>

            <span class="onb__tone-sample">
              "{{ tone.sample }}"
            </span>
          </button>
        </div>
      </template>

      <!-- Step 4: mode picker -->
      <template v-else-if="step === 4">
        <div class="onb__num">
          {{ t('onboarding.step4Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step4HeadingPrefix') }}<br />

          {{ t('onboarding.step4HeadingMiddle') }} <em>
            {{ t('onboarding.step4HeadingEmphasis') }}
          </em>
        </h2>

        <div class="onb__modes">
          <button
            v-for="m in modes"
            :key="m.id"
            type="button"
            :class="['onb__mode', { 'onb__mode--active': form.mode === m.id }]"
            @click="form.mode = m.id"
          >
            <div class="onb__mode-pic">
              <span
                v-for="i in 4"
                :key="i"
                :class="{ 'onb__mode-pic-tall': m.tall.includes(i - 1) }"
                :style="{
                  height: m.tall.includes(i - 1) ? '100%' : (40 - (i - 1) * 6) + '%'
                }"
              />
            </div>

            <div class="onb__mode-t">
              {{ m.title }}
            </div>

            <div class="onb__mode-d">
              {{ m.desc }}
            </div>
          </button>
        </div>
      </template>

      <!-- Step 5: daily-review check-in -->
      <template v-else-if="step === 5">
        <div class="onb__num">
          {{ t('onboarding.step5Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step5HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step5HeadingEmphasis') }}
          </em>
        </h2>

        <p class="onb__lede">
          {{ t('onboarding.step5Lede') }}
        </p>

        <div class="onb__field">
          <span class="onb__label">
            {{ t('onboarding.dailyReviewToggleLabel') }}
          </span>

          <div class="onb__toggle">
            <button
              type="button"
              :class="['onb__toggle-btn', { 'onb__toggle-btn--active': form.dailyReviewEnabled }]"
              @click="form.dailyReviewEnabled = true"
            >
              {{ t('onboarding.dailyReviewToggleOn') }}
            </button>

            <button
              type="button"
              :class="['onb__toggle-btn', { 'onb__toggle-btn--active': !form.dailyReviewEnabled }]"
              @click="form.dailyReviewEnabled = false"
            >
              {{ t('onboarding.dailyReviewToggleOff') }}
            </button>
          </div>
        </div>

        <div v-if="form.dailyReviewEnabled" class="onb__field">
          <span class="onb__label">
            {{ t('onboarding.dailyReviewTimeLabel') }}
          </span>

          <div class="onb__slots">
            <button
              v-for="slot in reviewSlots"
              :key="slot.id"
              type="button"
              :class="['onb__slot', { 'onb__slot--active': form.dailyReviewSlot === slot.id }]"
              @click="form.dailyReviewSlot = slot.id"
            >
              <AppIcon name="clock" :size="14" />
              {{ slot.name }}
            </button>
          </div>
        </div>

        <p v-else class="onb__hint">
          {{ t('onboarding.dailyReviewOffHint') }}
        </p>
      </template>

      <!-- Step 6: calendar sync (informational / skip-only) -->
      <template v-else-if="step === 6">
        <div class="onb__num">
          {{ t('onboarding.step6Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step6CalHeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step6CalHeadingEmphasis') }}
          </em>
        </h2>

        <p class="onb__lede">
          {{ t('onboarding.step6CalLede') }}
        </p>

        <div class="onb__cal-note">
          <AppIcon name="calendar" :size="18" />

          <div class="onb__cal-note-body">
            <div class="onb__cal-note-title">
              {{ t('onboarding.calendarConnectComingSoon') }}
            </div>

            <div class="onb__cal-note-sub">
              {{ t('onboarding.calendarConnectComingSoonDesc') }}
            </div>
          </div>
        </div>
      </template>

      <!-- Step 7: seeded items preview -->
      <template v-else-if="step === 7">
        <div class="onb__num">
          {{ t('onboarding.step7Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step7HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step7HeadingEmphasis') }}
          </em>
        </h2>

        <p class="onb__lede">
          {{ t('onboarding.step7Lede') }}
        </p>

        <div class="onb__seeded">
          <div v-for="(s, i) in seededList" :key="i" class="onb__seeded-row">
            <span class="onb__seeded-tag">
              {{ s.tag }}
            </span>

            <div class="onb__seeded-body">
              <div class="onb__seeded-title">
                {{ s.t }}
              </div>

              <div class="onb__seeded-sub">
                {{ s.sub }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 8: ready greeting -->
      <template v-else>
        <div class="onb__num">
          {{ t('onboarding.step8Eyebrow') }}
        </div>

        <h2 class="onb__h">
          {{ t('onboarding.step8HeadingPrefix') }}<br />

          <em>
            {{ t('onboarding.step8HeadingEmphasis') }}
          </em>
        </h2>

        <div class="onb__bubble">
          <div class="onb__bubble-when">
            {{ t('onboarding.wrenBubbleMeta', { tone: form.tone }) }}
          </div>

          <div class="onb__bubble-text">
            {{ readyGreeting }}
          </div>
        </div>
      </template>

      <!-- Footer nav -->
      <div v-if="!initialLoading && !store.error" class="onb__foot">
        <button
          v-if="step > 1"
          type="button"
          class="onb__btn-ghost"
          :disabled="busy"
          @click="back"
        >
          {{ backLabel }}
        </button>

        <span class="onb__spacer" />

        <button
          type="button"
          class="onb__btn-primary"
          :disabled="busy"
          @click="next"
        >
          <template v-if="busy">
            {{ t('common.loading') }}
          </template>

          <template v-else-if="step === STEP_COUNT">
            {{ t('onboarding.ctaOpenToday') }}
          </template>

          <template v-else-if="step === 7">
            {{ t('onboarding.ctaTakeMeIn') }}
          </template>

          <template v-else-if="step === 6">
            {{ t('onboarding.calendarSkipCta') }}
          </template>

          <template v-else-if="step === 1">
            {{ t('onboarding.ctaStart') }}
          </template>

          <template v-else>
            {{ t('onboarding.ctaContinue') }}
          </template>

          <AppIcon name="arrow-right" :size="14" />
        </button>
      </div>
    </section>
  </div>
</template>

<script>
/**
 * OnboardingView — eight-step first-run wizard. Persists progress through the
 * onboarding store so the user can resume mid-flow. completeOnboarding()
 * seeds one chore, one project, one inbox item, sets `onboardedAt`, and
 * routes to Today.
 *
 * Steps: 1 welcome · 2 profile (name/timezone/theme) · 3 tone · 4 mode ·
 * 5 daily-review check-in · 6 calendar sync (informational/skip-only) ·
 * 7 seed preview · 8 ready greeting.
 *
 * The daily-review step persists through the EXISTING user-settings
 * `checkIns` array (auth.updateSettings) rather than the onboarding state —
 * the same field the Settings screen edits — so the choice is a first-class
 * server-side preference, not onboarding-only scratch data. The calendar step
 * is purely informational: OAuth provider credentials are not configured
 * (gate G-19), so no connect flow is invoked; the user is pointed to Settings.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOnboardingStore } from '@/stores/onboarding.store.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { localTimezone } from '@/utils/date.js'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

// Total wizard steps. Bumped 6 -> 8 when the daily-review and calendar-sync
// steps landed; the stepper, progress dots, and finish branch all key off this.
const STEP_COUNT = 8

// Settings `checkIns` slot used when the user enables the daily review without
// picking another time. Mirrors the values the Settings screen persists.
const DEFAULT_REVIEW_SLOT = 'morning'
// The three time-of-day slots offered in onboarding. 'stuck' is a Settings-only
// reactive nudge, intentionally excluded from the daily-review picker here.
const REVIEW_SLOT_IDS = ['morning', 'midday', 'evening']

export default {
  name: 'OnboardingView',
  components: { AppIcon, AppErrorState, AppSkeleton },
  setup() {
    const { t } = useI18n()
    const store = useOnboardingStore()
    const auth = useAuthStore()
    const router = useRouter()

    const form = ref({
      name: 'Mara',
      timezone: localTimezone('Europe/Helsinki'),
      theme: 'warm',
      tone: 'warm',
      mode: 'solo',
      // Daily-review preference, persisted to user settings `checkIns`.
      dailyReviewEnabled: true,
      dailyReviewSlot: DEFAULT_REVIEW_SLOT
    })

    // True until the first state fetch resolves, so the wizard shows a skeleton
    // rather than a flash of default-step content on a cold load.
    const initialLoading = ref(true)
    // Guards the nav handlers against double-clicks while a mutation is in flight.
    const busy = ref(false)

    onMounted(async () => {
      try {
        await store.load()
      } finally {
        initialLoading.value = false
      }

      if (auth.user?.name) form.value.name = auth.user.name
      if (auth.user?.timezone) form.value.timezone = auth.user.timezone
      if (auth.user?.wrenTone) form.value.tone = auth.user.wrenTone
      // Re-hydrate the persisted picks so the highlighted mode/tone (and the
      // seed preview) match the server state after a mid-flow reload.
      if (store.tone) form.value.tone = store.tone
      if (store.mode) form.value.mode = store.mode

      // Re-hydrate the daily-review pick from the existing user settings so a
      // mid-flow reload (or a returning user who already set check-ins) keeps
      // the toggle and slot in sync with the server. An empty `checkIns` means
      // the user has opted out of proactive nudges.
      const checkIns = auth.user?.settings?.checkIns

      if (Array.isArray(checkIns)) {
        const slot = REVIEW_SLOT_IDS.find((id) => checkIns.includes(id))
        form.value.dailyReviewEnabled = !!slot
        if (slot) form.value.dailyReviewSlot = slot
      }
    })

    const step = computed(() => store.step)

    const themes = computed(() => [
      { id: 'warm', c: '#ff5a1f', name: t('onboarding.themeWarm') },
      { id: 'ink', c: '#1c6a35', name: t('onboarding.themeInk') },
      { id: 'blueprint', c: '#2563eb', name: t('onboarding.themeBlueprint') },
      { id: 'rose', c: '#d63b65', name: t('onboarding.themeRose') }
    ])

    const tones = computed(() => [
      { id: 'warm', name: t('onboarding.toneWarmName'), tag: t('onboarding.toneWarmTag'), sample: t('onboarding.toneWarmSample') },
      { id: 'direct', name: t('onboarding.toneDirectName'), tag: t('onboarding.toneDirectTag'), sample: t('onboarding.toneDirectSample') },
      { id: 'playful', name: t('onboarding.tonePlayfulName'), tag: t('onboarding.tonePlayfulTag'), sample: t('onboarding.tonePlayfulSample') },
      { id: 'gentle', name: t('onboarding.toneGentleName'), tag: t('onboarding.toneGentleTag'), sample: t('onboarding.toneGentleSample') }
    ])

    const modes = computed(() => [
      { id: 'solo', title: t('onboarding.modeSoloTitle'), desc: t('onboarding.modeSoloDesc'), tall: [1] },
      { id: 'partner', title: t('onboarding.modePartnerTitle'), desc: t('onboarding.modePartnerDesc'), tall: [0, 2] },
      { id: 'habits', title: t('onboarding.modeHabitsTitle'), desc: t('onboarding.modeHabitsDesc'), tall: [3] }
    ])

    const reviewSlots = computed(() => [
      { id: 'morning', name: t('onboarding.dailyReviewMorning') },
      { id: 'midday', name: t('onboarding.dailyReviewMidday') },
      { id: 'evening', name: t('onboarding.dailyReviewEvening') }
    ])

    const seedsByMode = computed(() => ({
      solo: [
        { tag: t('onboarding.seedTagChore'), t: t('onboarding.seedSoloChoreTitle'), sub: t('onboarding.seedSoloChoreSub') },
        { tag: t('onboarding.seedTagProject'), t: t('onboarding.seedSoloProjectTitle'), sub: t('onboarding.seedSoloProjectSub') },
        { tag: t('onboarding.seedTagInbox'), t: t('onboarding.seedSoloInboxTitle'), sub: t('onboarding.seedSoloInboxSub') }
      ],
      partner: [
        { tag: t('onboarding.seedTagChore'), t: t('onboarding.seedPartnerChoreTitle'), sub: t('onboarding.seedPartnerChoreSub') },
        { tag: t('onboarding.seedTagProject'), t: t('onboarding.seedPartnerProjectTitle'), sub: t('onboarding.seedPartnerProjectSub') },
        { tag: t('onboarding.seedTagInbox'), t: t('onboarding.seedPartnerInboxTitle'), sub: t('onboarding.seedPartnerInboxSub') }
      ],
      habits: [
        { tag: t('onboarding.seedTagChore'), t: t('onboarding.seedHabitsChoreOneTitle'), sub: t('onboarding.seedHabitsChoreOneSub') },
        { tag: t('onboarding.seedTagChore'), t: t('onboarding.seedHabitsChoreTwoTitle'), sub: t('onboarding.seedHabitsChoreTwoSub') },
        { tag: t('onboarding.seedTagProject'), t: t('onboarding.seedHabitsProjectTitle'), sub: t('onboarding.seedHabitsProjectSub') }
      ]
    }))

    const seededList = computed(() => seedsByMode.value[form.value.mode] ?? seedsByMode.value.solo)

    const readyByTone = computed(() => ({
      warm: t('onboarding.readyWarm'),
      direct: t('onboarding.readyDirect'),
      playful: t('onboarding.readyPlayful'),
      gentle: t('onboarding.readyGentle')
    }))

    const readyGreeting = computed(() => readyByTone.value[form.value.tone] ?? readyByTone.value.warm)
    const backLabel = computed(() => `← ${t('common.back')}`)

    return {
      t, store, step, form, themes, tones, modes, reviewSlots, seededList,
      readyGreeting, backLabel, initialLoading, busy, next, back, STEP_COUNT
    }

    // -- Function definitions --

    /**
     * Advance to the next onboarding step, or complete and route to Today on
     * the final step. Theme is persisted to the user settings after completion
     * so the choice survives the redirect.
     *
     * Step 5 (daily review) is special: before advancing, the chosen check-in
     * is persisted to the EXISTING user-settings `checkIns` array via
     * auth.updateSettings — the same field the Settings screen edits — so the
     * pick is a real server-side preference. updateSettings toasts and re-throws
     * on failure, so a failed save keeps the user on step 5 to retry (the step
     * advance below never runs). Step 6 (calendar) is informational/skip-only
     * and persists nothing.
     *
     * A failed persist call throws (the store toasts the error); we catch it
     * here so the wizard neither advances nor redirects on failure, leaving the
     * user on the same step to retry instead of on a silently-dead button.
     * `busy` guards against double-submits while a call is in flight.
     */
    async function next() {
      if (busy.value) return
      const current = step.value
      busy.value = true

      try {
        if (current === 5) await persistDailyReview()

        if (current < STEP_COUNT) {
          await store.update({ step: current + 1, ...buildPatch(current) })
        } else {
          await store.complete()

          try {
            await auth.updateSettings({ theme: form.value.theme })
          } catch {
            /* theme re-save is best-effort; it was already persisted at step 2 */
          }

          router.push({ name: 'today' })
        }
      } catch {
        /* store already surfaced the error toast; stay on the current step */
      } finally {
        busy.value = false
      }
    }

    /**
     * Persist the daily-review pick to the user-settings `checkIns` array.
     * Preserves any non-time-of-day slots already set elsewhere (e.g. the
     * Settings-only 'stuck' nudge), swaps in the chosen morning/midday/evening
     * slot when enabled, and clears all time slots when disabled. Throws on
     * failure (updateSettings toasts) so the caller does not advance the step.
     */
    async function persistDailyReview() {
      const existing = auth.user?.settings?.checkIns ?? []
      // Keep slots the onboarding picker doesn't manage (e.g. 'stuck').
      const preserved = existing.filter((id) => !REVIEW_SLOT_IDS.includes(id))

      const checkIns = form.value.dailyReviewEnabled
        ? [...preserved, form.value.dailyReviewSlot]
        : preserved

      await auth.updateSettings({ checkIns })
    }

    /**
     * Derive the patch payload to send with a step advance, picking only the
     * form fields collected on the current step.
     * @param {number} currentStep - 1-indexed step number.
     * @returns {object}
     */
    function buildPatch(currentStep) {
      const patch = {}
      if (currentStep === 2) {
        patch.name = form.value.name
        patch.timezone = form.value.timezone
        patch.theme = form.value.theme
      } else if (currentStep === 3) patch.tone = form.value.tone
      else if (currentStep === 4) patch.mode = form.value.mode
      return patch
    }

    /**
     * Step back one position in the onboarding flow. No collected field is lost
     * (the API only $sets fields present in the input); a failed write toasts
     * and keeps the user on the current step.
     */
    async function back() {
      if (busy.value || step.value <= 1) return
      busy.value = true

      try {
        await store.update({ step: step.value - 1 })
      } catch {
        /* store already surfaced the error toast; stay put */
      } finally {
        busy.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.onb {
  @apply mx-auto flex max-w-[820px] flex-col gap-7 px-6 pb-20 pt-10;
}

.onb__bar {
  @apply flex items-center gap-3.5;
}
.onb__mark {
  @apply font-serif italic;
  font-size: 22px;
}
.onb__mark em { @apply font-medium; font-style: italic; }
.onb__stepper {
  @apply flex flex-1 items-center gap-2 px-6 font-mono;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}
.onb__dot {
  @apply h-2 w-2 rounded-full;
  background: var(--rule-soft);

  &--done { background: var(--ink); }
  &--now {
    background: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 18%, transparent);
  }
}
.onb__line {
  @apply h-px min-w-[16px] flex-1;
  background: var(--rule-soft);
}
.onb__skip {
  @apply text-xs;
  color: var(--muted);
}

.onb__card {
  @apply flex flex-col gap-6 overflow-hidden rounded-[22px] p-14 shadow-md;
  background: var(--paper-2);
  min-height: 440px;

  &--ready {
    background: var(--paper-2);
  }
}
.onb__num {
  @apply font-mono uppercase;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
}
.onb__h {
  @apply mt-1 font-serif font-normal;
  font-size: 52px;
  line-height: 1;
  letter-spacing: -0.015em;

  em { font-style: italic; }
}
.onb__lede {
  @apply max-w-lg font-serif italic;
  color: var(--ink-2);
  font-size: 22px;
  line-height: 1.35;
  margin: 0;
}

.onb__row {
  @apply grid gap-3;
  grid-template-columns: 1fr 1fr;
}
.onb__field { @apply flex flex-col gap-1.5; }
.onb__label {
  @apply font-mono uppercase;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}
.onb__input {
  @apply w-full rounded-xl border border-rule-soft px-4 py-3 font-sans text-[16px];
  background: var(--paper);
  color: var(--ink);

  &:focus { outline: none; border-color: var(--muted); }
}

.onb__themes { @apply flex flex-wrap gap-2; }
.onb__theme {
  @apply inline-flex items-center gap-1.5 rounded-full border border-rule-soft px-4 py-2 text-[13px];

  &--active {
    color: var(--paper);
    background: var(--swatch);
    border-color: var(--swatch);
  }
}
.onb__swatch {
  @apply mr-1 h-3 w-3 rounded-full;
  background: var(--swatch);
}

.onb__hint {
  @apply text-[13px];
  color: var(--muted);
  margin: 0;
}

.onb__toggle {
  @apply inline-flex gap-1 rounded-full border border-rule-soft p-1;
  background: var(--paper);
  width: fit-content;
}
.onb__toggle-btn {
  @apply rounded-full px-4 py-1.5 text-[13px];
  color: var(--ink-2);

  &--active {
    background: var(--ink);
    color: var(--paper);
  }
}

.onb__slots { @apply flex flex-wrap gap-2; }
.onb__slot {
  @apply inline-flex items-center gap-1.5 rounded-full border border-rule-soft px-4 py-2 text-[13px];
  background: var(--paper);
  color: var(--ink);

  &--active {
    background: var(--accent);
    color: var(--accent-ink);
    border-color: var(--accent);
  }
}

.onb__cal-note {
  @apply flex items-start gap-3 rounded-[14px] border border-rule-soft p-5;
  background: var(--paper);
  color: var(--ink);
}
.onb__cal-note-body { @apply flex-1; }
.onb__cal-note-title { @apply text-[14px] font-medium; }
.onb__cal-note-sub {
  @apply mt-1 text-[13px] leading-snug;
  color: var(--muted);
}

.onb__tones {
  @apply grid gap-3;
  grid-template-columns: repeat(2, 1fr);
}
.onb__tone {
  @apply flex cursor-pointer flex-col gap-1.5 rounded-[14px] border border-rule-soft p-5 text-left;
  background: var(--paper);

  &:hover { background: var(--paper-3); }
  &--active {
    background: var(--paper-3);
    border-color: var(--ink);
  }
}
.onb__tone-tag {
  @apply font-mono uppercase;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}
.onb__tone-name {
  @apply font-serif italic leading-none;
  font-size: 22px;
}
.onb__tone-sample {
  @apply mt-2 text-[14px];
  color: var(--ink-2);
  line-height: 1.45;
}

.onb__modes {
  @apply grid gap-3;
  grid-template-columns: repeat(3, 1fr);
}
.onb__mode {
  @apply flex cursor-pointer flex-col gap-2 rounded-[14px] border border-rule-soft p-5 text-left;
  background: var(--paper);
  min-height: 180px;

  &--active {
    background: var(--paper-3);
    border-color: var(--ink);
  }
}
.onb__mode-pic {
  @apply flex h-14 items-end gap-1;
}
.onb__mode-pic > span {
  @apply flex-1 rounded-t;
  background: var(--rule-soft);

  &.onb__mode-pic-tall { background: var(--accent); }
}
.onb__mode-t {
  @apply font-serif italic leading-none;
  font-size: 22px;
}
.onb__mode-d {
  @apply text-[13px] leading-snug;
  color: var(--muted);
}

.onb__seeded { @apply flex flex-col gap-2.5; }
.onb__seeded-row {
  @apply flex items-center gap-3.5 rounded-xl border border-rule-soft px-4 py-3;
  background: var(--paper);
}
.onb__seeded-tag {
  @apply w-[70px] font-mono uppercase;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}
.onb__seeded-body { @apply flex-1; }
.onb__seeded-title { @apply text-[14px] font-medium; }
.onb__seeded-sub {
  @apply mt-0.5 text-xs;
  color: var(--muted);
}

.onb__bubble {
  @apply max-w-[540px] rounded-[18px] p-4 shadow-md;
  background: var(--accent);
  color: var(--accent-ink);
}
.onb__bubble-when {
  @apply text-xs;
  color: color-mix(in oklab, var(--accent-ink) 80%, transparent);
  margin-bottom: 4px;
}
.onb__bubble-text {
  font-size: 17px;
  line-height: 1.5;
}

.onb__foot {
  @apply mt-auto flex items-center gap-3 pt-3.5;
}
.onb__spacer { @apply flex-1; }
.onb__btn-ghost {
  @apply inline-flex items-center gap-2 rounded-full border border-rule-soft bg-transparent px-4 py-2 text-[13px];
  color: var(--ink);
}
.onb__btn-primary {
  @apply inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
}
</style>
