<template>
  <div class="review-view">
    <!-- Progress strip: 5-segment track with the step caption inline at the
         right so the eye picks up "where you are" in one glance. Hidden on
         the finale because the closer is the moment, not another step. -->
    <header v-if="!isFinale" class="review-view__progress">
      <ol
        class="review-view__progress-track"
        :aria-label="t('nav.itemDailyReview')"
      >
        <li v-for="n in TOTAL_STEPS" :key="n" class="review-view__progress-item">
          <button
            type="button"
            class="review-view__progress-dot"
            :class="{
              'review-view__progress-dot--active': currentStep === n,
              'review-view__progress-dot--done': n < currentStep
            }"
            :aria-current="currentStep === n ? 'step' : 'false'"
            :aria-label="t('review.stepOf', { n, total: TOTAL_STEPS })"
            @click="goToStep(n)"
          />
        </li>
      </ol>

      <p class="review-view__progress-caption">
        <span class="review-view__progress-step">
          {{ t('review.stepOf', { n: currentStep, total: TOTAL_STEPS }) }}
        </span>
        <span class="review-view__progress-sep">·</span>
        <span class="review-view__progress-label">
          {{ t(`review.stepLabel.${currentStepKey}`) }}
        </span>
      </p>
    </header>

    <!-- Step content. One section visible at a time, with a soft fade between. -->
    <Transition name="review-fade" mode="out-in">
      <div :key="currentStep" ref="stepRef" class="review-view__step">
        <template v-if="currentStep === 1">
          <h1 class="review-view__prompt">{{ t('review.wren.open') }}</h1>
          <p v-if="headlineCallout" class="review-view__callout">{{ headlineCallout }}</p>
          <MoodPicker v-model="mood" class="review-view__body" />
        </template>

        <template v-else-if="currentStep === 2">
          <h1 class="review-view__prompt">{{ t('review.wren.wins') }}</h1>
          <WinPicker v-model="wins" :tasks="doneTasks" class="review-view__body" />
        </template>

        <template v-else-if="currentStep === 3">
          <h1 class="review-view__prompt">{{ t('review.wren.friction') }}</h1>
          <FrictionInput v-model="friction" class="review-view__body" />
        </template>

        <template v-else-if="currentStep === 4">
          <h1 class="review-view__prompt">{{ t('review.wren.leftovers') }}</h1>

          <div v-if="pendingTasks.length" class="review-view__body">
            <button type="button" class="review-view__bulk" @click="moveAllToTomorrow">
              {{ t('review.leftover.moveAll') }}
            </button>

            <LeftoverRow
              v-for="task in pendingTasks"
              :key="task.id"
              :task="task"
              :action="leftoverAction(task.id)"
              @update:action="kind => setLeftover(task.id, kind)"
            />
          </div>

          <p v-else class="review-view__empty">
            {{ t('review.leftover.empty') }}
          </p>
        </template>

        <template v-else-if="currentStep === 5">
          <h1 class="review-view__prompt">{{ t('review.wren.intent') }}</h1>
          <TomorrowIntent
            v-model="tomorrowIntent"
            class="review-view__body"
            @keydown.enter.prevent="next"
          />
        </template>

        <template v-else>
          <!-- Finale: dynamic send-off + Finish. -->
          <SendoffCard
            :input="sendoffInput"
            :saving="reviewStore.saving"
            :disabled="!mood"
            :saved="saved && !editing"
            @finish="finishReview"
            @edit="onEdit"
          />

          <p v-if="reviewStore.error" class="review-view__error">
            {{ reviewStore.error }}
          </p>
        </template>
      </div>
    </Transition>

    <!-- Step navigation. Anchored to the bottom of the column so the Next
         button never floats in the middle of the page. -->
    <nav v-if="!isFinale" class="review-view__nav">
      <AppButton
        v-if="currentStep > 1"
        variant="ghost"
        @click="prev"
      >
        ← {{ t('review.back') }}
      </AppButton>

      <span v-else />

      <AppButton
        variant="primary"
        :disabled="!canAdvance"
        @click="next"
      >
        {{ nextLabel }} →
      </AppButton>
    </nav>

    <!-- Wren cross-app upsell only on the finale — the close is the emotional
         close; the upsell is an offer beneath. -->
    <WrenCrossAppUpsell
      v-if="isFinale && showWrenUpsell"
      class="review-view__upsell"
      plan="managed_multi_monthly"
      @dismiss="onDismissWrenUpsell"
    />
  </div>
</template>

