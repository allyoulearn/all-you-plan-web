<template>
  <router-link :to="`/spaces/${space.id}`" class="space-card">
    <!-- Color dot -->
    <span
      class="space-card__dot"
      :style="{ background: space.color || '#3ec4c4' }"
    />

    <!-- Icon if set -->
    <span v-if="space.icon" class="space-card__icon" aria-hidden="true">
      {{ space.icon }}
    </span>

    <!-- Name and task count -->
    <div class="space-card__body">
      <p class="space-card__name">{{ space.name }}</p>
      <p v-if="space.taskCount != null" class="space-card__count">
        {{ space.taskCount }} {{ space.taskCount === 1 ? 'task' : 'tasks' }}
      </p>
    </div>

    <!-- Chevron -->
    <ChevronRightIcon class="space-card__chevron" />
  </router-link>
</template>

<script>
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'SpaceCard',
  components: { ChevronRightIcon },
  props: {
    /** Space object */
    space: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.space-card {
  @apply flex items-center gap-3 px-4 py-3 no-underline cursor-pointer;
  @apply border border-white/10 rounded-glass backdrop-blur-glass;
  @apply transition-all duration-150;
  background: rgba(255, 255, 255, 0.03);

  &:hover {
    @apply border-white/20;
    background: rgba(255, 255, 255, 0.06);

    .space-card__chevron {
      @apply opacity-100;
    }
  }

  // ── Color dot ──
  &__dot {
    @apply w-3 h-3 rounded-full flex-shrink-0;
  }

  // ── Icon (emoji-free: only shown if API returns a text glyph) ──
  &__icon {
    @apply text-base leading-none flex-shrink-0;
  }

  // ── Body ──
  &__body {
    @apply flex-1 min-w-0;
  }

  &__name {
    @apply text-sm font-medium text-secondary-100 truncate m-0;
  }

  &__count {
    @apply text-xs text-secondary-500 m-0 mt-0.5;
  }

  // ── Chevron ──
  &__chevron {
    @apply w-4 h-4 text-secondary-500 flex-shrink-0 opacity-0 transition-opacity duration-150;
  }
}
</style>
