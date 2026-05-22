<template>
  <component
    :is="component"
    v-if="component"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<script>
/** Icon — renders a Heroicons SVG by name from the shared icon map. */
import { computed } from 'vue'
import { outlineIcons, solidIcons } from './iconMap.js'

export default {
  name: 'Icon',
  props: {
    /** Icon name matching a key in the icon map */
    name: { type: String, required: true },
    /** Pixel size applied to width and height */
    size: { type: Number, default: 20 },
    /** Use the solid variant when true; outline by default */
    solid: { type: Boolean, default: false }
  },
  setup(props) {
    // -- Computed --

    /** Resolved icon component from the outline or solid map, or null for unknown names. */
    const component = computed(
      () => (props.solid ? solidIcons : outlineIcons)[props.name] || null
    )

    return { component }
  }
}
</script>
