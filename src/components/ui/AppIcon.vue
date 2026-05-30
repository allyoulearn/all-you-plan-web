<template>
  <component
    :is="component"
    v-if="component"
    :style="{ '--icon-size': `${size}px` }"
    class="icon"
    aria-hidden="true"
  />
</template>

<script>
/** AppIcon — renders a Heroicons SVG by name from the shared icon map. */
import { computed } from 'vue'
import { outlineIcons, solidIcons } from './iconMap.js'

export default {
  name: 'AppIcon',
  props: {
    /** AppIcon name matching a key in the icon map */
    name: { type: String, required: true },
    /** Pixel size applied to width and height */
    size: { type: Number, default: 20 },
    /** Use the solid variant when true; outline by default */
    solid: { type: Boolean, default: false }
  },
  setup(props) {
    // -- Computed --

    /** Resolved icon component from the outline or solid map, or null for unknown names. */
    const component = computed(() => {
      const resolved = (props.solid ? solidIcons : outlineIcons)[props.name] || null

      if (import.meta.env.DEV && !resolved) {
        console.warn(`[AppIcon] Unknown icon name: "${props.name}"`)
      }

      return resolved
    })

    return { component }
  }
}
</script>

<style scoped>
/* Size driven by a CSS custom property set inline by the consumer via the
   `size` prop. Keeps layout declarations in the stylesheet. */
.icon {
  width: var(--icon-size, 20px);
  height: var(--icon-size, 20px);
}
</style>
