<template>
  <div class="chore-row" :class="{ 'chore-row--dragging': dragging }">
    <span v-if="showHandle" class="chore-row__handle" :aria-hidden="true">
      <AppIcon name="grip" :size="14" />
    </span>

    <AppCheckbox
      :model-value="completedToday"
      :disabled="snoozed"
      @update:model-value="$emit('complete', chore.id)"
    />

    <span class="chore-row__body">
      <span class="chore-row__title-row">
        <button
          type="button"
          class="chore-row__title"
          :class="titleClass"
          @click="$emit('edit', chore.id)"
        >
          {{ chore.title }}
        </button>

        <WrenOriginBadge ref-type="chore" :ref-id="chore.id" />
      </span>

      <span class="chore-row__cadence">
        {{ cadenceText }}
      </span>

      <span v-if="snoozed" class="chore-row__meta">
        <AppIcon name="clock" :size="11" />
        {{ t('chores.snoozedUntil', { date: snoozedUntilDate }) }}
      </span>

      <span v-else-if="chore.skipNextDate" class="chore-row__meta">
        <AppIcon name="arrow-right" :size="11" />
        {{ t('chores.skipNextScheduled', { date: skipNextLabel }) }}
      </span>

      <ChoreRecentStrip :strip="strip" class="chore-row__strip" />
    </span>

    <ChoreStreakBadge :streak="chore.streak" :best-streak="chore.bestStreak ?? 0" />

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
 * ChoreRow — single chore entry with cadence text, 7-dot recent strip,
 * flame streak badge, and an overflow menu (Edit, Snooze 1d/3d/7d/until,
 * Skip next, Resume, Move up/down, Delete). Clicking the title triggers
 * the edit flow.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import ChoreRecentStrip from './ChoreRecentStrip.vue'
import ChoreStreakBadge from './ChoreStreakBadge.vue'
import { formatDayMonth } from '@/utils/date.js'
import { buildRecentStrip, cadenceLabel, isSnoozedNow } from '@/utils/chores.js'

function formatDate(iso) {
  if (!iso) return ''
  return formatDayMonth(new Date(iso))
}

export default {
  name: 'ChoreRow',
  components: { AppCheckbox, AppIcon, WrenOriginBadge, ChoreRecentStrip, ChoreStreakBadge },
  props: {
    chore: { type: Object, required: true },
    /** True when this row is the first in its group — disables Move up. */
    atTop: { type: Boolean, default: false },
    /** True when this row is the last in its group — disables Move down. */
    atBottom: { type: Boolean, default: false },
    /** True to render the desktop drag handle on the left. */
    showHandle: { type: Boolean, default: false },
    /** True while the row is being dragged (parent toggles). */
    dragging: { type: Boolean, default: false }
  },
  emits: [
    'complete',
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
    const snoozedUntilDate = computed(() => formatDate(props.chore.snoozedUntil))
    const skipNextLabel = computed(() => formatDate(props.chore.skipNextDate))
    const strip = computed(() => buildRecentStrip(props.chore))

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
      snoozedUntilDate,
      skipNextLabel,
      strip,
      menuOpen,
      menuTrigger,
      menuList,
      trigger
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
  @apply relative flex items-start gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

  &--dragging {
    @apply opacity-50;
  }

  &__handle {
    @apply absolute left-[-22px] top-1/2 hidden -translate-y-1/2 cursor-grab text-muted;
    @media (pointer: fine) {
      .chore-row:hover & {
        @apply block;
      }
    }
  }

  &__body {
    @apply flex min-w-0 flex-1 flex-col gap-1;
  }

  &__title-row {
    @apply flex items-center gap-1.5;
  }

  &__title {
    @apply block bg-transparent text-left text-[14px];

    &--muted {
      @apply text-muted line-through;
    }

    &--active {
      @apply text-ink hover:underline;
    }
  }

  &__cadence {
    @apply text-[11px] text-muted;
  }

  &__strip {
    @apply mt-1;
  }

  &__meta {
    @apply inline-flex items-center gap-1 text-[11px] text-muted;
  }

  &__menu {
    @apply relative;
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
