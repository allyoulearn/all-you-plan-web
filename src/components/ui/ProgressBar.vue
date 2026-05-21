<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  thin: { type: Boolean, default: false },
})

const pct = computed(() => `${Math.max(0, Math.min(1, props.value)) * 100}%`)
</script>

<template>
  <div
    class="overflow-hidden rounded-pill"
    :class="thin ? 'h-1 bg-rule-soft' : 'h-1.5 bg-paper-3'"
  >
    <div class="h-full rounded-pill bg-accent" :style="{ width: pct }" />
  </div>
</template>
