<template>
  <component
    :is="component"
    v-if="component"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue'
import { outlineIcons, solidIcons } from './iconMap.js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  solid: { type: Boolean, default: false },
})

const component = computed(
  () => (props.solid ? solidIcons : outlineIcons)[props.name] || null,
)
</script>
