<template>
  <div class="review-view">
    <AppScreenHeading
      :eyebrow="`${t('nav.withWren')} · ${t('nav.itemDailyReview')}`"
      :title="t('review.headingPrefix')"
      :emphasis="t('review.headingEmphasis')"
    />

    <!-- 1. Open + mood -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.open')" :callout="headlineCallout">
        <MoodPicker v-model="mood" />
      </WrenTurn>
    </section>

    <!-- 2. Wins -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.wins')">
        <WinPicker v-model="wins" :tasks="doneTasks" />
      </WrenTurn>
    </section>

    <!-- 3. Friction -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.friction')">
        <FrictionInput v-model="friction" />
      </WrenTurn>
    </section>

    <!-- 4. Leftovers -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.leftovers')">
        <template v-if="pendingTasks.length">
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
        </template>

        <p v-else class="review-view__empty">
          {{ t('review.leftover.empty') }}
        </p>
      </WrenTurn>
    </section>

    <!-- 5. Tomorrow intent -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.intent')">
        <TomorrowIntent v-model="tomorrowIntent" />
      </WrenTurn>
    </section>

    <!-- 6. Send-off -->
    <section class="review-view__section">
      <SendoffCard
        :input="sendoffInput"
        :saving="reviewStore.saving"
        :disabled="!mood"
        :saved="saved && !editing"
        @finish="finishReview"
        @edit="editing = true"
      />

      <p v-if="reviewStore.error" class="review-view__error">
        {{ reviewStore.error }}
      </p>
    </section>

    <!-- Wren cross-app upsell. Lives below the send-off so the close is the
         emotional closer; the upsell is an offer beneath. -->
    <WrenCrossAppUpsell
      v-if="showWrenUpsell"
      class="review-view__upsell"
      plan="managed_multi_monthly"
      @dismiss="onDismissWrenUpsell"
    />
  </div>
</template>

<script>
/**
 * ReviewView — Wren-led daily review. Composes section components and owns
 * the canonical local state for the in-progress review. Hydrates from the
 * review store on mount; on Finish saves the structured payload + fires
 * carry-forward mutations only for newly-changed leftover decisions.
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import WrenTurn from '@/components/review/WrenTurn.vue'
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
    AppScreenHeading,
    WrenTurn,
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
      // Spec: hide the callout entirely when streak is 0 or total is 0 — keeps
      // the opening from feeling sterile on a freshly-started habit.
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

    // -- Lifecycle --

    onMounted(async () => {
      await Promise.all([todayStore.load(todayDate), reviewStore.load(todayDate)])
      hydrateFromStore()
    })

    return {
      t,
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
      leftoverAction,
      setLeftover,
      moveAllToTomorrow,
      finishReview,
      onDismissWrenUpsell,
      todayDate
    }

    // -- Functions --

    function hydrateFromStore() {
      const r = reviewStore.review
      if (!r) {
        // Default: every pending task gets "tomorrow"
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

      // Tasks not represented in the saved payload (e.g. created after the
      // review was saved) default to "tomorrow".
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
        // Store already toasts; do not fire any carry-forward.
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
      // Inline mutation rather than adding a new store action; the review
      // is the only caller and the today store reload after a deletion is
      // unnecessary here (the user is closing out the day).
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
.review-view {
  // Generous vertical rhythm between sections so each Wren turn reads as
  // its own moment now that there's no card chrome separating them.
  &__section {
    @apply mb-8;
  }

  &__bulk {
    @apply mb-2 inline-block font-mono text-[11px] uppercase tracking-[0.14em] underline opacity-80;
    @apply hover:opacity-100;
  }

  &__empty {
    @apply text-[13px] opacity-80;
  }

  &__error {
    @apply mt-2 text-[12px] text-bad;
  }

  &__upsell {
    @apply mb-5;
  }
}
</style>
