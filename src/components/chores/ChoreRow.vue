<template>
  <div class="chore-row" :class="{ 'chore-row--dragging': dragging }">
    <AppCheckbox
      class="chore-row__check"
      :model-value="completedToday"
      :disabled="snoozed"
      @update:model-value="onCheckboxToggle"
    />

    <div class="chore-row__body">
      <div class="chore-row__title-row">
        <button
          type="button"
          class="chore-row__title"
          :class="titleClass"
          @click="$emit('edit', chore.id)"
        >
          {{ chore.title }}
        </button>

        <WrenOriginBadge ref-type="chore" :ref-id="chore.id" />
      </div>

      <div class="chore-row__sub">
        <span class="chore-row__cadence">
          {{ cadenceText }}
        </span>

        <!-- One-off chores skip the dot strip — it's a recurrence visual and
             reads as broken data when there's no pattern to plot. -->
        <template v-if="!isOnce">
          <span class="chore-row__sub-sep" aria-hidden="true">
            ·
          </span>

          <ChoreRecentStrip :strip="strip" />
        </template>

        <!-- Skip-next is a scheduling state, not a chore "status" — keep it
             as inline meta. Snoozed is now surfaced by the status pill. -->
        <template v-if="chore.skipNextDate && !snoozed">
          <span class="chore-row__sub-sep" aria-hidden="true">
            ·
          </span>

          <span class="chore-row__meta">
            <AppIcon name="arrow-right" :size="11" />
            {{ t('chores.skipNextScheduled', { date: skipNextLabel }) }}
          </span>
        </template>
      </div>
    </div>

    <ChoreStatusPill :status="status" />

    <div class="chore-row__menu">
      <button
        ref="menuTrigger"
        type="button"
        class="chore-row__menu-trigger"
        :aria-label="t('chores.actionsLabel')"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        @click.stop="menuOpen = !menuOpen"
      >
        <AppIcon name="more" :size="16" />
      </button>

      <ul
        v-if="menuOpen"
        ref="menuList"
        class="chore-row__menu-list"
        role="menu"
      >
        <li role="none">
          <button
            type="button"
            role="menuitem"
            class="chore-row__menu-item"
            @click="trigger('edit')"
          >
            {{ t('chores.edit') }}
          </button>
        </li>

        <li v-if="snoozed" role="none">
          <button
            type="button"
            role="menuitem"
            class="chore-row__menu-item"
            @click="trigger('resume')"
          >
            {{ t('chores.resume') }}
          </button>
        </li>

        <template v-else>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              class="chore-row__menu-item"
              @click="trigger('snooze', 1)"
            >
              {{ t('chores.snooze1d') }}
            </button>
          </li>

          <li role="none">
            <button
              type="button"
              role="menuitem"
              class="chore-row__menu-item"
              @click="trigger('snooze', 3)"
            >
              {{ t('chores.snooze3d') }}
            </button>
          </li>

          <li role="none">
            <button
              type="button"
              role="menuitem"
              class="chore-row__menu-item"
              @click="trigger('snooze', 7)"
            >
              {{ t('chores.snooze7d') }}
            </button>
          </li>

          <li role="none">
            <button
              type="button"
              role="menuitem"
              class="chore-row__menu-item"
              @click="trigger('snooze-until')"
            >
              {{ t('chores.snoozeUntil') }}
            </button>
          </li>

          <li role="none">
            <button
              type="button"
              role="menuitem"
              class="chore-row__menu-item"
              @click="trigger('skip-next')"
            >
              {{ t('chores.skipNext') }}
            </button>
          </li>
        </template>

        <li class="chore-row__menu-divider" aria-hidden="true" />

        <li role="none">
          <button
            type="button"
            role="menuitem"
            class="chore-row__menu-item"
            :disabled="atTop"
            @click="trigger('move-up')"
          >
            {{ t('chores.moveUp') }}
          </button>
        </li>

        <li role="none">
          <button
            type="button"
            role="menuitem"
            class="chore-row__menu-item"
            :disabled="atBottom"
            @click="trigger('move-down')"
          >
            {{ t('chores.moveDown') }}
          </button>
        </li>

        <li class="chore-row__menu-divider" aria-hidden="true" />

        <li role="none">
          <button
            type="button"
            role="menuitem"
            class="chore-row__menu-item chore-row__menu-item--danger"
            @click="trigger('delete')"
          >
            {{ t('chores.delete') }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
/**
 * ChoreRow — one habit row. Layout is checkbox · title+cadence+strip ·
 * status pill · menu. Click the title to edit. Streak/best stats live on
 * the Stats view; this row is purely "what's the state of this chore."
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import ChoreRecentStrip from './ChoreRecentStrip.vue'
import ChoreStatusPill from './ChoreStatusPill.vue'
import { formatDayMonth } from '@/utils/date.js'
import { buildRecentStrip, cadenceLabel, choreStatus, isSnoozedNow } from '@/utils/chores.js'

function formatDate(iso) {
  if (!iso) return ''
  return formatDayMonth(new Date(iso))
}

export default {
  name: 'ChoreRow',
  components: { AppCheckbox, AppIcon, WrenOriginBadge, ChoreRecentStrip, ChoreStatusPill },
  props: {
    chore: { type: Object, required: true },
    /** True when this row is the first in its group — disables Move up. */
    atTop: { type: Boolean, default: false },
    /** True when this row is the last in its group — disables Move down. */
    atBottom: { type: Boolean, default: false },
    /** True while the row is being dragged (parent toggles). */
    dragging: { type: Boolean, default: false }
  },
  emits: [
    'complete',
    'uncomplete',
    'snooze',
    'snooze-until',
    'skip-next',
    'resume',
    'edit',
    'delete',
    'move-up',
    'move-down'
  ],
  setup(props, { emit }) {
    const { t } = useI18n()
    const menuOpen = ref(false)
    const menuTrigger = ref(null)
    const menuList = ref(null)

    const snoozed = computed(() => isSnoozedNow(props.chore))

    const completedToday = computed(() => {
      if (!props.chore.lastCompletedOn) return false
      const today = new Date().toLocaleDateString('en-CA')
      return String(props.chore.lastCompletedOn).slice(0, 10) === today
    })

    const titleClass = computed(() => {
      if (snoozed.value) return 'chore-row__title--muted'
      return completedToday.value ? 'chore-row__title--muted' : 'chore-row__title--active'
    })

    const cadenceText = computed(() => cadenceLabel(props.chore.cadence, t))
    const skipNextLabel = computed(() => formatDate(props.chore.skipNextDate))
    const strip = computed(() => buildRecentStrip(props.chore))
    const status = computed(() => choreStatus(props.chore))
    const isOnce = computed(() => props.chore.cadence?.type === 'once')

    onMounted(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    })

    return {
      t,
      snoozed,
      completedToday,
      titleClass,
      cadenceText,
      skipNextLabel,
      strip,
      status,
      isOnce,
      menuOpen,
      menuTrigger,
      menuList,
      trigger,
      onCheckboxToggle
    }

    // Emit "complete" or "uncomplete" depending on which direction the
    // checkbox just moved. AppCheckbox passes the new boolean value.
    function onCheckboxToggle(next) {
      if (next) emit('complete', props.chore.id)
      else emit('uncomplete', props.chore.id)
    }

    function trigger(action, days) {
      menuOpen.value = false

      if (action === 'snooze') {
        const until = new Date()
        until.setDate(until.getDate() + days)
        until.setHours(23, 59, 59, 999)
        emit('snooze', { id: props.chore.id, until: until.toISOString() })
      } else if (action === 'snooze-until') {
        emit('snooze-until', props.chore.id)
      } else if (action === 'skip-next') {
        emit('skip-next', props.chore.id)
      } else if (action === 'resume') {
        emit('resume', props.chore.id)
      } else if (action === 'edit') {
        emit('edit', props.chore.id)
      } else if (action === 'delete') {
        emit('delete', props.chore.id)
      } else if (action === 'move-up') {
        emit('move-up', props.chore.id)
      } else if (action === 'move-down') {
        emit('move-down', props.chore.id)
      }
    }

    function onDocClick(e) {
      if (!menuOpen.value) return
      if (menuTrigger.value?.contains(e.target)) return
      if (menuList.value?.contains(e.target)) return
      menuOpen.value = false
    }

    function onKey(e) {
      if (e.key === 'Escape' && menuOpen.value) {
        e.stopPropagation()
        menuOpen.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chore-row {
  // No row-fill hover — it boxes inside the card's px-5 gutter and looks
  // worse than not hovering at all. Title underline on hover is enough
  // affordance to show the row is interactive.
  @apply relative flex cursor-grab items-center gap-4 border-b border-rule-soft py-4 last:border-0;

  &:active {
    @apply cursor-grabbing;
  }

  &--dragging,
  &--ghost {
    // SortableJS clones the row into the slot it's hovering. The ghost
    // class lands on that placeholder; fade it so it reads as "this is
    // where the row will land" rather than a second instance.
    @apply opacity-30;
  }

  &__check {
    @apply mt-0.5 shrink-0;
  }

  &__body {
    @apply flex min-w-0 flex-1 flex-col gap-1.5;
  }

  &__title-row {
    @apply flex items-center gap-1.5;
  }

  &__title {
    @apply block bg-transparent text-left text-[15px] leading-tight;

    &--muted {
      @apply text-muted line-through;
    }

    &--active {
      @apply text-ink hover:underline;
    }
  }

  &__sub {
    @apply flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted;
  }

  &__cadence {
    @apply text-[12px] text-muted;
  }

  &__sub-sep {
    @apply text-[12px] leading-none text-rule;
  }

  &__meta {
    @apply inline-flex items-center gap-1 text-[12px] text-muted;
  }

  &__menu {
    @apply relative shrink-0;
  }

  &__menu-trigger {
    @apply inline-flex h-7 w-7 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-2 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__menu-list {
    @apply absolute right-0 top-8 z-20 min-w-[170px] rounded-md border border-rule-soft bg-paper py-1 shadow-md;
  }

  &__menu-item {
    @apply flex w-full items-center px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-2;
    @apply disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:bg-transparent;

    &--danger {
      @apply text-bad;
    }
  }

  &__menu-divider {
    @apply my-1 border-t border-rule-soft;
  }
}
</style>
