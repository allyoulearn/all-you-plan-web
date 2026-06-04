<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="t('goals.eyebrow')"
      :title="t('goals.headingPrefix')"
      :emphasis="t('goals.headingEmphasis')"
    >
      <template #meta>
        {{ t('goals.metaLine1') }}<br />{{ t('goals.metaLine2') }}
      </template>
    </AppScreenHeading>

    <!-- Loading state -->
    <div v-if="loading && !goals.length" class="goals__status">
      {{ t('goals.loading') }}
    </div>

    <!-- Error state — sits before the empty branch so a failed load doesn't
         masquerade as "no goals yet". -->
    <AppErrorState
      v-else-if="store.error"
      :message="store.error || t('common.loadError')"
      :retry-label="t('common.retry')"
      @retry="store.load()"
    />

    <!-- Empty state -->
    <div v-else-if="!goals.length" class="goals__empty">
      <div class="goals__empty-eyebrow">
        {{ t('goals.noGoalsYet') }}
      </div>

      <h2 class="goals__empty-h">
        {{ t('goals.emptyHeadingPrefix') }}<br />

        <em>
          {{ t('goals.emptyHeadingEmphasis') }}
        </em>
      </h2>

      <p class="goals__empty-lede">
        {{ t('goals.emptyLede') }}
      </p>

      <div class="goals__empty-actions">
        <AppButton variant="primary" @click="openCreate">
          <AppIcon name="plus" :size="14" /> {{ t('goals.addFirstGoal') }}
        </AppButton>

        <AppButton variant="ghost">
          {{ t('goals.browseExamples') }}
        </AppButton>
      </div>
    </div>

    <!-- Goals content -->
    <template v-else>
      <!-- Action bar -->
      <div class="goals__actions">
        <AppButton variant="primary" @click="openCreate">
          <AppIcon name="plus" :size="14" /> {{ t('goals.newGoal') }}
        </AppButton>

        <AppButton variant="ghost">
          <AppIcon name="filter" :size="12" /> {{ t('goals.allStatuses') }}
        </AppButton>

        <span class="goals__spacer" />

        <AppButton variant="ghost">
          {{ t('goals.yearEndReview') }}
        </AppButton>
      </div>

      <!-- Most active section -->
      <AppSectionHeader :label="t('goals.mostActive')" />

      <!-- Hero goal card -->
      <div v-if="featured" class="goals__hero">
        <div class="goals__hero-top">
          <span class="goals__pill">
            {{ t('goals.pillWriting') }}
          </span>

          <span :class="['goals__status', `goals__status--${featured.status}`]">
            {{ statusLabel(featured.status) }}
          </span>

          <span class="goals__spacer" />

          <span class="goals__mono">
            {{ t('goals.targetPrefix', { date: featured.targetDate }) }}
          </span>

          <GoalCardMenu
            @edit="openEdit(featured)"
            @remove="openRemove(featured)"
          />
        </div>

        <h3 class="goals__hero-title">
          {{ featured.title }}
        </h3>

        <p class="goals__hero-why">
          "{{ featured.why }}"
        </p>

        <div class="goals__hero-bar">
          <div class="goals__bar">
            <i :style="{ width: `${featured.progress * 100}%` }" />
          </div>

          <span class="goals__pct">
            {{ Math.round(featured.progress * 100) }}%
          </span>
        </div>

        <div class="goals__linked">
          <div v-for="l in [...featured.linkedProjects, ...featured.linkedChores]" :key="l.id" class="goals__link">
            <AppIcon :name="l.kind === 'chore' ? 'chores' : 'projects'" :size="13" />

            <span class="goals__link-name">
              {{ l.name }}
            </span>

            <span class="goals__bar goals__bar--inline">
              <i :style="{ width: `${l.progress * 100}%` }" />
            </span>

            <span class="goals__pct">
              {{ Math.round(l.progress * 100) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- All goals section -->
      <AppSectionHeader :label="t('goals.allGoals')" :count="goals.length" />

      <!-- Goal grid -->
      <div class="goals__grid">
        <div v-for="g in rest" :key="g.id" class="goals__card">
          <div class="goals__hero-top">
            <span :class="['goals__status', `goals__status--${g.status}`]">
              {{ statusLabel(g.status) }}
            </span>

            <span class="goals__spacer" />

            <span class="goals__mono">
              {{ g.targetDate }}
            </span>

            <GoalCardMenu
              @edit="openEdit(g)"
              @remove="openRemove(g)"
            />
          </div>

          <h3 class="goals__card-title">
            {{ g.title }}
          </h3>

          <p class="goals__card-why">
            "{{ g.why }}"
          </p>

          <div class="goals__hero-bar">
            <div class="goals__bar">
              <i :style="{ width: `${g.progress * 100}%`, background: g.status === 'risk' ? 'var(--warn)' : 'var(--accent)' }" />
            </div>

            <span class="goals__pct">
              {{ Math.round(g.progress * 100) }}%
            </span>
          </div>

          <div class="goals__linked">
            <div v-for="l in [...g.linkedProjects, ...g.linkedChores]" :key="l.id" class="goals__link">
              <AppIcon :name="l.kind === 'chore' ? 'chores' : 'projects'" :size="12" />

              <span class="goals__link-name">
                {{ l.name }}
              </span>

              <span class="goals__pct">
                {{ Math.round(l.progress * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Wren's pattern read -->
      <AppSectionHeader :label="t('goals.patternRead')" />

      <div class="goals__grid">
        <!-- Risk card -->
        <div class="goals__pattern goals__pattern--accent">
          <div class="goals__pattern-eyebrow goals__pattern-eyebrow--accent">
            {{ riskGoal ? t('goals.riskEyebrow', { title: riskGoal.title }) : t('goals.riskEyebrowNone') }}
          </div>

          <h3 class="goals__pattern-h">
            {{ riskGoal ? t('goals.riskBody', { title: riskGoal.title }) : t('goals.riskBodyNone') }}
          </h3>

          <div class="goals__pattern-actions">
            <AppButton variant="default" class="goals__pattern-btn--invert" @click="riskGoal && openEdit(riskGoal)">
              {{ t('goals.riskActionPrimary') }}
            </AppButton>

            <AppButton variant="ghost" class="goals__pattern-btn--ghost-accent" @click="riskGoal && openEdit(riskGoal)">
              {{ t('goals.riskActionSecondary') }}
            </AppButton>
          </div>
        </div>

        <!-- Suggested goal card -->
        <div class="goals__pattern">
          <div class="goals__pattern-eyebrow">
            {{ t('goals.suggestedEyebrow') }}
          </div>

          <p class="goals__pattern-suggest">
            {{ t('goals.suggestedBody') }}
          </p>

          <div class="goals__pattern-actions">
            <AppButton variant="primary" @click="openCreate">
              {{ t('goals.suggestedCreate') }}
            </AppButton>

            <AppButton variant="ghost">
              {{ t('goals.suggestedNotNow') }}
            </AppButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <CreateGoalModal v-model="showCreate" />

    <EditGoalModal
      :model-value="!!editingGoal"
      :goal="editingGoal"
      @update:model-value="onEditModalToggle"
    />

    <AppConfirmDialog
      :model-value="!!removingGoal"
      :title="t('goals.removeTitle')"
      :message="removingGoal ? t('goals.removeMessage', { title: removingGoal.title }) : ''"
      :confirm-label="t('goals.removeConfirm')"
      :cancel-label="t('common.cancel')"
      :busy="removing"
      :busy-label="t('goals.removing')"
      @update:model-value="onRemoveDialogToggle"
      @confirm="confirmRemove"
    />
  </div>
</template>

<script>
/** GoalsView — top-level Goals tab. Lists active goals + a hero card. */
import { onMounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '@/stores/goals.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import CreateGoalModal from '@/components/goals/CreateGoalModal.vue'
import EditGoalModal from '@/components/goals/EditGoalModal.vue'
import GoalCardMenu from '@/components/goals/GoalCardMenu.vue'

export default {
  name: 'GoalsView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppIcon,
    AppConfirmDialog,
    AppErrorState,
    CreateGoalModal,
    EditGoalModal,
    GoalCardMenu
  },
  setup() {
    const { t } = useI18n()
    const store = useGoalsStore()
    const goals = computed(() => store.goals)
    const loading = computed(() => store.loading)
    // Featured "most active" goal + the remaining goals, derived in the store
    // so the selection logic is unit-tested and shared.
    const featured = computed(() => store.mostActive)
    const rest = computed(() => store.otherGoals)

    // Surface a still-in-motion goal Wren can flag as "at risk" so the
    // pattern-read panel reflects real data rather than a hardcoded title.
    const riskGoal = computed(
      () => goals.value.find(g => g.status === 'risk') ?? null
    )

    const showCreate = ref(false)
    const editingGoal = ref(null)
    const removingGoal = ref(null)
    const removing = ref(false)

    onMounted(() => store.load())

    return {
      t,
      store,
      goals,
      loading,
      featured,
      rest,
      riskGoal,
      showCreate,
      editingGoal,
      removingGoal,
      removing,
      openCreate,
      openEdit,
      openRemove,
      onEditModalToggle,
      onRemoveDialogToggle,
      confirmRemove,
      statusLabel
    }

    function statusLabel(status) {
      if (status === 'risk') return t('goals.statusAtRisk')
      if (status === 'done') return t('goals.statusDone')
      return t('goals.statusOnTrack')
    }

    function openCreate() {
      showCreate.value = true
    }

    function openEdit(goal) {
      editingGoal.value = goal
    }

    function openRemove(goal) {
      removingGoal.value = goal
    }

    function onEditModalToggle(open) {
      if (!open) editingGoal.value = null
    }

    function onRemoveDialogToggle(open) {
      if (!open) removingGoal.value = null
    }

    async function confirmRemove() {
      if (!removingGoal.value || removing.value) return
      removing.value = true

      try {
        await store.archive(removingGoal.value.id)
        removingGoal.value = null
      } catch {
        // toasted by store
      } finally {
        removing.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goals {
  &__status { @apply text-[13px] text-muted; }

  &__empty {
    @apply flex flex-col items-center gap-3.5 rounded-[18px] border border-dashed border-rule-soft bg-paper-2 px-10 py-16 text-center;
  }
  &__empty-eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }
  &__empty-h {
    @apply font-serif font-normal;
    font-size: 36px;
    line-height: 1.1;

    em { font-style: italic; }
  }
  &__empty-lede {
    @apply max-w-md font-serif italic text-ink-2;
    font-size: 18px;
    line-height: 1.4;
  }
  &__empty-actions { @apply mt-2 flex flex-wrap gap-2; }

  &__actions {
    @apply mb-4 flex flex-wrap items-center gap-2;
  }
  &__spacer { @apply flex-1; }

  &__hero {
    @apply mb-4 flex flex-col gap-3 rounded-[16px] p-7 shadow-sm;
    background: var(--paper-2);
  }
  &__hero-top { @apply flex items-center gap-3; }
  &__pill {
    @apply inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium;
    background: var(--paper-3);
    color: var(--ink-2);
  }
  &__status {
    @apply rounded-full px-2.5 py-1 font-mono uppercase;
    font-size: 10px;
    letter-spacing: 0.14em;

    &--ok { background: color-mix(in oklab, var(--ok) 14%, transparent); color: var(--ok); }
    &--risk { background: color-mix(in oklab, var(--warn) 18%, transparent); color: color-mix(in oklab, var(--warn) 80%, var(--ink)); }
    &--done { background: var(--paper-3); color: var(--muted); }
  }
  &__mono {
    @apply font-mono;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 0.06em;
  }
  &__hero-title {
    @apply mt-1 font-serif font-normal;
    font-size: 36px;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  &__hero-why {
    @apply mb-1 font-serif italic;
    color: var(--ink-2);
    font-size: 22px;
  }
  &__hero-bar { @apply flex items-center gap-3 pt-1.5; }
  &__bar {
    @apply flex-1 overflow-hidden rounded-full;
    height: 6px;
    background: var(--paper-3);

    > i {
      @apply block h-full rounded-full;
      background: var(--accent);
    }

    &--inline {
      @apply flex-none;
      width: 140px;
      height: 4px;
      background: var(--rule-soft);
    }
  }
  &__pct {
    @apply text-right font-mono;
    color: var(--muted);
    font-size: 12px;
    min-width: 38px;
  }
  &__linked {
    @apply flex flex-col gap-1.5 border-t border-rule-soft pt-2;
  }
  &__link {
    @apply flex items-center gap-2.5 text-[13px];
    color: var(--ink-2);
  }
  &__link-name { @apply flex-1 font-medium; }

  &__grid {
    @apply grid gap-4;
    grid-template-columns: 1fr 1fr;
  }
  &__card {
    @apply flex flex-col gap-3 rounded-[16px] p-5 shadow-sm;
    background: var(--paper-2);
  }
  &__card-title {
    @apply mt-1 font-serif font-normal;
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  &__card-why {
    @apply mb-1 font-serif italic;
    color: var(--ink-2);
    font-size: 18px;
  }

  // Wren pattern-read cards. The risk card uses the accent fill (white text);
  // the suggested card is a plain paper-2 card.
  &__pattern {
    @apply flex flex-col gap-3 rounded-[16px] p-5 shadow-sm;
    background: var(--paper-2);

    &--accent {
      background: var(--accent);
      color: var(--accent-ink);
    }
  }
  &__pattern-eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;

    &--accent {
      color: color-mix(in oklab, var(--accent-ink) 85%, transparent);
    }
  }
  &__pattern-h {
    @apply m-0 font-serif italic;
    font-size: 20px;
    line-height: 1.2;
  }
  &__pattern-suggest {
    @apply m-0 font-serif italic;
    color: var(--ink-2);
    font-size: 20px;
    line-height: 1.3;
  }
  &__pattern-actions {
    @apply mt-1 flex flex-wrap gap-2;
  }
  // Within the accent card, invert the default button to read on the fill and
  // make the ghost button border/text light.
  &__pattern-btn--invert :deep(.button) {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--paper);
  }
  &__pattern-btn--ghost-accent :deep(.button) {
    color: var(--accent-ink);
    border-color: color-mix(in oklab, var(--accent-ink) 50%, transparent);
  }
}
</style>
