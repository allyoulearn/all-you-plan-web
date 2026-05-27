<template>
  <div class="chore-recent-strip" :aria-label="ariaLabel">
    <span
      v-for="day in strip"
      :key="day.iso"
      :title="day.iso"
      class="chore-recent-strip__dot"
      :class="`chore-recent-strip__dot--${day.state}`"
    />
  </div>
</template>

<script>
/** ChoreRecentStrip — 7-dot strip showing last week of completions (oldest left, today right). */
import { computed } from 'vue'

export default {
  name: 'ChoreRecentStrip',
  props: {
    /** Array of 7 entries: { iso: 'YYYY-MM-DD', state: 'done'|'missed'|'not-due' } */
    strip: { type: Array, required: true }
  },
  setup(props) {
    const ariaLabel = computed(() => {
      const done = props.strip.filter(d => d.state === 'done').length
      const due = props.strip.filter(d => d.state !== 'not-due').length
      return `${done} of ${due} completed in the last 7 days`
    })
    return { ariaLabel }
  }
}
</script>

<style lang="scss" scoped>
.chore-recent-strip {
  @apply inline-flex items-center gap-1;

  &__dot {
    @apply block h-1.5 w-1.5 rounded-pill;

    &--done {
      @apply bg-ok;
    }

    &--missed {
      @apply border border-rule-soft bg-transparent;
    }

    &--not-due {
      @apply bg-rule-soft opacity-60;
    }
  }
}
</style>
