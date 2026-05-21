<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: '' },
  iconTrailing: { type: String, default: '' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})

const variants = {
  default: 'bg-paper-2 text-ink border border-rule-soft hover:bg-paper-3 hover:border-muted',
  primary: 'bg-ink text-paper border border-ink hover:brightness-90',
  accent: 'bg-accent text-accent-ink border border-accent hover:brightness-95',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-paper-3',
}
const sizes = { sm: 'text-[12px] px-3 py-1.5', md: 'text-[13px] px-4 py-2' }
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center gap-2 rounded-pill font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variants[variant], sizes[size]]"
  >
    <Icon v-if="icon" :name="icon" :size="16" />
    <slot />
    <Icon v-if="iconTrailing" :name="iconTrailing" :size="16" />
  </button>
</template>
