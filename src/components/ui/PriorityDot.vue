<template>
  <span
    class="priority-dot"
    :class="`priority-dot--${value}`"
    :style="{ '--priority-dot-size': `${size}px` }"
    :aria-label="ariaLabel"
    role="img"
  />
</template>

<script>
/**
 * PriorityDot — a small colored dot indicating a task's priority.
 * Sized via the `size` prop (defaults to 8px), color driven by the priority
 * value. Stays visually quiet for normal/low so non-urgent tasks aren't
 * shouting at the user from the board.
 */
export default {
  name: 'PriorityDot',
  props: {
    /** One of 'urgent' | 'high' | 'normal' | 'low'. */
    value: {
      type: String,
      default: 'normal',
      validator: v => ['urgent', 'high', 'normal', 'low'].includes(v)
    },
    /** Pixel diameter. */
    size: { type: Number, default: 8 },
    /** Optional accessible label; defaults to the priority value. */
    ariaLabel: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.priority-dot {
  width: var(--priority-dot-size, 8px);
  height: var(--priority-dot-size, 8px);
  @apply inline-block shrink-0 rounded-pill;

  &--urgent {
    @apply bg-bad;
  }

  &--high {
    @apply bg-warn;
  }

  &--normal {
    @apply bg-muted opacity-60;
  }

  &--low {
    @apply bg-muted opacity-30;
  }
}
</style>
