<template>
  <div class="chore-row">
    <Checkbox
      :model-value="isCompletedToday(chore.lastCompletedOn)"
      :disabled="snoozed"
      @update:model-value="$emit('complete', chore.id)"
    />

    <span class="chore-row__body">
      <span
        class="chore-row__title"
        :class="titleClass"
      >
        {{ chore.title }}
      </span>

      <span v-if="snoozed" class="chore-row__meta">
        <Icon name="clock" :size="11" />

        {{ t('chores.snoozedUntil', { date: snoozedUntilDate }) }}
      </span>

      <span v-else-if="chore.skipNextDate" class="chore-row__meta">
        <Icon name="arrow-right" :size="11" />

        {{ t('chores.skipNextScheduled', { date: skipNextLabel }) }}
      </span>
    </span>

    <Pill variant="default">
      {{ cadenceLabel }}
    </Pill>

    <span class="chore-row__streak" :aria-label="streakAria">
      {{ streakLabel }}
    </span>

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
        <Icon name="more" :size="16" />
      </button>

      <ul
        v-if="menuOpen"
        ref="menuList"
        class="chore-row__menu-list"
        role="menu"
      >
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
              @click="trigger('skip-next')"
            >
              {{ t('chores.skipNext') }}
            </button>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
/**
 * ChoreRow — single chore entry with a completion checkbox, cadence pill,
 * streak counter, and an overflow menu (Snooze 1d / 3d / 7d, Skip next,
 * Resume). While a chore is snoozed the checkbox disables and a "Snoozed
 * until …" meta line appears.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'
import Icon from '@/components/ui/Icon.vue'

const CADENCE_KEY = {
  daily: 'chores.cadenceDaily',
  weekly: 'chores.cadenceWeekly',
  monthly: 'chores.cadenceMonthly'
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default {
  name: 'ChoreRow',
  components: { Checkbox, Pill, Icon },
  props: {
    chore: { type: Object, required: true }
  },
  emits: ['complete', 'snooze', 'skip-next', 'resume'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const menuOpen = ref(false)
    const menuTrigger = ref(null)
    const menuList = ref(null)

    function isCompletedToday(lastCompletedOn) {
      if (!lastCompletedOn) return false
      const today = new Date().toLocaleDateString('en-CA')
      return lastCompletedOn.slice(0, 10) === today
    }

    const snoozed = computed(() => {
      if (!props.chore.snoozedUntil) return false
      return new Date(props.chore.snoozedUntil) > new Date()
    })

    const snoozedUntilDate = computed(() => formatDate(props.chore.snoozedUntil))
    const skipNextLabel = computed(() => formatDate(props.chore.skipNextDate))

    const titleClass = computed(() => {
      if (snoozed.value) return 'chore-row__title--muted'
      return isCompletedToday(props.chore.lastCompletedOn)
        ? 'chore-row__title--muted'
        : 'chore-row__title--active'
    })

    const cadenceLabel = computed(() => {
      const key = CADENCE_KEY[props.chore.cadence.type]
      return key ? t(key) : props.chore.cadence.type
    })

    const streakLabel = computed(() =>
      t('chores.streakShort', { count: props.chore.streak })
    )
    const streakAria = computed(() => t('chores.streakDays', { count: props.chore.streak }))

    function trigger(action, days) {
      menuOpen.value = false
      if (action === 'snooze') {
        // Build an end-of-day timestamp `days` calendar days from now.
        const until = new Date()
        until.setDate(until.getDate() + days)
        until.setHours(23, 59, 59, 999)
        emit('snooze', { id: props.chore.id, until: until.toISOString() })
      } else if (action === 'skip-next') {
        emit('skip-next', props.chore.id)
      } else if (action === 'resume') {
        emit('resume', props.chore.id)
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
      isCompletedToday,
      snoozed,
      snoozedUntilDate,
      skipNextLabel,
      titleClass,
      cadenceLabel,
      streakLabel,
      streakAria,
      menuOpen,
      menuTrigger,
      menuList,
      trigger
    }
  }
}
</script>

<style lang="scss" scoped>
.chore-row {
  @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

  &__body {
    @apply flex min-w-0 flex-1 flex-col;
  }

  &__title {
    @apply block text-[14px];

    &--muted {
      @apply text-muted;
    }

    &--active {
      @apply text-ink;
    }
  }

  &__meta {
    @apply mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted;
  }

  &__streak {
    @apply font-mono text-[11px] tracking-wide text-muted;
  }

  &__menu {
    @apply relative;
  }

  &__menu-trigger {
    @apply inline-flex h-7 w-7 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-2 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__menu-list {
    @apply absolute right-0 top-8 z-20 min-w-[150px] rounded-md border border-rule-soft bg-paper py-1 shadow-md;
  }

  &__menu-item {
    @apply flex w-full items-center px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-2;
  }
}
</style>