<script>
/**
 * ReviewView — Wren-led daily review delivered as a 5-step stepper plus a
 * send-off finale. One decision per screen so it's quick to fill in daily:
 * mood, wins, friction, leftovers, tomorrow intent. The finale composes the
 * dynamic send-off from the assembled state and persists everything on
 * Finish.
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/ui/AppButton.vue'
import MoodPicker from '@/components/review/MoodPicker.vue'
import WinPicker from '@/components/review/WinPicker.vue'
import FrictionInput from '@/components/review/FrictionInput.vue'
import LeftoverRow from '@/components/review/LeftoverRow.vue'
import TomorrowIntent from '@/components/review/TomorrowIntent.vue'
import SendoffCard from '@/components/review/SendoffCard.vue'
import WrenCrossAppUpsell from '@/components/wren/WrenCrossAppUpsell.vue'

import { useTodayStore } from '@/stores/today.store.js'
import { useReviewStore } from '@/stores/review.store.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { localISOToday, toLocalISODate } from '@/utils/date.js'
import { diffLeftovers } from '@/components/review/leftoverDiff.js'

const TOTAL_STEPS = 5
const FINALE_STEP = TOTAL_STEPS + 1

const STEP_KEYS = ['mood', 'wins', 'friction', 'leftovers', 'intent']

const WREN_UPSELL_DISMISSED_KEY = 'wren-cross-app-upsell-dismissed'

function localISOTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toLocalISODate(d)
}

function emptyResponses() {
  return {
    wins: { starred: [], freeText: '' },
    friction: { text: '', tags: [] },
    leftovers: { tomorrow: [], picked: [], dropped: [], kept: [] },
    tomorrowIntent: ''
  }
}

export default {
  name: 'ReviewView',
  components: {
    AppButton,
    MoodPicker,
    WinPicker,
    FrictionInput,
    LeftoverRow,
    TomorrowIntent,
    SendoffCard,
    WrenCrossAppUpsell
  },
  setup() {
    const { t } = useI18n()
    const { toastSuccess, toastError } = useErrorToast()
    const todayStore = useTodayStore()
    const reviewStore = useReviewStore()

    // -- Local state (canonical for the in-progress review) --
    const mood = ref('')
    const wins = ref({ starred: [], freeText: '' })
    const friction = ref({ text: '', tags: [] })
    const leftoverActions = ref({}) // taskId -> { kind, date? }
    const tomorrowIntent = ref('')
    const editing = ref(false)
    const currentStep = ref(1)
    const stepRef = ref(null)

    const todayDate = localISOToday()
    const tomorrow = localISOTomorrow()

    const showWrenUpsell = ref(
      typeof window === 'undefined'
        ? true
        : window.localStorage.getItem(WREN_UPSELL_DISMISSED_KEY) !== 'true'
    )

    // -- Computed --

    const doneTasks = computed(() => (todayStore.view?.tasks ?? []).filter(t => t.done))
    const pendingTasks = computed(() => (todayStore.view?.tasks ?? []).filter(t => !t.done))

    const headlineCallout = computed(() => {
      const total = todayStore.view?.kpis?.todayTotal ?? 0
      const streak = todayStore.view?.kpis?.streak ?? 0
      if (total === 0 || streak === 0) return ''
      const done = todayStore.view?.kpis?.todayDone ?? 0
      return t('review.headline', { done, total }) + t('review.headlineStreak', { streak })
    })

    const saved = computed(() => Boolean(reviewStore.review?.id))

    const sendoffInput = computed(() => {
      const topId = wins.value.starred[0]
      const topWin = doneTasks.value.find(t => t.id === topId)
      return {
        mood: mood.value || 'steady',
        doneCount: todayStore.view?.kpis?.todayDone ?? 0,
        totalCount: todayStore.view?.kpis?.todayTotal ?? 0,
        streak: todayStore.view?.kpis?.streak ?? 0,
        topWinTitle: topWin?.title ?? '',
        tomorrowIntent: tomorrowIntent.value,
        frictionTagCount: friction.value.tags.length
      }
    })

    const isFinale = computed(() => currentStep.value === FINALE_STEP)
    const currentStepKey = computed(() => STEP_KEYS[currentStep.value - 1] ?? '')

    // Step 1 requires a mood selection before advancing; other steps are
    // optional (the user might have no wins, no friction, etc.).
    const canAdvance = computed(() => currentStep.value !== 1 || Boolean(mood.value))

    // "Review" on the last input step so it reads as the bridge to the
    // send-off; "Next" everywhere else.
    const nextLabel = computed(() =>
      currentStep.value === TOTAL_STEPS ? t('review.review') : t('review.next')
    )

    // -- Watchers --

    // Auto-focus the first input on each step so the user can type without
    // hunting for the field. Skip step 1 (mood pills) and step 4 when the
    // empty state is showing (no input there).
    watch(currentStep, async () => {
      await nextTick()
      const el = stepRef.value
      if (!el) return
      const first = el.querySelector('textarea, input[type="text"], input:not([type])')
      if (first && typeof first.focus === 'function') {
        first.focus()
      }
    })

    // -- Lifecycle --

    onMounted(async () => {
      await Promise.all([todayStore.load(todayDate), reviewStore.load(todayDate)])
      hydrateFromStore()

      // If a review was already saved today, drop straight into the finale.
      if (saved.value) currentStep.value = FINALE_STEP
    })

    return {
      t,
      TOTAL_STEPS,
      todayStore,
      reviewStore,
      mood,
      wins,
      friction,
      leftoverActions,
      tomorrowIntent,
      editing,
      saved,
      doneTasks,
      pendingTasks,
      headlineCallout,
      sendoffInput,
      showWrenUpsell,
      currentStep,
      currentStepKey,
      isFinale,
      canAdvance,
      nextLabel,
      stepRef,
      leftoverAction,
      setLeftover,
      moveAllToTomorrow,
      finishReview,
      onDismissWrenUpsell,
      onEdit,
      next,
      prev,
      goToStep,
      todayDate
    }

    // -- Functions --

    function hydrateFromStore() {
      const r = reviewStore.review
      if (!r) {
        for (const task of pendingTasks.value) {
          leftoverActions.value[task.id] = { kind: 'tomorrow' }
        }
        return
      }

      if (r.mood) mood.value = r.mood
      const resp = r.responses || emptyResponses()

      if (resp.wins) {
        wins.value = {
          starred: resp.wins.starred ?? [],
          freeText: resp.wins.freeText ?? ''
        }
      }

      if (resp.friction) {
        friction.value = {
          text: resp.friction.text ?? '',
          tags: resp.friction.tags ?? []
        }
      }

      if (resp.tomorrowIntent) tomorrowIntent.value = resp.tomorrowIntent

      const lo = resp.leftovers || emptyResponses().leftovers
      for (const id of lo.tomorrow ?? []) leftoverActions.value[id] = { kind: 'tomorrow' }
      for (const p of lo.picked ?? []) leftoverActions.value[p.id] = { kind: 'pick', date: p.date }
      for (const id of lo.dropped ?? []) leftoverActions.value[id] = { kind: 'drop' }
      for (const id of lo.kept ?? []) leftoverActions.value[id] = { kind: 'keep' }

      for (const task of pendingTasks.value) {
        if (!leftoverActions.value[task.id]) {
          leftoverActions.value[task.id] = { kind: 'tomorrow' }
        }
      }
    }

    function leftoverAction(id) {
      return leftoverActions.value[id] ?? { kind: 'tomorrow' }
    }

    function setLeftover(id, action) {
      leftoverActions.value = { ...leftoverActions.value, [id]: action }
    }

    function moveAllToTomorrow() {
      const next = { ...leftoverActions.value }
      for (const task of pendingTasks.value) {
        next[task.id] = { kind: 'tomorrow' }
      }
      leftoverActions.value = next
    }

    function next() {
      if (!canAdvance.value) return
      currentStep.value = Math.min(currentStep.value + 1, FINALE_STEP)
    }

    function prev() {
      currentStep.value = Math.max(currentStep.value - 1, 1)
    }

    function goToStep(n) {
      // Step 1 has no preconditions; later steps require mood (the only
      // gating decision — keeps the finale from being reachable empty).
      if (n > 1 && !mood.value) {
        currentStep.value = 1
        return
      }

      currentStep.value = Math.max(1, Math.min(n, FINALE_STEP))
    }

    function onEdit() {
      editing.value = true
      currentStep.value = 1
    }

    function composeResponses() {
      const tomorrowIds = []
      const picked = []
      const dropped = []
      const kept = []

      for (const task of pendingTasks.value) {
        const a = leftoverActions.value[task.id] ?? { kind: 'tomorrow' }
        if (a.kind === 'tomorrow') tomorrowIds.push(task.id)
        else if (a.kind === 'pick' && a.date) picked.push({ id: task.id, date: a.date })
        else if (a.kind === 'drop') dropped.push(task.id)
        else if (a.kind === 'keep') kept.push(task.id)
      }

      return {
        wins: { ...wins.value, freeText: wins.value.freeText.trim() },
        friction: { ...friction.value, text: friction.value.text.trim() },
        leftovers: { tomorrow: tomorrowIds, picked, dropped, kept },
        tomorrowIntent: tomorrowIntent.value.trim()
      }
    }

    async function finishReview() {
      if (!mood.value) return

      const responses = composeResponses()
      const prevLeftovers = reviewStore.review?.responses?.leftovers ?? null
      const diff = diffLeftovers(prevLeftovers, responses.leftovers)

      try {
        await reviewStore.save(todayDate, mood.value, responses)
      } catch {
        return
      }

      const failures = await dispatchCarryForward(diff)
      editing.value = false

      if (failures > 0) {
        toastError(new Error('partial'), t('review.sendoff.saveError', { n: failures }))
      } else {
        toastSuccess(t('review.reviewSaved'))
      }
    }

    async function dispatchCarryForward(diff) {
      let failures = 0

      for (const id of diff.tomorrow) {
        try {
          await todayStore.rescheduleTask(id, { scheduledDate: tomorrow })
        } catch {
          failures += 1
        }
      }

      for (const p of diff.picked) {
        try {
          await todayStore.rescheduleTask(p.id, { scheduledDate: p.date })
        } catch {
          failures += 1
        }
      }

      for (const id of diff.dropped) {
        try {
          await deleteTaskById(id)
        } catch {
          failures += 1
        }
      }

      return failures
    }

    async function deleteTaskById(id) {
      const { apolloClient } = await import('@/api/apollo.js')
      const { DELETE_TASK } = await import('@/api/operations/index.js')
      await apolloClient.mutate({ mutation: DELETE_TASK, variables: { id } })
    }

    function onDismissWrenUpsell() {
      showWrenUpsell.value = false
      try {
        window.localStorage.setItem(WREN_UPSELL_DISMISSED_KEY, 'true')
      } catch {
        // localStorage can be blocked; the local ref already hides the card.
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// The whole review is a vertical flex column that fills most of the
// viewport. Progress sticks at the top, the step content lives in the
// middle (vertically centered so each step "lands" in the same place
// visually), and the Back/Next nav sticks to the bottom. This stops the
// Next button from floating mid-page when the step content is short.
.review-view {
  @apply mx-auto flex w-full max-w-[56rem] flex-col;
  min-height: calc(100vh - 8rem);
}

.review-view__progress {
  @apply mb-4 flex items-center gap-4;
}

.review-view__progress-track {
  @apply flex flex-1 items-center gap-1.5;
  list-style: none;
  padding: 0;
  margin: 0;
}

.review-view__progress-item {
  @apply flex-1;
}

.review-view__progress-dot {
  @apply block h-1 w-full rounded-pill bg-rule-soft transition-colors;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent;

  &--done {
    @apply bg-accent opacity-60;
  }

  &--active {
    @apply bg-accent;
  }
}

.review-view__progress-caption {
  @apply shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
}

.review-view__progress-step {
  @apply text-ink;
}

.review-view__progress-sep {
  @apply mx-1 opacity-40;
}

.review-view__progress-label {
  @apply opacity-80;
}

// Step grows to fill the available vertical space and centers its content
// so the prompt + answer sit at the visual midpoint, not pinned to the top.
.review-view__step {
  @apply flex flex-1 flex-col justify-center py-12;
}

.review-view__prompt {
  // Large italic serif is the page focal point — the entire screen
  // resolves around answering this one question.
  @apply font-serif text-[40px] italic leading-tight text-ink;
}

.review-view__callout {
  @apply mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
}

.review-view__body {
  @apply mt-8;
}

.review-view__bulk {
  @apply mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent underline opacity-80;
  @apply hover:opacity-100;
}

.review-view__empty {
  @apply mt-6 text-[16px] text-muted;
}

.review-view__error {
  @apply mt-3 text-[12px] text-bad;
}

// Nav row anchors at the bottom of the column. justify-between keeps Back
// at the left edge and Next at the right edge, no floating mid-page.
.review-view__nav {
  @apply mt-auto flex items-center justify-between gap-3 pt-6;
}

.review-view__upsell {
  @apply mt-8;
}

// Soft fade between steps so the transition feels considered, not jarring.
.review-fade-enter-active,
.review-fade-leave-active {
  transition: opacity 150ms ease-out;
}

.review-fade-enter-from,
.review-fade-leave-to {
  opacity: 0;
}
</style>
