<template>
  <div
    class="progress-ring"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      class="progress-ring__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <circle
        class="progress-ring__track"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
      />
      <circle
        class="progress-ring__value"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${center} ${center})`"
      />
    </svg>
    <div class="progress-ring__center">
      <slot />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ProgressRing',
  props: {
    /** Progress value, 0-100. Clamped. */
    value: { type: Number, default: 0 },
    /** Outer diameter in pixels. */
    size: { type: Number, default: 44 },
    /** Ring stroke width in pixels. */
    stroke: { type: Number, default: 4 },
    /** Stroke colour of the progress arc. */
    color: { type: String, default: '#1b9e9e' },
  },
  setup(props) {
    const center = computed(() => props.size / 2)
    const radius = computed(() => (props.size - props.stroke) / 2)
    const circumference = computed(() => 2 * Math.PI * radius.value)

    /** Dash offset that renders the clamped value as an arc length. */
    const dashOffset = computed(() => {
      const clamped = Math.min(100, Math.max(0, props.value))
      return circumference.value * (1 - clamped / 100)
    })

    return { center, radius, circumference, dashOffset }
  },
}
</script>

<style lang="scss" scoped>
.progress-ring {
  @apply relative flex-shrink-0;

  &__svg {
    @apply block;
  }

  &__track {
    stroke: rgba(255, 255, 255, 0.08);
  }

  &__value {
    transition: stroke-dashoffset 0.4s ease-out;
  }

  &__center {
    @apply absolute inset-0 flex items-center justify-center;
  }
}
</style>
