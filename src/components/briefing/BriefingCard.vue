<template>
  <div :class="['brief', stateClass]">
    <!-- Header: avatar, name, actions -->
    <div class="brief__head">
      <!-- Avatar -->
      <div class="brief__avatar">
        W
      </div>

      <!-- Name and subtitle -->
      <div class="brief__name-wrap">
        <div class="brief__name">
          {{ headerName }}
        </div>

        <div class="brief__when">
          {{ headerSub }}
        </div>
      </div>

      <!-- Header action buttons -->
      <div class="brief__actions">
        <button
          v-if="state !== 'loading'"
          type="button"
          class="brief__circ"
          :aria-label="$t('briefing.regenerate')"
          @click="onRegenerate"
        >
          <AppIcon name="bolt" :size="14" />
        </button>

        <button
          v-if="state === 'normal'"
          type="button"
          class="brief__circ"
          :aria-label="$t('briefing.talkToWren')"
          @click="$emit('talk')"
        >
          <AppIcon name="chat" :size="14" />
        </button>
      </div>
    </div>

    <!-- Loading shimmer -->
    <template v-if="state === 'loading'">
      <div class="brief__shim" />

      <div class="brief__shim brief__shim--80" />

      <div class="brief__shim brief__shim--60" />
    </template>

    <!-- Greeting body -->
    <p v-else class="brief__body">
      {{ greeting }}
    </p>

    <!-- Action chips -->
    <div v-if="state === 'normal' && actions.length" class="brief__chips">
      <button
        v-for="a in actions"
        :key="a.id"
        type="button"
        class="brief__chip"
        @click="$emit('action', a)"
      >
        <AppIcon :name="iconForKind(a.kind)" :size="12" />
        {{ a.label }}
      </button>
    </div>

    <!-- All-clear footer -->
    <div v-if="state === 'all-clear'" class="brief__foot">
      <span class="brief__muted">
        {{ $t('briefing.allClearTip') }}
      </span>
    </div>
  </div>
</template>

<script>
/**
 * BriefingCard — Wren's morning briefing.
 *
 * Renders four visual variants driven by `state`:
 *   - normal: orange card with greeting + action chips
 *   - loading: shimmer rows while the briefing query is in flight
 *   - all-clear: subtle card with celebratory copy
 *   - resting: muted card with scripted fallback (LLM unavailable)
 *
 * The greeting copy is tone-tuned upstream by the resolver; this component
 * just displays it. Action chips emit `action` with the full action object so
 * the host view can route to schedule / snooze / capture flows.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

const ICONS = {
  schedule: 'calendar',
  snooze: 'check',
  capture: 'plus'
}

export default {
  name: 'BriefingCard',
  components: { AppIcon },
  props: {
    state: { type: String, default: 'normal' },
    greeting: { type: String, default: '' },
    tone: { type: String, default: 'warm' },
    actions: { type: Array, default: () => [] }
  },
  emits: ['talk', 'action', 'regenerate'],
  setup(props, { emit }) {
    const { t } = useI18n()

    /** BEM modifier map for the outer wrapper, driven by the `state` prop. */
    const stateClass = computed(() => ({
      'brief--loading': props.state === 'loading',
      'brief--celebratory': props.state === 'all-clear' || props.state === 'all_clear',
      'brief--resting': props.state === 'resting'
    }))

    /** Header name string, swapped to the resting variant when Wren is offline. */
    const headerName = computed(() => {
      if (props.state === 'resting') return t('briefing.headerNameResting')
      return t('briefing.headerName')
    })

    /** Header subtitle copy, keyed off the current `state` and the active tone. */
    const headerSub = computed(() => {
      if (props.state === 'resting') return t('briefing.headerSubResting')
      if (props.state === 'all-clear' || props.state === 'all_clear') return t('briefing.headerSubAllClear')
      if (props.state === 'loading') return t('briefing.headerSubLoading')
      return t('briefing.headerSubNormal', { tone: props.tone })
    })

    return { stateClass, headerName, headerSub, iconForKind, onRegenerate }

    // -- Function definitions --

    /**
     * Resolve an action-kind string to the matching AppIcon name.
     * @param {string} kind
     * @returns {string}
     */
    function iconForKind(kind) {
      return ICONS[kind] ?? 'plus'
    }

    /** Forward a regenerate request to the parent view. */
    function onRegenerate() {
      emit('regenerate')
    }
  }
}
</script>

<style lang="scss" scoped>
.brief {
  @apply mb-7 flex flex-col gap-3.5 rounded-[18px] p-6;
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 12px 40px -12px color-mix(in oklab, var(--accent) 55%, transparent);

  &--celebratory {
    @apply border border-rule-soft shadow-none;
    background: var(--paper-2);
    color: var(--ink);
  }

  &--resting {
    @apply shadow-none;
    background: var(--paper-3);
    color: var(--ink-2);
  }

  &--loading {
    @apply shadow-sm;
    background: var(--paper-2);
    color: var(--ink);
  }

  &__head {
    @apply flex items-center gap-3;
  }

  &__avatar {
    @apply grid h-9 w-9 place-items-center rounded-full font-serif italic;
    background: rgba(255, 255, 255, 0.2);
    font-size: 20px;
  }

  .brief--celebratory &__avatar,
  .brief--loading &__avatar {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .brief--resting &__avatar {
    background: var(--rule-soft);
    color: var(--muted);
  }

  &__name-wrap {
    @apply flex flex-col;
  }
  &__name {
    @apply font-serif italic leading-none;
    font-size: 22px;
  }
  &__when {
    @apply mt-0.5 font-mono uppercase tracking-wider opacity-80;
    font-size: 11px;
    letter-spacing: 0.06em;
  }

  &__actions {
    @apply ml-auto flex gap-2;
  }

  &__circ {
    @apply grid h-7 w-7 place-items-center rounded-full;
    background: rgba(255, 255, 255, 0.2);
  }
  .brief--celebratory &__circ,
  .brief--resting &__circ,
  .brief--loading &__circ {
    background: var(--paper-3);
    color: var(--ink-2);
  }

  &__body {
    @apply m-0 font-serif italic leading-snug;
    font-size: 26px;
    letter-spacing: -0.005em;
  }
  .brief--celebratory &__body,
  .brief--loading &__body { color: var(--ink); }
  .brief--resting &__body { color: var(--ink-2); }

  &__chips {
    @apply mt-1 flex flex-wrap gap-2;
  }

  &__chip {
    @apply inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium;
    background: rgba(255, 255, 255, 0.95);
    color: #1a1814;
    white-space: nowrap;
  }
  .brief--celebratory &__chip,
  .brief--loading &__chip {
    background: var(--paper-3);
    color: var(--ink);
  }

  &__foot {
    @apply flex items-center gap-2.5 pt-1.5 text-xs opacity-80;
  }

  &__muted {
    color: inherit;
  }

  &__shim {
    @apply relative mb-2 overflow-hidden rounded-md;
    height: 22px;
    background: rgba(255, 255, 255, 0.25);

    &--80 { width: 80%; }
    &--60 { width: 60%; }

    &::after {
      content: '';
      @apply absolute inset-0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
      animation: brief-shim 1.4s infinite;
    }
  }
  .brief--celebratory &__shim,
  .brief--loading &__shim,
  .brief--resting &__shim {
    background: var(--paper-3);
    &::after {
      background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent);
    }
  }
}

@keyframes brief-shim {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
