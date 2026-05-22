<template>
  <div>
    <ScreenHeading eyebrow="With Wren · Daily review" title="How did" emphasis="today feel?" />

    <!-- Step 1 — Mood -->
    <Card class="mb-5">
      <p class="review-view__step-label">
        Step 1 — How was your energy today?
      </p>

      <div class="review-view__mood-row">
        <Button
          v-for="m in MOODS"
          :key="m"
          :variant="mood === m ? 'accent' : 'default'"
          size="sm"
          @click="mood = m"
        >
          {{ m }}
        </Button>
      </div>
    </Card>

    <!-- Step 2 — What moved -->
    <Card class="mb-5">
      <p class="review-view__step-label">
        Step 2 — What moved forward
      </p>

      <div v-if="todayStore.loading" class="review-view__loading">
        Loading…
      </div>

      <div v-else-if="doneTasks.length" class="review-view__task-list">
        <div
          v-for="task in doneTasks"
          :key="task.id"
          class="review-view__task-row"
        >
          <span class="review-view__task-dot review-view__task-dot--ok" />

          <span class="review-view__task-title review-view__task-title--done">
            {{ task.title }}
          </span>
        </div>
      </div>

      <p v-else class="review-view__empty">
        No completed tasks today.
      </p>
    </Card>

    <!-- Step 3 — What didn't -->
    <Card class="mb-5">
      <p class="review-view__step-label">
        Step 3 — What didn't finish
      </p>

      <div v-if="todayStore.loading" class="review-view__loading">
        Loading…
      </div>

      <div v-else-if="pendingTasks.length" class="review-view__task-list">
        <div
          v-for="task in pendingTasks"
          :key="task.id"
          class="review-view__task-row"
        >
          <span class="review-view__task-dot review-view__task-dot--pending" />
          {{ task.title }}
        </div>
      </div>

      <p v-else class="review-view__empty">
        Everything got done — great day.
      </p>
    </Card>

    <!-- Step 4 — Send-off -->
    <Card variant="accent" class="mb-5">
      <p class="review-view__sendoff-label">
        Step 4 — Wren's send-off
      </p>

      <p class="review-view__sendoff-quote">
        "Every day that ends is a day you showed up. That's enough."
      </p>

      <div class="review-view__sendoff-action">
        <Button
          variant="default"
          :disabled="!mood || reviewStore.saving"
          @click="finishReview"
        >
          {{ reviewStore.saving ? 'Saving…' : 'Finish review' }}
        </Button>
      </div>

      <p v-if="reviewStore.review?.id && !reviewStore.saving" class="review-view__saved-note">
        Review saved.
      </p>

      <p v-if="reviewStore.error" class="review-view__error-note">
        {{ reviewStore.error }}
      </p>
    </Card>
  </div>
</template>

<script>
/** ReviewView — guided daily review with mood selector, task summary, and Wren send-off card. */
import { ref, computed, onMounted } from 'vue'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { useTodayStore } from '@/stores/today.store.js'
import { useReviewStore } from '@/stores/review.store.js'

const MOODS = ['heavy', 'low', 'ok', 'good', 'alight']

export default {
  name: 'ReviewView',
  components: { ScreenHeading, Card, Button },
  setup() {
    // -- State --
    const todayStore = useTodayStore()
    const reviewStore = useReviewStore()
    const mood = ref('')

    // -- Computed --

    /** ISO date string for today, used to load and save the review. */
    const todayDate = computed(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })

    /** Tasks from today's view that are marked done. */
    const doneTasks = computed(() => (todayStore.view?.tasks ?? []).filter((t) => t.done))

    /** Tasks from today's view that are not yet done. */
    const pendingTasks = computed(() => (todayStore.view?.tasks ?? []).filter((t) => !t.done))

    // -- Lifecycle --
    onMounted(async () => {
      await Promise.all([todayStore.load(todayDate.value), reviewStore.load(todayDate.value)])
      if (reviewStore.review?.mood) {
        mood.value = reviewStore.review.mood
      }
    })

    // -- Function definitions --

    /** Persists the review with the selected mood and task lists. */
    async function finishReview() {
      await reviewStore.save(todayDate.value, mood.value, {
        moved: doneTasks.value.map((t) => t.id),
        pending: pendingTasks.value.map((t) => t.id),
      })
    }

    return {
      MOODS,
      todayStore,
      reviewStore,
      mood,
      doneTasks,
      pendingTasks,
      finishReview,
    }
  }
}
</script>

<style lang="scss" scoped>
.review-view {
  &__step-label {
    @apply mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__mood-row {
    @apply mt-3 flex flex-wrap gap-2;
  }

  &__loading {
    @apply mt-2 text-[13px] text-muted;
  }

  &__task-list {
    @apply mt-2 flex flex-col gap-1;
  }

  &__task-row {
    @apply flex items-center gap-2.5 py-1 text-[14px] text-ink;
  }

  &__task-dot {
    @apply mt-0.5 h-1.5 w-1.5 shrink-0 rounded-pill;

    &--ok {
      @apply bg-ok;
    }

    &--pending {
      @apply border border-rule-soft bg-paper-3;
    }
  }

  &__task-title {
    &--done {
      @apply line-through opacity-60;
    }
  }

  &__empty {
    @apply mt-2 text-[13px] text-muted;
  }

  &__sendoff-label {
    @apply font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink opacity-70;
  }

  &__sendoff-quote {
    @apply mt-3 font-serif text-[20px] italic leading-snug text-accent-ink;
  }

  &__sendoff-action {
    @apply mt-5;
  }

  &__saved-note {
    @apply mt-3 font-mono text-[11px] text-accent-ink opacity-70;
  }

  &__error-note {
    @apply mt-2 text-[12px] text-bad;
  }
}
</style>
