<template>
  <div class="briefing-banner">
    <!-- No briefing: CTA state -->
    <div v-if="!briefing" class="briefing-banner__cta">
      <div class="briefing-banner__cta-text">
        <SparklesIcon class="briefing-banner__cta-icon" />
        <span>{{ t('briefing.generate') }}</span>
      </div>

      <button class="briefing-banner__generate-btn" @click="$emit('generate')">
        {{ t('briefing.generate') }}
      </button>
    </div>

    <!-- Briefing exists -->
    <template v-else>
      <!-- Banner header: greeting + collapse toggle -->
      <div class="briefing-banner__header">
        <p class="briefing-banner__greeting">{{ briefing.greeting }}</p>

        <button
          class="briefing-banner__toggle"
          :aria-label="isExpanded ? 'Collapse' : 'Expand'"
          @click="toggleExpanded"
        >
          <ChevronUpIcon v-if="isExpanded" class="briefing-banner__toggle-icon" />
          <ChevronDownIcon v-else class="briefing-banner__toggle-icon" />
        </button>
      </div>

      <!-- Collapsible body -->
      <div v-if="isExpanded" class="briefing-banner__body">
        <!-- Quick stats row -->
        <div class="briefing-banner__stats">
          <!-- Overdue count -->
          <span
            v-if="briefing.overdueCount > 0"
            class="briefing-banner__stat briefing-banner__stat--overdue"
          >
            {{ briefing.overdueCount }} {{ t('tasks.overdue') }}
          </span>

          <!-- Due today count -->
          <span
            v-if="briefing.dueTodayCount > 0"
            class="briefing-banner__stat briefing-banner__stat--today"
          >
            {{ briefing.dueTodayCount }} {{ t('briefing.dueToday') }}
          </span>

          <!-- Streak -->
          <span v-if="briefing.streak" class="briefing-banner__stat briefing-banner__stat--streak">
            <FireIcon class="briefing-banner__streak-icon" />
            {{ briefing.streak }} {{ t('briefing.streak') }}
          </span>
        </div>

        <!-- Nudge message -->
        <p v-if="briefing.nudge" class="briefing-banner__nudge">
          {{ briefing.nudge }}
        </p>

        <!-- View full briefing link -->
        <router-link to="/briefing" class="briefing-banner__link">
          {{ t('briefing.title') }}
          <ChevronRightIcon class="briefing-banner__link-icon" />
        </router-link>
      </div>
    </template>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon,
  FireIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

export default {
  name: 'BriefingBanner',
  components: { SparklesIcon, FireIcon, ChevronUpIcon, ChevronDownIcon, ChevronRightIcon },
  props: {
    /** Today's briefing object, or null if not yet generated */
    briefing: { type: Object, default: null },
  },
  emits: ['generate'],
  setup() {
    const { t } = useI18n()

    // ── Reactive state ──
    const isExpanded = ref(true)

    return {
      t,
      isExpanded,
      toggleExpanded,
    }

    // ── Function definitions ──

    /** Toggle the expanded/collapsed state of the banner body */
    function toggleExpanded() {
      isExpanded.value = !isExpanded.value
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.briefing-banner {
  @apply rounded-glass border border-white/10 backdrop-blur-glass shadow-glass;
  @apply border-l-4 px-4 py-3;
  background: rgba(255, 255, 255, 0.03);
  border-left-color: theme('colors.primary.500');

  // ── CTA state ──
  &__cta {
    @apply flex items-center justify-between gap-4;
  }

  &__cta-text {
    @apply flex items-center gap-2 text-sm text-secondary-300;
  }

  &__cta-icon {
    @apply w-4 h-4 text-primary-400 flex-shrink-0;
  }

  &__generate-btn {
    @apply flex-shrink-0 px-4 py-1.5 rounded-btn text-sm font-semibold text-white cursor-pointer;
    @apply border-0 transition-all duration-150;
    background: theme('colors.primary.600');

    &:hover {
      background: theme('colors.primary.500');
    }
  }

  // ── Header ──
  &__header {
    @apply flex items-start justify-between gap-3;
  }

  &__greeting {
    @apply text-sm font-medium text-secondary-100 leading-snug m-0;
  }

  &__toggle {
    @apply flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-transparent border-0;
    @apply cursor-pointer text-secondary-500 transition-colors duration-150;

    &:hover {
      @apply bg-white/5 text-secondary-300;
    }
  }

  &__toggle-icon {
    @apply w-4 h-4;
  }

  // ── Body ──
  &__body {
    @apply mt-2.5 flex flex-col gap-2;
  }

  // ── Stats row ──
  &__stats {
    @apply flex flex-wrap items-center gap-2;
  }

  &__stat {
    @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold;

    &--overdue {
      @apply bg-danger/20 text-danger;
    }

    &--today {
      @apply bg-primary-500/20 text-primary-300;
    }

    &--streak {
      background: rgba(249, 229, 77, 0.15);
      color: #f9e54d;
    }
  }

  &__streak-icon {
    @apply w-3 h-3;
  }

  // ── Nudge message ──
  &__nudge {
    @apply text-xs text-secondary-400 italic leading-relaxed m-0;
  }

  // ── View full briefing link ──
  &__link {
    @apply inline-flex items-center gap-1 text-xs font-medium text-primary-400 no-underline;
    @apply transition-colors duration-150;

    &:hover {
      @apply text-primary-300;
    }
  }

  &__link-icon {
    @apply w-3.5 h-3.5;
  }
}
</style>
