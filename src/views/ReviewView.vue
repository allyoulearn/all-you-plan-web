<script setup>
import { ref, computed, onMounted } from 'vue'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { useTodayStore } from '@/stores/today.store'
import { useReviewStore } from '@/stores/review.store'

const todayStore = useTodayStore()
const reviewStore = useReviewStore()

const MOODS = ['heavy', 'low', 'ok', 'good', 'alight']
const mood = ref('')

const todayDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const doneTasks = computed(() => (todayStore.view?.tasks ?? []).filter((t) => t.done))
const pendingTasks = computed(() => (todayStore.view?.tasks ?? []).filter((t) => !t.done))

onMounted(async () => {
  await Promise.all([todayStore.load(todayDate.value), reviewStore.load(todayDate.value)])
  if (reviewStore.review?.mood) {
    mood.value = reviewStore.review.mood
  }
})

async function finishReview() {
  await reviewStore.save(todayDate.value, mood.value, {
    moved: doneTasks.value.map((t) => t.id),
    pending: pendingTasks.value.map((t) => t.id),
  })
}
</script>

<template>
  <div>
    <ScreenHeading eyebrow="With Wren · Daily review" title="How did" emphasis="today feel?" />

    <!-- Step 1 — Mood -->
    <Card class="mb-5">
      <p class="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Step 1 — How was your energy today?
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
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
      <p class="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Step 2 — What moved forward
      </p>
      <div v-if="todayStore.loading" class="mt-2 text-[13px] text-muted">Loading…</div>
      <div v-else-if="doneTasks.length" class="mt-2 flex flex-col gap-1">
        <div
          v-for="task in doneTasks"
          :key="task.id"
          class="flex items-center gap-2.5 py-1 text-[14px] text-ink"
        >
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-ok" />
          <span class="line-through opacity-60">{{ task.title }}</span>
        </div>
      </div>
      <p v-else class="mt-2 text-[13px] text-muted">No completed tasks today.</p>
    </Card>

    <!-- Step 3 — What didn't -->
    <Card class="mb-5">
      <p class="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Step 3 — What didn't finish
      </p>
      <div v-if="todayStore.loading" class="mt-2 text-[13px] text-muted">Loading…</div>
      <div v-else-if="pendingTasks.length" class="mt-2 flex flex-col gap-1">
        <div
          v-for="task in pendingTasks"
          :key="task.id"
          class="flex items-center gap-2.5 py-1 text-[14px] text-ink"
        >
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-paper-3 border border-rule-soft" />
          {{ task.title }}
        </div>
      </div>
      <p v-else class="mt-2 text-[13px] text-muted">Everything got done — great day.</p>
    </Card>

    <!-- Step 4 — Send-off -->
    <Card variant="accent" class="mb-5">
      <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink opacity-70">
        Step 4 — Wren's send-off
      </p>
      <p class="mt-3 font-serif text-[20px] italic leading-snug text-accent-ink">
        "Every day that ends is a day you showed up. That's enough."
      </p>
      <div class="mt-5">
        <Button
          variant="default"
          :disabled="!mood || reviewStore.saving"
          @click="finishReview"
        >
          {{ reviewStore.saving ? 'Saving…' : 'Finish review' }}
        </Button>
      </div>
      <p v-if="reviewStore.review?.id && !reviewStore.saving" class="mt-3 font-mono text-[11px] text-accent-ink opacity-70">
        Review saved.
      </p>
      <p v-if="reviewStore.error" class="mt-2 text-[12px] text-bad">{{ reviewStore.error }}</p>
    </Card>
  </div>
</template>
